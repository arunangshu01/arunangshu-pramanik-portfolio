// Dev-only proxy (loaded by `npm start`, never bundled). Unlike package.json
// "proxy", this also forwards page navigations, so resume PDF links work locally.
// Built on Node's http/https rather than http-proxy-middleware, whose http-proxy
// dependency triggers Node's DEP0060 (util._extend) warning on every request.
const http = require("http");
const https = require("https");

module.exports = function (app) {
  const target = process.env.API_PROXY_TARGET;
  if (!target) {
    console.warn("API_PROXY_TARGET is not set - API requests will not be proxied.");
    return;
  }
  const client = target.startsWith("https:") ? https : http;

  app.use("/arunangshu_pramanik", (req, res) => {
    const url = new URL(req.originalUrl, target);
    const upstream = client.request(
      url,
      { method: req.method, headers: { ...req.headers, host: url.host } },
      (upRes) => {
        res.writeHead(upRes.statusCode, upRes.headers);
        upRes.pipe(res);
      }
    );
    upstream.on("error", (err) => {
      console.warn(`[proxy] ${req.method} ${req.originalUrl} failed: ${err.message}`);
      if (!res.headersSent) res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ detail: { error_message: "Dev proxy could not reach the API." } }));
    });
    req.pipe(upstream);
  });
};
