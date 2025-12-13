// Set a runtime/global backend URL that can be configured via build-time env
try {
  const meta = typeof document !== 'undefined' && document.querySelector ? document.querySelector('meta[name="minzo-backend"]') : null;
  const metaVal = meta && meta.content && meta.content !== '%REACT_APP_BACKEND_URL%' ? meta.content : null;
  window.MINZO_BACKEND_URL = metaVal || (window.__MINZO_BACKEND_URL__ || process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001');
} catch (e) {
  window.MINZO_BACKEND_URL = window.__MINZO_BACKEND_URL__ || process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
}

export default window.MINZO_BACKEND_URL;
