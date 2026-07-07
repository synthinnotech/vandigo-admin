const { createProxyMiddleware } = require('http-proxy-middleware');

const API_TARGET = process.env.REACT_APP_API_URL || 'http://168.144.90.65:8000';

function makeProxy() {
  return createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    secure: false,
    headers: { 'ngrok-skip-browser-warning': 'true' },
    onError(err, req, res) {
      console.warn('[Proxy]', req.method, req.url, '-', err.code ?? err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Proxy error: ' + (err.code ?? err.message) }));
      }
    },
  });
}

module.exports = function (app) {
  app.use('/api', makeProxy());
  app.use('/static/uploads', makeProxy());
};
