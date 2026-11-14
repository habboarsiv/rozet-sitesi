/* Habbo Arşiv - ortak üst çubuk (logo, gezinme, kullanıcı alanı), giriş penceresi ve profil menüsü.
   Tüm sayfalarda çalışır. Oturum ve giriş mantığı hesap.js içindeki HESAP'tan gelir, burada değiştirilmez. */
const SITE = (() => {
  var FLAG_SVG={
 it:"<rect width=\"10\" height=\"20\" fill=\"#009246\"/><rect x=\"10\" width=\"10\" height=\"20\" fill=\"#fff\"/><rect x=\"20\" width=\"10\" height=\"20\" fill=\"#ce2b37\"/>",
 fr:"<rect width=\"10\" height=\"20\" fill=\"#0055a4\"/><rect x=\"10\" width=\"10\" height=\"20\" fill=\"#fff\"/><rect x=\"20\" width=\"10\" height=\"20\" fill=\"#ef4135\"/>",
 de:"<rect width=\"30\" height=\"6.67\" fill=\"#000\"/><rect y=\"6.67\" width=\"30\" height=\"6.67\" fill=\"#dd0000\"/><rect y=\"13.33\" width=\"30\" height=\"6.67\" fill=\"#ffce00\"/>",
 nl:"<rect width=\"30\" height=\"6.67\" fill=\"#ae1c28\"/><rect y=\"6.67\" width=\"30\" height=\"6.67\" fill=\"#fff\"/><rect y=\"13.33\" width=\"30\" height=\"6.67\" fill=\"#21468b\"/>",
 es:"<rect width=\"30\" height=\"20\" fill=\"#aa151b\"/><rect y=\"5\" width=\"30\" height=\"10\" fill=\"#f1bf00\"/><rect x=\"7.4\" y=\"7.8\" width=\"3.2\" height=\"4.4\" rx=\".7\" fill=\"#ad1519\"/>",
 fi:"<rect width=\"30\" height=\"20\" fill=\"#fff\"/><rect x=\"7.5\" width=\"4.5\" height=\"20\" fill=\"#003580\"/><rect y=\"7.75\" width=\"30\" height=\"4.5\" fill=\"#003580\"/>",
 tr:"<rect width=\"30\" height=\"20\" fill=\"#e30a17\"/><circle cx=\"10.6\" cy=\"10\" r=\"5.2\" fill=\"#fff\"/><circle cx=\"12\" cy=\"10\" r=\"4.2\" fill=\"#e30a17\"/><polygon points=\"13.30,10.00 15.05,9.38 15.10,7.53 16.22,9.00 18.00,8.47 16.95,10.00 18.00,11.53 16.22,11.00 15.10,12.47 15.05,10.62\" fill=\"#fff\"/>",
 br:"<rect width=\"30\" height=\"20\" fill=\"#009c3b\"/><polygon points=\"15,2.2 27.2,10 15,17.8 2.8,10\" fill=\"#ffdf00\"/><circle cx=\"15\" cy=\"10\" r=\"4.6\" fill=\"#002776\"/><path d=\"M10.5 9.1Q15 7.6 19.5 10.9\" stroke=\"#fff\" stroke-width=\".9\" fill=\"none\"/>",
 com:"<rect y=\"0.000\" width=\"30\" height=\"1.539\" fill=\"#b22234\"/><rect y=\"1.538\" width=\"30\" height=\"1.539\" fill=\"#fff\"/><rect y=\"3.077\" width=\"30\" height=\"1.539\" fill=\"#b22234\"/><rect y=\"4.615\" width=\"30\" height=\"1.539\" fill=\"#fff\"/><rect y=\"6.154\" width=\"30\" height=\"1.539\" fill=\"#b22234\"/><rect y=\"7.692\" width=\"30\" height=\"1.539\" fill=\"#fff\"/><rect y=\"9.231\" width=\"30\" height=\"1.539\" fill=\"#b22234\"/><rect y=\"10.769\" width=\"30\" height=\"1.539\" fill=\"#fff\"/><rect y=\"12.308\" width=\"30\" height=\"1.539\" fill=\"#b22234\"/><rect y=\"13.846\" width=\"30\" height=\"1.539\" fill=\"#fff\"/><rect y=\"15.385\" width=\"30\" height=\"1.539\" fill=\"#b22234\"/><rect y=\"16.923\" width=\"30\" height=\"1.539\" fill=\"#fff\"/><rect y=\"18.462\" width=\"30\" height=\"1.539\" fill=\"#b22234\"/><rect width=\"12.5\" height=\"10.77\" fill=\"#3c3b6e\"/><circle cx=\"1.40\" cy=\"1.30\" r=\".42\" fill=\"#fff\"/><circle cx=\"3.65\" cy=\"1.30\" r=\".42\" fill=\"#fff\"/><circle cx=\"5.90\" cy=\"1.30\" r=\".42\" fill=\"#fff\"/><circle cx=\"8.15\" cy=\"1.30\" r=\".42\" fill=\"#fff\"/><circle cx=\"10.40\" cy=\"1.30\" r=\".42\" fill=\"#fff\"/><circle cx=\"1.40\" cy=\"3.50\" r=\".42\" fill=\"#fff\"/><circle cx=\"3.65\" cy=\"3.50\" r=\".42\" fill=\"#fff\"/><circle cx=\"5.90\" cy=\"3.50\" r=\".42\" fill=\"#fff\"/><circle cx=\"8.15\" cy=\"3.50\" r=\".42\" fill=\"#fff\"/><circle cx=\"10.40\" cy=\"3.50\" r=\".42\" fill=\"#fff\"/><circle cx=\"1.40\" cy=\"5.70\" r=\".42\" fill=\"#fff\"/><circle cx=\"3.65\" cy=\"5.70\" r=\".42\" fill=\"#fff\"/><circle cx=\"5.90\" cy=\"5.70\" r=\".42\" fill=\"#fff\"/><circle cx=\"8.15\" cy=\"5.70\" r=\".42\" fill=\"#fff\"/><circle cx=\"10.40\" cy=\"5.70\" r=\".42\" fill=\"#fff\"/><circle cx=\"1.40\" cy=\"7.90\" r=\".42\" fill=\"#fff\"/><circle cx=\"3.65\" cy=\"7.90\" r=\".42\" fill=\"#fff\"/><circle cx=\"5.90\" cy=\"7.90\" r=\".42\" fill=\"#fff\"/><circle cx=\"8.15\" cy=\"7.90\" r=\".42\" fill=\"#fff\"/><circle cx=\"10.40\" cy=\"7.90\" r=\".42\" fill=\"#fff\"/>"
};
  const IC = {
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    pen: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
    paper: '<path d="M15 18h-5"/><path d="M18 14h-8"/><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="10" y="6" rx="1"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    build: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    arrow: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    verify: '<path d="M12 22c5.5-2 8-6 8-11V5l-8-3-8 3v6c0 5 2.5 9 8 11z"/><path d="m9 12 2 2 4-4"/>'
  };
  const svg = (k, c) => '<svg class="ic ' + (c || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>';
  const ROL = {
    uye: { ad: "Üye", ic: "user", acik: "Habbo Arşiv topluluğunun bir parçasıdır, haberlere yorum yapabilir." },
    yazar: { ad: "Yazar", ic: "pen", acik: "Topluluğu bilgilendirmek adına yeni haberler kaleme alır." },
    moderator: { ad: "Moderatör", ic: "verify", acik: "Topluluk içi etkileşimi korur, haber ve yorum akışını denetler." },
    yonetici: { ad: "Yönetici", ic: "shield", acik: "Topluluğu ve platformu yönetir; tüm içeriklerde tam yetkilidir." }
  };
  const LOGO = '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5 28.5 9.75 16 17 3.5 9.75z" fill="#2a4a92"/><path d="M3.5 9.75 16 17v13.5L3.5 23.25z" fill="#0b1536"/><path d="M28.5 9.75 16 17v13.5l12.5-7.25z" fill="#142760"/><path d="M16 6.7 23.3 10.9 16 15.1 8.7 10.9z" fill="none" stroke="#8cc2ff" stroke-opacity=".4" stroke-width=".6"/><path d="M16 2.5 28.5 9.75v13.5L16 30.5 3.5 23.25V9.75z" fill="none" stroke="#5aa7ff" stroke-width="1.1" stroke-linejoin="round"/><path d="M3.5 9.75 16 17l12.5-7.25M16 17v13.5" fill="none" stroke="#5aa7ff" stroke-opacity=".75" stroke-width="1" stroke-linejoin="round"/></svg>';

  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h) e.innerHTML = h; return e; };
  const rolOf = h => { let k = String(h.rol || "").toLowerCase().replace(/ö/g, "o"); if (k === "mod") k = "moderator"; return ROL[k] ? k : "uye"; };
  const rozet = (r, ip) => '<span class="rol rol-' + r + '"' + (ip === false ? '' : ' tabindex="0" data-ip="' + ROL[r].acik + '"') + '>' + svg(ROL[r].ic) + '<b>' + ROL[r].ad + '</b></span>';
  const otelEt = k => !HESAP.OTELLER[k] ? "" : '<span class="otel"><svg class="fl" viewBox="0 0 30 20" aria-hidden="true">' + (FLAG_SVG[k] || "") + '</svg><b>' + k.toUpperCase() + '</b></span>';
  const avatarUrl = (h, boyut, bas) => "https://www.habbo" + (HESAP.OTELLER[h.otel] || ".com") + "/habbo-imaging/avatarimage?user=" + encodeURIComponent(h.ad) +
    "&direction=2&head_direction=3&gesture=sml&size=" + boyut + (bas ? "&headonly=1" : "");
  function avatar(h, boyut, bas, sinif) {
    const kap = el("span", "av " + (sinif || ""));
    const im = document.createElement("img"); im.alt = ""; im.src = avatarUrl(h, boyut, bas);
    im.onerror = () => { kap.classList.add("yok"); kap.innerHTML = svg("user"); };
    kap.appendChild(im); return kap;
  }

  /* ---------- üst çubuk ---------- */
  function ustCubuk() {
    const ana = !!document.getElementById("mR"), aktif = document.body.dataset.nav || "";
    const hd = el("header", "sh"); hd.id = "siteHeader";
    const nav = ana ? "" : '<nav class="sh-nav" aria-label="Bölümler">' + [["R", "Rozetler", "/"], ["H", "Haberler", "/#haberler"], ["P", "Promolar", "/#promolar"], ["M", "Mobiler", "/#mobiler"]]
      .map(x => '<a href="' + x[2] + '"' + (aktif === x[0] ? ' class="on" aria-current="page"' : "") + '>' + x[1] + '</a>').join("") + '</nav>';
    hd.innerHTML = '<div class="sh-in"><a class="sh-logo" href="/" aria-label="Habbo Arşiv">' + LOGO + '<span>Habbo Arşiv</span></a>' + nav + '<div class="sh-user" id="shUser"></div></div>';
    const ku = hd.querySelector("#shUser"); ku.parentNode.insertBefore(aramaKur(), ku);
    document.body.prepend(hd); kullanici();
  }

  /* ---------- üye arama (üst çubuk): kayıtlı üyeleri Habbo adıyla bulur, profiline götürür ---------- */
  let aramaKap = null;
  function aramaKur() {
    if (aramaKap) return aramaKap;
    const kap = el("div", "sh-ara-kap");
    kap.setAttribute("role", "search");
    const kutu = el("label", "sh-ara-kutu", svg("search"));
    const girdi = el("input"); girdi.type = "search"; girdi.maxLength = 30; girdi.placeholder = "Sitedeki üyeleri ara";
    girdi.autocomplete = "off"; girdi.spellcheck = false; girdi.setAttribute("autocapitalize", "off"); girdi.setAttribute("aria-label", "Sitedeki üyeleri ara");
    kutu.appendChild(girdi);
    const panel = el("div", "sh-ara-panel");
    const durum = el("p", "sh-ara-durum"); durum.setAttribute("role", "status"); durum.setAttribute("aria-live", "polite");
    const liste = el("ul", "sh-ara-liste");
    panel.append(durum, liste); kap.append(kutu, panel);

    const BOS = "Aramak için en az 2 harf yaz.";
    durum.textContent = BOS;
    const sade = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    let zamanlayici = 0, sira = 0;
    const ac = v => kap.classList.toggle("acik", v);

    // İlk sonucun adresini döndürür (Enter'a basılınca oraya gidilir)
    async function ara() {
      const q = girdi.value.trim().replace(/[*%\\_]/g, "").slice(0, 30), n = ++sira;
      liste.textContent = "";
      if (q.length < 2) { durum.textContent = BOS; return null; }
      durum.textContent = "Aranıyor…";
      let r = null;
      try { r = await HESAP.rest("profiller?select=id,habbo_ad,otel,rol&habbo_ad=ilike." + encodeURIComponent("*" + q + "*") + "&order=habbo_ad.asc&limit=30"); } catch { /* r null kalır */ }
      if (n !== sira) return null;                       // daha yeni bir arama başladı
      if (!r || !r.ok || !Array.isArray(r.v)) { durum.textContent = "Arama şu an yapılamıyor. Biraz sonra tekrar dene."; return null; }
      const k = sade(q), puan = p => { const x = sade(p.habbo_ad); return x === k ? 0 : x.startsWith(k) ? 1 : 2; };
      const bulunan = r.v.filter(p => p && p.habbo_ad && /^[0-9a-f-]{36}$/i.test(p.id)).sort((a, b) => puan(a) - puan(b)).slice(0, 10);
      if (!bulunan.length) { durum.textContent = "Bu adla kayıtlı üye bulunamadı."; return null; }
      durum.textContent = "";
      bulunan.forEach(p => {
        const li = el("li"), a = el("a", "sh-ara-oge"); a.href = "/profil?id=" + p.id;
        a.appendChild(avatar({ ad: p.habbo_ad, otel: p.otel }, "m", true, "kucuk"));
        const t = el("span", "sh-ara-t"), b = el("b"); b.textContent = p.habbo_ad; t.appendChild(b);
        t.appendChild(el("span", "sh-alt", rozet(rolOf(p), false) + otelEt(p.otel)));
        a.appendChild(t); li.appendChild(a); liste.appendChild(li);
      });
      return liste.querySelector("a").href;
    }

    girdi.addEventListener("input", () => { clearTimeout(zamanlayici); zamanlayici = setTimeout(ara, 280); });
    girdi.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); clearTimeout(zamanlayici); ara().then(u => { if (u) location.href = u; }); }
      else if (e.key === "ArrowDown") { const a = liste.querySelector("a"); if (a) { e.preventDefault(); a.focus(); } }
    });
    liste.addEventListener("keydown", e => {
      const a = e.target.closest("a"); if (!a) return;
      if (e.key === "ArrowDown") { const s = a.parentElement.nextElementSibling; if (s) { e.preventDefault(); s.querySelector("a").focus(); } }
      else if (e.key === "ArrowUp") { e.preventDefault(); const o = a.parentElement.previousElementSibling; (o ? o.querySelector("a") : girdi).focus(); }
    });
    kap.addEventListener("focusin", () => ac(true));
    kap.addEventListener("focusout", e => { if (!e.relatedTarget || !kap.contains(e.relatedTarget)) ac(false); });
    document.addEventListener("click", e => { if (!kap.contains(e.target)) ac(false); }, true);
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && kap.contains(document.activeElement)) { ac(false); girdi.blur(); return; }
      const ae = document.activeElement;
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && !ae.isContentEditable && !document.body.classList.contains("gm-kilit") && !document.getElementById("heroForm")) { e.preventDefault(); girdi.focus(); }
    });
    return (aramaKap = kap);
  }

  function kullanici() {
    const kutu = document.getElementById("shUser"), h = HESAP.oku(); kutu.textContent = "";
    if (!h) {
      kutu.appendChild(el("button", "sh-btn ik", "Giriş yap")).dataset.giris = "giris";
      kutu.appendChild(el("button", "sh-btn", "Kayıt ol")).dataset.giris = "kayit";
      return;
    }
    const r = rolOf(h);
    const b = el("button", "sh-prof"); b.type = "button"; b.setAttribute("aria-haspopup", "menu"); b.setAttribute("aria-expanded", "false");
    const meta = el("span", "sh-meta"); const ad = el("b"); ad.textContent = h.ad;
    meta.appendChild(ad); meta.appendChild(el("span", "sh-alt", rozet(r, false) + otelEt(h.otel)));
    b.appendChild(avatar(h, "m", true, "kucuk")); b.appendChild(meta); b.insertAdjacentHTML("beforeend", svg("down", "ok"));
    const m = el("div", "sh-menu"); m.setAttribute("role", "menu");
    const ust = el("div", "sh-menu-ust"); ust.appendChild(avatar(h, "m", true, "orta"));
    const t = el("div"); const n = el("b"); n.textContent = h.ad; t.appendChild(n); t.appendChild(el("span", "sh-alt", rozet(r) + otelEt(h.otel))); ust.appendChild(t); m.appendChild(ust);
    const link = (href, ic, ad2, c) => { const a = el("a", "sh-oge " + (c || ""), svg(ic) + "<span>" + ad2 + "</span>"); a.href = href; a.setAttribute("role", "menuitem"); return a; };
    m.appendChild(link("/hesap", "user", "Hesabım"));
    if (r === "yazar" || r === "moderator" || r === "yonetici") m.appendChild(link("/haber-yaz", "paper", "Haber Paneli"));
    let onayLink = null;
    if (r === "moderator" || r === "yonetici") { onayLink = link("/arkaplan-onay", "verify", "Arkaplan Onayları"); m.appendChild(onayLink); }
    m.appendChild(el("div", "sh-ayrac"));
    const c = el("button", "sh-oge cikis", svg("out") + "<span>Çıkış yap</span>"); c.type = "button"; c.setAttribute("role", "menuitem"); c.onclick = cikis; m.appendChild(c);
    const kap = el("div", "sh-kap"); kap.appendChild(b); kap.appendChild(m); kutu.appendChild(kap);
    // Yönetici/moderatör: onay bekleyen arkaplan varsa profil düğmesinde kırmızı nokta, menüde sayı rozeti
    if (onayLink) {
      HESAP.rest("arkaplan_talepleri?select=id&durum=eq.bekliyor&limit=100").then(({ ok, v }) => {
        if (!ok || !Array.isArray(v) || !v.length) return;
        const say = v.length, yazi = say >= 100 ? "99+" : String(say), ipucu = say + " arkaplan onay bekliyor";
        if (getComputedStyle(b).position === "static") b.style.position = "relative";
        const nk = el("i", "sh-bekle-nokta"); nk.title = ipucu;
        nk.style.cssText = "position:absolute;top:-3px;right:-3px;width:12px;height:12px;border-radius:50%;background:#ff4d5e;border:2px solid #070b16;box-sizing:border-box;pointer-events:none";
        b.appendChild(nk);
        const rz = el("span", "sh-bekle", yazi); rz.title = ipucu;
        rz.style.cssText = "margin-left:auto;display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#ff4d5e;color:#fff;font:800 .72rem Manrope,system-ui,sans-serif";
        onayLink.appendChild(rz); onayLink.setAttribute("aria-label", "Arkaplan Onayları, " + ipucu);
      }).catch(() => {});
    }
    const ac = v => { kap.classList.toggle("acik", v); b.setAttribute("aria-expanded", v); };
    b.onclick = e => { e.stopPropagation(); ac(!kap.classList.contains("acik")); };
    document.addEventListener("click", e => { if (!kap.contains(e.target)) ac(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") ac(false); });
  }

  function cikis() {
    HESAP.cikis();
    if (/^\/(hesap|haber-yaz|arkaplan-onay)/.test(location.pathname)) location.href = "/"; else location.reload();
  }

  /* ---------- giriş / kayıt penceresi (mevcut doğrulama akışı aynen korunur) ---------- */
  let gm, mod = "giris", kodAlindi = false;
  const $g = id => gm.querySelector("#" + id);
  function msg(t, c) { $g("gmMsg").textContent = t || ""; $g("gmMsg").className = "gm-msg " + (c || ""); }

  function pencereKur() {
    gm = el("div", "gm"); gm.setAttribute("aria-hidden", "true");
    gm.innerHTML = '<div class="gm-kart" role="dialog" aria-modal="true" aria-labelledby="gmBaslik">' +
      '<button class="gm-x" type="button" aria-label="Kapat">' + svg("x") + '</button>' +
      '<div class="gm-ust">' + LOGO + '<h2 id="gmBaslik">Giriş yap</h2><p id="gmAlt">Habbo hesabınla devam et.</p></div>' +
      '<form id="gmF" autocomplete="off"><label for="gmOtel">Otel</label><select id="gmOtel"></select>' +
      '<label for="gmNick">Habbo adın</label><input id="gmNick" maxlength="30" autocapitalize="off" spellcheck="false">' +
      '<div id="gmKodKutu" hidden><div class="gm-kod"><b id="gmKod"></b><span>Bu kodu oyunda mottona yaz, kaydet ve 1-2 dakika bekle. Kod <span id="gmDk"></span> dakika geçerli.</span></div></div>' +
      '<div id="gmSifreAlani"><label for="gmSifre" id="gmSifreEt">Şifre</label><input id="gmSifre" type="password" autocomplete="new-password"></div>' +
      '<div id="gmSifre2Alani" hidden><label for="gmSifre2">Şifre (tekrar)</label><input id="gmSifre2" type="password" autocomplete="new-password"></div>' +
      '<div class="gm-satir"><button class="gm-btn" id="gmBtn" type="submit">Giriş yap</button><button class="gm-btn ik" id="gmKayit" type="button">Kayıt ol</button></div>' +
      '<div class="gm-alt"><a href="#" id="gmUnuttum">Şifremi unuttum</a><a href="#" id="gmGeri" hidden>← Girişe dön</a></div>' +
      '<div class="gm-msg" id="gmMsg" role="status" aria-live="polite"></div></form></div>';
    document.body.appendChild(gm);
    for (const [k, v] of Object.entries(HESAP.OTELLER)) $g("gmOtel").add(new Option(v, k));
    gm.addEventListener("click", e => { if (e.target === gm || e.target.closest(".gm-x")) kapat(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && gm.classList.contains("acik")) kapat(); });
    $g("gmKayit").onclick = () => gec("kayit");
    $g("gmUnuttum").onclick = e => { e.preventDefault(); gec("sifre"); };
    $g("gmGeri").onclick = e => { e.preventDefault(); gec("giris"); };
    $g("gmF").onsubmit = gonder;
  }

  function goster() {
    const g = mod === "giris";
    $g("gmSifreAlani").hidden = !(g || kodAlindi); $g("gmSifre2Alani").hidden = g || !kodAlindi; $g("gmKodKutu").hidden = g || !kodAlindi;
    $g("gmKayit").hidden = !g; $g("gmUnuttum").hidden = !g; $g("gmGeri").hidden = g;
    $g("gmOtel").disabled = $g("gmNick").disabled = kodAlindi && !g;
    $g("gmSifreEt").textContent = mod === "sifre" ? "Yeni şifre" : "Şifre";
    $g("gmBtn").textContent = g ? "Giriş yap" : !kodAlindi ? "Doğrulama kodu al" : mod === "kayit" ? "Doğrula ve kaydol" : "Doğrula ve şifreyi yenile";
    $g("gmBaslik").textContent = g ? "Giriş yap" : mod === "kayit" ? "Kayıt ol" : "Şifreni yenile";
    $g("gmAlt").textContent = g ? "Habbo hesabınla devam et." : mod === "kayit" ? "Habbo hesabını mottonla doğrula." : "Mottonla doğrulayıp yeni şifre belirle.";
  }
  function gec(m) { mod = m; kodAlindi = false; msg(""); goster(); }

  async function gonder(e) {
    e.preventDefault(); msg("");
    const otel = $g("gmOtel").value, nick = $g("gmNick").value.trim(), sifre = $g("gmSifre").value;
    if (!nick) return msg("Habbo adını yaz.", "h");
    if (mod === "giris" && !sifre) return msg("Şifreni yaz.", "h");
    if (kodAlindi && sifre.length < 8) return msg("Şifre en az 8 karakter olmalı.", "h");
    if (kodAlindi && sifre !== $g("gmSifre2").value) return msg("Şifreler aynı değil.", "h");
    $g("gmBtn").disabled = true;
    try {
      if (mod === "giris") {
        const r = await HESAP.giris(otel, nick, sifre);
        if (r.hata) msg(r.hata, "h"); else location.reload();      // aynı sayfada kal, üst çubuk güncellensin
      } else if (!kodAlindi) {
        const { ok, v } = await HESAP.fn({ islem: "kod", otel, nick, amac: mod });
        if (!ok) msg(v.hata || "Bir hata oluştu.", "h");
        else { kodAlindi = true; $g("gmKod").textContent = v.kod; $g("gmDk").textContent = v.dakika; goster(); }
      } else {
        const { ok, v } = await HESAP.fn({ islem: "dogrula", otel, nick, amac: mod, sifre });
        if (!ok) msg(v.hata || "Bir hata oluştu.", "h");
        else {
          const r = await HESAP.giris(otel, nick, sifre);
          if (r.tamam) location.reload(); else { gec("giris"); msg("Hesabın hazır. Şimdi giriş yapabilirsin.", "o"); }
        }
      }
    } catch { msg("Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.", "h"); }
    $g("gmBtn").disabled = false;
  }

  function girisAc(m) {
    if (!gm) pencereKur();
    gec(m || "giris"); gm.classList.add("acik"); gm.setAttribute("aria-hidden", "false"); document.body.classList.add("gm-kilit");
    setTimeout(() => $g("gmNick").focus(), 60);
  }
  function kapat() { gm.classList.remove("acik"); gm.setAttribute("aria-hidden", "true"); document.body.classList.remove("gm-kilit"); }

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-giris]");
    if (t) { e.preventDefault(); girisAc(t.dataset.giris || "giris"); }
  });
  const basla = () => { ustCubuk(); if (location.hash === "#giris") girisAc("giris"); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", basla); else basla();

  return { girisAc, cikis, svg, rozet, otelEt, avatar, rolOf, ROL, el };
})();
