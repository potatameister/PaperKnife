import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage Object URLs and ensure they are revoked to prevent memory leaks.
 */
export function useObjectURL() {
  const [urls, setUrls] = useState<string[]>([]);
  const urlsRef = useRef<string[]>([]);

  const createUrl = useCallback((blob: Blob | File) => {
    const url = URL.createObjectURL(blob);
    urlsRef.current.push(url);
    setUrls([...urlsRef.current]);
    return url;
  }, []);

  const clearUrls = useCallback(() => {
    urlsRef.current.forEach(url => URL.revokeObjectURL(url));
    urlsRef.current = [];
    setUrls([]);
  }, []);

  // Revoke on unmount
  useEffect(() => {
    return () => {
      urlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return { objectUrl: urls[urls.length - 1] || null, urls, createUrl, clearUrls };
}
