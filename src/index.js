const ALLOWED_ORIGINS = new Set([
  "https://test.jsw.ac.cn",
  "http://test.jsw.ac.cn"
]);

function baseHeaders() {
  return {
    "cache-control": "no-store, max-age=0",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "permissions-policy": "geolocation=()"
  };
}

function corsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return {
      "access-control-allow-origin": origin,
      "vary": "origin",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "content-type"
    };
  }
  return {};
}

function json(req, data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...baseHeaders(),
      ...corsHeaders(req)
    }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS" && url.pathname === "/api/ip") {
      return new Response(null, {
        status: 204,
        headers: { ...baseHeaders(), ...corsHeaders(request) }
      });
    }

    if (request.method !== "GET" || url.pathname !== "/api/ip") {
      return new Response("Not Found", { status: 404, headers: baseHeaders() });
    }

    const info = request.info || {};
    const ip = info.remote_addr || "";
    const family = ip.includes(":") ? "ipv6" : ip.includes(".") ? "ipv4" : "unknown";

    return json(request, {
      ok: true,
      host: url.hostname,
      time: new Date().toISOString(),
      ip,
      family,
      // ESA 常见会把地理/运营商等信息挂在 request.info（若你的环境支持）
      info,
      headers: {
        "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
        "x-real-ip": request.headers.get("x-real-ip") || "",
        "user-agent": request.headers.get("user-agent") || ""
      }
    });
  }
};
