// Dev-only proxy (loaded by `npm start`, never bundled). Unlike package.json
// "proxy", this also forwards page navigations, so resume PDF links work locally.
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const target = process.env.API_PROXY_TARGET;
  if (!target) {
    console.warn("API_PROXY_TARGET is not set - API requests will not be proxied.");
    return;
  }
  app.use(
    "/arunangshu_pramanik",
    createProxyMiddleware({ target, changeOrigin: true })
  );
};
