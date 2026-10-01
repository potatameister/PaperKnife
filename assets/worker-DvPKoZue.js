/* eslint-env worker */
/* global FS, callMain, EXITSTATUS */

var qpdfReady = false;
var qpdfInitError = null;
var qpdfInitPromise = null;
var qpdfWasmUrl = '';
var currentStdout = [];
var currentStderr = [];

var Module = {
  thisProgram: 'qpdf',
  noInitialRun: true,
  print: function(text) {
    currentStdout.push(String(text));
  },
  printErr: function(text) {
    currentStderr.push(String(text));
  },
  onRuntimeInitialized: function() {
    qpdfReady = true;
    if (qpdfInitPromise) qpdfInitPromise.resolve();
  },
  locateFile: function(path, prefix) {
    if (path.endsWith('.wasm') && qpdfWasmUrl) return qpdfWasmUrl;
    return prefix + path;
  },
  quit: function(status, toThrow) {
    if (toThrow) throw toThrow;
    throw status;
  }
};

self.onmessage = async function(event) {
  var message = event.data || {};

  if (message.type === 'init') {
    await handleInit(message);
    return;
  }

  if (message.type === 'run') {
    await handleRun(message);
    return;
  }

  if (message.type === 'destroy') {
    self.close();
  }
};

async function handleInit(message) {
  try {
    await initQpdf(message.qpdfJsUrl, message.wasmUrl);
    postMessage({ id: message.id, ok: true, type: 'ready' });
  } catch (error) {
    postMessage({
      id: message.id,
      ok: false,
      type: 'error',
      code: 'QPDF_INIT_FAILED',
      message: error && error.message || String(error)
    });
  }
}

async function handleRun(message) {
  var startedAt = Date.now();
  currentStdout = [];
  currentStderr = [];

  try {
    await initQpdf(message.qpdfJsUrl, message.wasmUrl);
    validateRunMessage(message);

    var inputNames = Object.keys(message.inputs || {});
    var outputNames = message.outputs || [];
    var touched = inputNames.concat(outputNames);

    cleanupFiles(touched);
    writeInputs(message.inputs);

    var exitCode = executeQpdf(message.args || []);
    // Exit code 3 means "success with warnings" in QPDF — the output file is produced.
    // Only treat non-zero codes other than 3 as fatal errors.
    if (exitCode !== 0 && exitCode !== 3) {
      throw makeWorkerError('QPDF_EXEC_FAILED', 'qpdf exited with status ' + exitCode, exitCode);
    }

    var outputs = readOutputs(outputNames);
    cleanupFiles(touched);

    var transfers = Object.keys(outputs).map(function(name) {
      return outputs[name].buffer;
    });

    postMessage({
      id: message.id,
      ok: true,
      outputs: outputs,
      stdout: currentStdout.slice(),
      stderr: currentStderr.slice(),
      warnings: getWarnings(currentStderr),
      exitCode: exitCode,
      durationMs: Date.now() - startedAt
    }, transfers);
  } catch (error) {
    postMessage({
      id: message.id,
      ok: false,
      code: error && error.code || 'QPDF_EXEC_FAILED',
      message: error && error.message || String(error),
      stdout: currentStdout.slice(),
      stderr: currentStderr.slice(),
      exitCode: Number.isFinite(error && error.exitCode) ? error.exitCode : null,
      durationMs: Date.now() - startedAt
    });
  }
}

function initQpdf(qpdfJsUrl, wasmUrl) {
  if (qpdfReady) return Promise.resolve();
  if (qpdfInitError) return Promise.reject(qpdfInitError);
  if (qpdfInitPromise) return qpdfInitPromise.promise;

  qpdfWasmUrl = wasmUrl || qpdfWasmUrl;
  qpdfInitPromise = {};
  qpdfInitPromise.promise = new Promise(function(resolve, reject) {
    qpdfInitPromise.resolve = resolve;
    qpdfInitPromise.reject = reject;
  });

  try {
    if (!qpdfJsUrl) throw new Error('qpdf worker requires qpdfJsUrl.');
    importScripts(qpdfJsUrl);
  } catch (error) {
    qpdfInitError = error;
    qpdfInitPromise.reject(error);
  }

  return qpdfInitPromise.promise;
}

function validateRunMessage(message) {
  if (!message.inputs || !Object.keys(message.inputs).length) {
    throw makeWorkerError('QPDF_INVALID_INPUT', 'qpdf.run requires inputs.');
  }
  if (!Array.isArray(message.args) || !message.args.length) {
    throw makeWorkerError('QPDF_INVALID_INPUT', 'qpdf.run requires args.');
  }
  if (!Array.isArray(message.outputs) || !message.outputs.length) {
    throw makeWorkerError('QPDF_INVALID_INPUT', 'qpdf.run requires outputs.');
  }
}

function writeInputs(inputs) {
  Object.keys(inputs || {}).forEach(function(name) {
    var bytes = normalizeBytes(inputs[name]);
    FS.createDataFile('/', name, bytes, true, false);
  });
}

function executeQpdf(args) {
  var status = 0;
  try {
    var result = callMain(args);
    status = Number.isFinite(result) ? result : getExitStatus();
  } catch (error) {
    status = getExitStatus();
    if (!status) throw error;
  }
  return Number.isFinite(status) ? status : 0;
}

function readOutputs(outputNames) {
  var outputs = {};
  outputNames.forEach(function(name) {
    if (!FS.analyzePath(name).exists) {
      throw makeWorkerError('QPDF_OUTPUT_MISSING', 'qpdf did not produce expected output: ' + name, null);
    }
    var bytes = FS.readFile(name, { encoding: 'binary' });
    outputs[name] = new Uint8Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  });
  return outputs;
}

function cleanupFiles(names) {
  (names || []).forEach(function(name) {
    try {
      if (FS.analyzePath(name).exists) FS.unlink(name);
    } catch (error) {
      currentStderr.push('cleanup failed for ' + name + ': ' + (error && error.message || String(error)));
    }
  });
}

function normalizeBytes(bytes) {
  if (bytes instanceof Uint8Array) return bytes;
  if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes);
  if (ArrayBuffer.isView(bytes)) {
    return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  throw makeWorkerError('QPDF_INVALID_INPUT', 'input bytes must be Uint8Array, ArrayBuffer, or typed-array view.');
}

function getExitStatus() {
  return typeof EXITSTATUS === 'number' ? EXITSTATUS : 0;
}

function getWarnings(stderr) {
  return (stderr || []).filter(function(line) {
    return /^warning:/i.test(String(line).trim());
  });
}

function makeWorkerError(code, message, exitCode) {
  var error = new Error(message);
  error.code = code;
  error.exitCode = exitCode;
  return error;
}
