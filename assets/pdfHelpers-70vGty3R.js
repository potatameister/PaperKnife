import{c}from"./index-BIa2FiX5.js";import{g as s,G as d}from"./pdf-viewer-DFtpL4X_.js";/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=c("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=c("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]),u="/PaperKnife/assets/pdf.worker.min-LyOxJPrg.mjs";d.workerSrc=u;const m=async t=>{const a=await t.arrayBuffer();return s({data:a,cMapUrl:`${window.location.origin}/PaperKnife/cmaps/`,cMapPacked:!0}).promise},i=async(t,a)=>{try{const e=await t.getPage(a),o=e.getViewport({scale:.5}),r=document.createElement("canvas"),n=r.getContext("2d");if(!n)throw new Error("Canvas context not available");return r.height=o.height,r.width=o.width,await e.render({canvasContext:n,viewport:o,canvas:r}).promise,r.toDataURL("image/jpeg",.6)}catch(e){return console.error(`Error rendering page ${a}:`,e),""}},w=async t=>{try{const a=s({data:await t.arrayBuffer(),cMapUrl:`${window.location.origin}/PaperKnife/cmaps/`,cMapPacked:!0});a.onPassword=()=>{throw new Error("PASSWORD_REQUIRED")};const e=await a.promise;return{thumbnail:await i(e,1),pageCount:e.numPages,isLocked:!1}}catch(a){return a.message==="PASSWORD_REQUIRED"||a.name==="PasswordException"?{thumbnail:"",pageCount:0,isLocked:!0}:{thumbnail:"",pageCount:0,isLocked:!1}}},h=async(t,a)=>{try{const e=await t.arrayBuffer(),r=await s({data:e,password:a,cMapUrl:`${window.location.origin}/PaperKnife/cmaps/`,cMapPacked:!0}).promise;return{thumbnail:await i(r,1),pageCount:r.numPages,isLocked:!1,success:!0,pdfDoc:r}}catch{return{thumbnail:"",pageCount:0,isLocked:!0,success:!1}}};export{f as L,l as a,w as g,m as l,i as r,h as u};
