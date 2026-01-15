// src/index.js

const ALLOWED_ORIGINS = new Set([
  "https://test-ipv6.jsw.ac.cn",
  "http://test-ipv6.jsw.ac.cn",
]);

function baseHeaders() {
  return {
    "cache-control": "no-store, max-age=0",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "permissions-policy": "geolocation=()",
  };
}

function corsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "content-type",
      "vary": "origin",
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
      ...corsHeaders(req),
    },
  });
}

function familyOf(ip) {
  if (!ip) return "unknown";
  if (ip.includes(":")) return "ipv6";
  if (ip.includes(".")) return "ipv4";
  return "unknown";
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS" && url.pathname === "/api/ip") {
      return new Response(null, {
        status: 204,
        headers: { ...baseHeaders(), ...corsHeaders(request) },
      });
    }

    // 只开放 /api/ip
    if (request.method !== "GET" || url.pathname !== "/api/ip") {
      return new Response("Not Found", { status: 404, headers: baseHeaders() });
    }

    const info = request.info || {};
    const ip = info.remote_addr || "";
    const out = {
      ok: true,
      host: url.hostname,
      time: new Date().toISOString(),
      ip,
      family: familyOf(ip),
      info, // 你 ESA 环境里带的 ip_city_en / isp 等都保留
      headers: {
        "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
        "user-agent": request.headers.get("user-agent") || "",
      },
    };

    return json(request, out, 200);
  },
};
