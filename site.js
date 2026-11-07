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
    verify: '<path d="M12 22c5.5-2 8-6 8-11V5l-8-3-8 3v6c0 5 2.5 9 8 11z"/><path d="m9 12 2 2 4-4"/>'
  };
  const svg = (k, c) => '<svg class="ic ' + (c || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>';
  const ROL = {
    uye: { ad: "Üye", ic: "user", acik: "Haberlere yorum yazabilir." },
    yazar: { ad: "Yazar", ic: "pen", acik: "Haber yazabilir, kendi haberlerini düzenleyebilir." },
    yonetici: { ad: "Yönetici", ic: "shield", acik: "Tüm haberleri ve yorumları yönetebilir." }
  };
  const LOGO = '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="shg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--c1)"/><stop offset="1" style="stop-color:var(--c2)"/></linearGradient></defs><path d="M16 2 30 10v12L16 30 2 22V10z" fill="url(#shg)"/><path d="M16 2v14m0 0 14-6M16 16 2 10m14 6v14" stroke="rgba(255,255,255,.5)" stroke-width="1.4" fill="none"/></svg>';

  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h) e.innerHTML = h; return e; };
  const rolOf = h => ROL[h.rol] ? h.rol : "uye";
  const rozet = r => '<span class="rol rol-' + r + '">' + svg(ROL[r].ic) + '<b>' + ROL[r].ad + '</b></span>';
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
    const nav = ana ? "" : '<nav class="sh-nav" aria-label="Bölümler">' + [["R", "Rozetler", "/"], ["P", "Promolar", "/#promolar"], ["M", "Mobiler", "/#mobiler"], ["H", "Haberler", "/#haberler"]]
      .map(x => '<a href="' + x[2] + '"' + (aktif === x[0] ? ' class="on" aria-current="page"' : "") + '>' + x[1] + '</a>').join("") + '</nav>';
    hd.innerHTML = '<div class="sh-in"><a class="sh-logo" href="/" aria-label="Habbo Arşiv">' + LOGO + '<span>Habbo Arşiv</span></a>' + nav + '<div class="sh-user" id="shUser"></div></div>';
    document.body.prepend(hd); kullanici();
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
    meta.appendChild(ad); meta.appendChild(el("span", "sh-alt", rozet(r) + otelEt(h.otel)));
    b.appendChild(avatar(h, "m", true, "kucuk")); b.appendChild(meta); b.insertAdjacentHTML("beforeend", svg("down", "ok"));
    const m = el("div", "sh-menu"); m.setAttribute("role", "menu");
    const ust = el("div", "sh-menu-ust"); ust.appendChild(avatar(h, "m", true, "orta"));
    const t = el("div"); const n = el("b"); n.textContent = h.ad; t.appendChild(n); t.appendChild(el("span", "sh-alt", rozet(r) + otelEt(h.otel))); ust.appendChild(t); m.appendChild(ust);
    const link = (href, ic, ad2, c) => { const a = el("a", "sh-oge " + (c || ""), svg(ic) + "<span>" + ad2 + "</span>"); a.href = href; a.setAttribute("role", "menuitem"); return a; };
    m.appendChild(link("/hesap", "user", "Hesabım"));
    if (r === "yazar" || r === "yonetici") m.appendChild(link("/haber-yaz", "paper", "Haber Paneli"));
    m.appendChild(el("div", "sh-ayrac"));
    const c = el("button", "sh-oge cikis", svg("out") + "<span>Çıkış yap</span>"); c.type = "button"; c.setAttribute("role", "menuitem"); c.onclick = cikis; m.appendChild(c);
    const kap = el("div", "sh-kap"); kap.appendChild(b); kap.appendChild(m); kutu.appendChild(kap);
    const ac = v => { kap.classList.toggle("acik", v); b.setAttribute("aria-expanded", v); };
    b.onclick = e => { e.stopPropagation(); ac(!kap.classList.contains("acik")); };
    document.addEventListener("click", e => { if (!kap.contains(e.target)) ac(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") ac(false); });
  }

  function cikis() {
    HESAP.cikis();
    if (/^\/(hesap|haber-yaz)/.test(location.pathname)) location.href = "/"; else location.reload();
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
