(() => {
  const $ = (id) => document.getElementById(id);

  // 语言：仅跟随浏览器，不允许切换
  const L = ((navigator.languages && navigator.languages[0]) || navigator.language || "en").toLowerCase();
  const isZh = L.startsWith("zh");
  const isHant = isZh && (/tw|hk|mo|hant/.test(L));
  const lang = isZh ? (isHant ? "zh-Hant" : "zh-Hans") : "en";
  document.documentElement.lang = isZh ? (isHant ? "zh-TW" : "zh-CN") : "en";

  const T = {
    en: {
      tagline: "IP check",
      title: "IP Check",
      subtitle: "Shows which IP version your current connection uses.",
      retry: "Replay",
      family_v6: "IPv6",
      family_v4: "IPv4",
      family_u: "Unknown",
      head_v6: "You are on IPv6",
      note_v6: "Nice — you can reach IPv6-only websites.",
      head_v4: "You are on IPv4",
      note_v4: "Your network currently prefers IPv4.",
      head_u: "Unknown",
      note_u: "Could not determine the IP family from this request.",
      kLocation: "Location",
      kISP: "ISP",
      hDetails: "Details",
      hTips: "Suggestions",
      kIP: "Public IP",
      kStack: "IP stack",
      kTime: "Time",
      footnote: "No cookies. Response is not stored by this page.",
      tips_v6: [
        "Try an IPv6-only service or an IPv6 test site.",
        "If some sites load slowly, check DNS / router IPv6 settings.",
      ],
      tips_v4: [
        "If you want IPv6: enable IPv6 on your router / ISP plan (if available).",
        "Some networks have IPv6 but browsers may still pick IPv4 — try again later.",
      ],
      tips_u: [
        "Try refreshing, or check if your network blocks IPv6/IPv4.",
      ],
    },
    "zh-Hans": {
      tagline: "IPv4 / IPv6 连通性检测",
      title: "IPv4 / IPv6 检测",
      subtitle: "显示你当前这次访问更偏向使用哪种 IP 协议栈。",
      retry: "重新测试",
      family_v6: "IPv6",
      family_v4: "IPv4",
      family_u: "未知",
      head_v6: "当前使用 IPv6",
      note_v6: "恭喜：你可以访问纯 IPv6 网站。",
      head_v4: "当前使用 IPv4",
      note_v4: "此刻网络更偏向 IPv4。",
      head_u: "暂时无法判断",
      note_u: "本次请求未得到可判断的 IP 协议栈信息。",
      kLocation: "归属地",
      kISP: "运营商",
      hDetails: "详情",
      hTips: "建议",
      kIP: "公网 IP",
      kStack: "协议栈",
      kTime: "时间",
      footnote: "不使用 Cookie。本页面不保存你的请求结果。",
      tips_v6: [
        "可以尝试访问纯 IPv6 的站点/服务进行验证。",
        "若部分站点慢：检查 DNS / 路由器 IPv6 配置。",
      ],
      tips_v4: [
        "想要 IPv6：可尝试在路由器开启 IPv6，或联系运营商确认支持情况。",
        "部分网络虽然有 IPv6，但浏览器可能仍会先用 IPv4；可以稍后再试。",
      ],
      tips_u: [
        "刷新页面，或检查网络是否屏蔽 IPv4/IPv6。",
      ],
    },
    "zh-Hant": {
      tagline: "IP 連通性檢測",
      title: "IP 檢測",
      subtitle: "顯示你目前這次連線更偏向使用哪種 IP 協定棧。",
      retry: "重新測試",
      family_v6: "IPv6",
      family_v4: "IPv4",
      family_u: "未知",
      head_v6: "目前使用 IPv6",
      note_v6: "恭喜：你可以存取純 IPv6 網站。",
      head_v4: "目前使用 IPv4",
      note_v4: "此刻網路更偏向 IPv4。",
      head_u: "暫時無法判斷",
      note_u: "本次請求未取得可判斷的 IP 協定棧資訊。",
      kLocation: "歸屬地",
      kISP: "電信商",
      hDetails: "詳情",
      hTips: "建議",
      kIP: "公網 IP",
      kStack: "協定棧",
      kTime: "時間",
      footnote: "不使用 Cookie。本頁不保存你的請求結果。",
      tips_v6: [
        "可嘗試存取純 IPv6 的站點/服務進行驗證。",
        "若部分站點慢：檢查 DNS / 路由器 IPv6 設定。",
      ],
      tips_v4: [
        "想要 IPv6：可嘗試在路由器啟用 IPv6，或向電信商確認支援情況。",
        "部分網路雖有 IPv6，但瀏覽器可能仍先選 IPv4；可稍後再試。",
      ],
      tips_u: [
        "重新整理，或檢查網路是否封鎖 IPv4/IPv6。",
      ],
    }
  };

  const t = T[lang] || T.en;

  // 文案注入
  $("tagline").textContent = t.tagline;
  $("title").textContent = t.title;
  $("subtitle").textContent = t.subtitle;
  $("btnRetry").textContent = t.retry;

  $("kLocation").textContent = t.kLocation;
  $("kISP").textContent = t.kISP;
  $("hDetails").textContent = t.hDetails;
  $("hTips").textContent = t.hTips;
  $("kIP").textContent = t.kIP;
  $("kStack").textContent = t.kStack;
  $("kTime").textContent = t.kTime;
  $("footnote").textContent = t.footnote;

  // 归属地与招呼
  function getInfoParts(info) {
    return {
      city: (info && (info.ip_city_en || info.ip_city)) || "",
      region: (info && (info.ip_region_en || info.ip_region)) || "",
      country: (info && (info.ip_country_en || info.ip_country)) || "",
      isp: (info && (info.ip_isp_en || info.ip_isp)) || "",
    };
  }

  function greetByLocation(info, fam) {
    const { city, region, country } = getInfoParts(info);
    const raw = [city, region, country].filter(Boolean).join(", ").toLowerCase();

    if (!isZh) {
      if (raw.includes("hong kong")) return "Hello Hong Kong! Hope your day is smooth and fast.";
      if (raw.includes("macau")) return "Hello Macau! Wishing you a calm, steady connection.";
      if (raw.includes("taiwan")) return "Hello Taiwan! Have a great day and a stable network.";
      if (raw.includes("fujian") || raw.includes("quanzhou") || raw.includes("xiamen"))
        return "Hello Fujian! Hope your connection is as sunny as the coast.";
      if (raw.includes("beijing")) return "Hello Beijing! May your packets fly straight and fast.";
      if (raw.includes("shanghai")) return "Hello Shanghai! Stay sharp, stay connected.";
      if (raw.includes("china")) return "Hello from China! Hope your connection stays stable today.";
      if (country) return `Hello ${country}! Thanks for dropping by.`;
      return fam === "ipv6" ? "Hello there! IPv6 looks great on you." : "Hello there! Thanks for visiting.";
    }

    // 中文
    const lower = ([info?.ip_city_en, info?.ip_region_en, info?.ip_country_en, info?.ip_city, info?.ip_region, info?.ip_country]
      .filter(Boolean).join(" ")).toLowerCase();

    const has = (s) => lower.includes(s.toLowerCase());
    const hans = (lang === "zh-Hans");

    if (has("hong kong") || has("香港")) return hans ? "香港的朋友你好～今天也要顺顺利利！" : "香港的朋友你好～今天也要順順利利！";
    if (has("macau") || has("澳门") || has("澳門")) return hans ? "澳门的朋友你好～祝你网络一路畅通！" : "澳門的朋友你好～祝你網路一路暢通！";
    if (has("taiwan") || has("台湾") || has("臺灣")) return hans ? "台湾的朋友你好～愿你今天心情和网速都在线！" : "臺灣的朋友你好～願你今天心情和網速都在線！";

    if (has("fujian") || has("福建") || has("quanzhou") || has("泉州") || has("xiamen") || has("厦门") || has("廈門"))
      return hans ? "福建的朋友你好～海风顺、网速也要顺！" : "福建的朋友你好～海風順、網速也要順！";
    if (has("beijing") || has("北京")) return hans ? "北京的朋友你好～祝你一路低延迟！" : "北京的朋友你好～祝你一路低延遲！";
    if (has("shanghai") || has("上海")) return hans ? "上海的朋友你好～今天也要稳定在线！" : "上海的朋友你好～今天也要穩定在線！";
    if (has("china") || has("中国") || has("中國")) return hans ? "中国的朋友你好～祝你今天网络稳定！" : "中國的朋友你好～祝你今天網路穩定！";

    const countryName = (info && (info.ip_country || info.ip_country_en)) || "";
    if (countryName) return hans ? `${countryName} 的朋友你好～欢迎来玩！` : `${countryName} 的朋友你好～歡迎來玩！`;
    return hans ? "你好～欢迎来玩！" : "你好～歡迎來玩！";
  }

  function setTips(list) {
    const ul = $("tips");
    ul.innerHTML = "";
    for (const s of list) {
      const li = document.createElement("li");
      li.textContent = s;
      ul.appendChild(li);
    }
  }

  function setFamilyUI(fam) {
    if (fam === "ipv6") {
      $("chipFamily").textContent = t.family_v6;
      $("headline").textContent = t.head_v6;
      $("headlineNote").textContent = t.note_v6;
      setTips(t.tips_v6);
      return;
    }
    if (fam === "ipv4") {
      $("chipFamily").textContent = t.family_v4;
      $("headline").textContent = t.head_v4;
      $("headlineNote").textContent = t.note_v4;
      setTips(t.tips_v4);
      return;
    }
    $("chipFamily").textContent = t.family_u;
    $("headline").textContent = t.head_u;
    $("headlineNote").textContent = t.note_u;
    setTips(t.tips_u);
  }

  async function run() {
    // loading
    $("chipFamily").textContent = "…";
    $("chipIP").textContent = "…";
    $("headline").textContent = "…";
    $("headlineNote").textContent = "…";
    $("greet").textContent = "…";
    $("vLocation").textContent = "-";
    $("vISP").textContent = "-";
    $("vIP").textContent = "-";
    $("vStack").textContent = "-";
    $("vTime").textContent = "-";
    setTips(["…"]);

    try {
      const r = await fetch(`/api/ip?ts=${Date.now()}`, { cache: "no-store" });
      const txt = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = JSON.parse(txt);

      const fam = data.family || "unknown";
      const ip = data.ip || "";
      const time = data.time || "";
      const info = data.info || {};
      const parts = getInfoParts(info);

      setFamilyUI(fam);

      $("chipIP").textContent = ip ? ip : "-";
      $("vIP").textContent = ip ? ip : "-";
      $("vStack").textContent = fam;
      $("vTime").textContent = time ? time : "-";

      const locParts = [parts.city, parts.region, parts.country].filter(Boolean);
      $("vLocation").textContent = locParts.length ? locParts.join(" · ") : "-";
      $("vISP").textContent = parts.isp ? parts.isp : "-";

      $("greet").textContent = greetByLocation(info, fam);
    } catch (e) {
      const msg = String(e && e.message ? e.message : e);
      $("chipFamily").textContent = t.family_u;
      $("chipIP").textContent = "-";
      $("headline").textContent = t.head_u;
      $("headlineNote").textContent = msg;
      $("greet").textContent = msg;
      setTips(t.tips_u);
    }
  }

  $("btnRetry").addEventListener("click", run);
  run();
})();
