// src/index.js

function familyOf(ip) {
  if (!ip) return "unknown";
  if (ip.includes(":")) return "ipv6";
  if (ip.includes(".")) return "ipv4";
  return "unknown";
}

function baseHeaders() {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, max-age=0",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "permissions-policy": "geolocation=()",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: baseHeaders(),
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 只开放 /api/ip，其余 404（静态资源由 assets 目录处理）
    if (request.method !== "GET" || url.pathname !== "/api/ip") {
      return new Response("Not Found", { status: 404, headers: { "cache-control": "no-store" } });
    }

    const info = request.info || {};
    const ip = info.remote_addr || "";
    const out = {
      ok: true,
      host: url.hostname,
      time: new Date().toISOString(),
      ip,
      family: familyOf(ip),
      info,
      headers: {
        "user-agent": request.headers.get("user-agent") || "",
        "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
      },
    };

    return json(out, 200);
  },
};
