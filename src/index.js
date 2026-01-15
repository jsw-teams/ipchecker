// src/index.js
function baseHeaders() {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store, max-age=0",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "permissions-policy": "geolocation=()",
  };
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...baseHeaders(), ...extraHeaders },
  });
}

// ---- IP helpers (轻量，不依赖 Node 内置模块) ----
function stripPortAndBrackets(s) {
  s = (s || "").trim();
  // [IPv6]:443
  const m = s.match(/^\[([0-9a-fA-F:]+)\](?::\d+)?$/);
  if (m) return m[1];
  // IPv4:1234
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(s)) return s.split(":")[0];
  return s;
}

function isIPv4(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return false;
    const n = Number(p);
    if (n < 0 || n > 255) return false;
  }
  return true;
}

function isIPv6(ip) {
  // 粗略校验：只允许 hex/: 且含冒号
  if (!ip || ip.length > 80) return false;
  if (!ip.includes(":")) return false;
  if (!/^[0-9a-fA-F:]+$/.test(ip)) return false;
  // 允许 ::
  const double = ip.includes("::");
  const segs = ip.split(":");
  if (!double && segs.length < 3) return false;
  if (segs.length > 8 + (double ? 1 : 0)) return false;
  // 每段最多4位（空段允许用于 ::）
  for (const seg of segs) {
    if (seg.length === 0) continue;
    if (seg.length > 4) return false;
  }
  return true;
}

function isPublicIPv4(ip) {
  if (!isIPv4(ip)) return false;
  const [a, b] = ip.split(".").map(Number);

  // 0.0.0.0/8, 127/8, 169.254/16
  if (a === 0 || a === 127) return false;
  if (a === 169 && b === 254) return false;

  // RFC1918: 10/8, 172.16/12, 192.168/16
  if (a === 10) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;

  // CGNAT 100.64/10
  if (a === 100 && b >= 64 && b <= 127) return false;

  // 多播/保留 224/4, 240/4
  if (a >= 224) return false;

  return true;
}

function isPublicIPv6(ip) {
  if (!isIPv6(ip)) return false;
  const lower = ip.toLowerCase();

  // ::1 / :: / link-local fe80::/10 / ULA fc00::/7 / multicast ff00::/8
  if (lower === "::1" || lower === "::") return false;
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return false;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return false;
  if (lower.startsWith("ff")) return false;

  return true;
}

function parseXFF(xffRaw) {
  const chainRaw = String(xffRaw || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const chain = chainRaw.map(stripPortAndBrackets);

  // “可信代理链”常见约定：越靠左越接近真实客户端
  let firstPublicAny = "";
  let ipv4 = "";
  let ipv6 = "";

  for (const ip of chain) {
    if (!firstPublicAny) {
      if (isPublicIPv4(ip) || isPublicIPv6(ip)) firstPublicAny = ip;
    }
    if (!ipv4 && isPublicIPv4(ip)) ipv4 = ip;
    if (!ipv6 && isPublicIPv6(ip)) ipv6 = ip;
    if (firstPublicAny && ipv4 && ipv6) break;
  }

  return { chainRaw, chain, firstPublicAny, ipv4, ipv6 };
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

    // 只暴露 /api/ip；其它路径（除静态资源）全部 404
    if (request.method !== "GET" || url.pathname !== "/api/ip") {
      return new Response("Not Found", { status: 404, headers: { "cache-control": "no-store" } });
    }

    const info = request.info || {};
    const remoteAddr = info.remote_addr || "";
    const remotePort = info.remote_port || "";
    const xff = request.headers.get("x-forwarded-for") || "";
    const ua = request.headers.get("user-agent") || "";

    const hints = parseXFF(xff);

    // 输出口径：
    // - connection.*：本次连接在 ESA 看到的地址（remote_addr）
    // - guess.*：从 XFF 代理链推断（你说“可信”，那我们就按左侧优先 + 公网过滤）
    const out = {
      ok: true,
      host: url.hostname,
      time: new Date().toISOString(),

      connection: {
        ip: remoteAddr,
        family: familyOf(remoteAddr),
        port: remotePort,
      },

      guess: {
        client_ip: hints.firstPublicAny || "", // 代理链里最靠左的“公网 IP”（v4/v6都可能）
        ipv4: hints.ipv4 || "",
        ipv6: hints.ipv6 || "",
        note: "guess 来自 X-Forwarded-For 代理链推断（按左侧优先 + 公网过滤）；connection 为本次连接权威值。",
      },

      xff: {
        raw: xff,
        chain_raw: hints.chainRaw,
        chain: hints.chain,
      },

      info, // 你需要的 ip_city_en / isp 等仍保留
      headers: {
        "user-agent": ua,
      },
    };

    return json(out, 200);
  },
};
