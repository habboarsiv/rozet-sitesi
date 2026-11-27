/* Habbo Arşiv - Fotoğraflar bölümü.
   Habbo'nun herkese açık fotoğraf akışını Worker (foto-worker.js) üzerinden listeler:
   otel filtresi, çeken ya da beğenen oyuncuya göre arama, beğeni sayısı ve beğenen oyuncular.
   index.html'deki mod() fonksiyonu sekme açılınca FOTO_UI.ac() çağırır. */
(function () {
  "use strict";

  // Worker'ı Cloudflare'a kurunca adresini buraya yaz (sonunda / olsun)
  const FOTO_API = "https://habbo-foto.habboarsiv-api.workers.dev/";

  const SAYFA = 24, BEGENEN_ILK = 60, TAZE_MS = 60000, ZAMAN_ASIMI = 10000;
  const OTELLER = [["tr", "habbo.com.tr"], ["com", "habbo.com"], ["de", "habbo.de"], ["es", "habbo.es"], ["fr", "habbo.fr"],
    ["it", "habbo.it"], ["nl", "habbo.nl"], ["fi", "habbo.fi"], ["br", "habbo.com.br"]];
  const AD = {}; OTELLER.forEach(o => { AD[o[0]] = o[1]; });
  const GORSEL_RE = /^https:\/\/habbo-stories-content\.s3\.amazonaws\.com\//;

  // dil.js yüklenmemişse kullanılacak Türkçe metinler (çeviriler dil.js içinde)
  const TR = {
    f_baslik: "Fotoğraflar", f_alt: "Oyuncuların çektiği ve Habbo'da yayınlanan son fotoğraflar.",
    f_ara: "Oyuncu adı ara (çeken ya da beğenen)...", f_begeni: "En çok beğenilen", f_begenenler: "Beğenenler",
    f_begeniYok: "Henüz beğeni yok", f_hata: "Fotoğraflar şu an alınamıyor. Biraz sonra tekrar dene.",
    f_bos: "Sonuç yok. Aramayı kısaltmayı ya da başka bir otel seçmeyi dene.", f_oda: "Oda", f_ceken: "Çeken",
    f_ac: "Görseli yeni sekmede aç", f_sorgula: "Oyuncuyu sorgula", f_otelYok: "Yanıt vermeyen oteller:",
    f_say: "fotoğraf", f_kapat: "Kapat", f_onceki: "Önceki", f_sonraki: "Sonraki", f_tekrar: "Tekrar dene", f_otel: "Otel",
    tumOtel: "Tüm oteller", yeni: "Yeniden eskiye", daha: "Daha fazla göster", gorselYok: "Görsel yok", tarih: "Tarih",
  };
  const t = k => (typeof DIL !== "undefined" && DIL.T && DIL.T[k]) ? DIL.t(k) : (TR[k] || k);
  const dil = () => (typeof DIL !== "undefined" ? DIL.iso() : "tr");
  const sayi = n => n.toLocaleString(dil());

  const el = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  const bayrak = k => (typeof flag === "function" && AD[k]) ? flag(k) : "";   // site içindeki sabit SVG bayraklar
  const avatar = (ad, otel, sinif) => (typeof SITE !== "undefined" && SITE.avatar)
    ? SITE.avatar({ ad, otel }, "m", true, sinif || "kucuk") : el("span", "av");
  const KALP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  function goreli(ms) {
    try {
      const s = Math.round((ms - Date.now()) / 1000), a = Math.abs(s), rf = new Intl.RelativeTimeFormat(dil(), { numeric: "auto" });
      if (a < 60) return rf.format(s, "second");
      if (a < 3600) return rf.format(Math.round(s / 60), "minute");
      if (a < 86400) return rf.format(Math.round(s / 3600), "hour");
      if (a < 2592000) return rf.format(Math.round(s / 86400), "day");
      return rf.format(Math.round(s / 2592000), "month");
    } catch { return new Date(ms).toLocaleDateString(dil()); }
  }
  function tamTarih(ms) {
    try { return new Date(ms).toLocaleString(dil(), { dateStyle: "medium", timeStyle: "short" }); } catch { return new Date(ms).toLocaleString(); }
  }

  let kok, dlg, kuruldu = false, ix = -1, gosterilen = 0, seq = 0, tumHata = false;
  let tum = [], liste = [], hatali = [];
  const UI = {}, DR = {}, veri = {}, S = { otel: "tr", q: "", sirala: "yeni" };

  /* ---------- veri ---------- */
  const taze = o => veri[o] && Date.now() - veri[o].z < TAZE_MS;

  function gecerli(f) {
    return f && typeof f.id === "string" && typeof f.url === "string" && GORSEL_RE.test(f.url) && Array.isArray(f.begeniler);
  }

  async function otelCek(otel) {
    if (taze(otel)) return veri[otel].liste;
    const ctl = new AbortController(), z = setTimeout(() => ctl.abort(), ZAMAN_ASIMI);
    try {
      const r = await fetch(FOTO_API + "?otel=" + encodeURIComponent(otel), { credentials: "omit", signal: ctl.signal });
      if (!r.ok) throw new Error("http " + r.status);
      const j = await r.json();
      if (!j || !j.ok || !Array.isArray(j.fotolar)) throw new Error("bicim");
      const l = j.fotolar.filter(gecerli).map(f => {
        f.otel = otel;
        f.onizleme = GORSEL_RE.test(f.onizleme || "") ? f.onizleme : f.url;
        f._s = (f.ceken + " " + f.begeniler.join(" ")).toLocaleLowerCase("tr");
        return f;
      });
      veri[otel] = { z: Date.now(), liste: l };
      return l;
    } finally { clearTimeout(z); }
  }

  async function yukle() {
    const n = ++seq, hedef = S.otel ? [S.otel] : OTELLER.map(o => o[0]);
    if (!hedef.every(taze)) iskelet();
    const sonuc = await Promise.allSettled(hedef.map(otelCek));
    if (n !== seq) return;   // daha yeni bir istek başladı
    tum = []; hatali = [];
    sonuc.forEach((s, i) => { if (s.status === "fulfilled") s.value.forEach(f => tum.push(f)); else hatali.push(hedef[i]); });
    tumHata = hatali.length === hedef.length;
    ciz();
  }

  function sec() {
    const q = S.q.trim().toLocaleLowerCase("tr");
    const l = tum.filter(f => !q || f._s.indexOf(q) >= 0);
    l.sort(S.sirala === "begeni"
      ? (a, b) => b.begeniler.length - a.begeniler.length || b.zaman - a.zaman
      : (a, b) => b.zaman - a.zaman);
    return l;
  }

  /* ---------- liste ---------- */
  function iskelet() {
    UI.grid.textContent = ""; UI.more.hidden = true;
    UI.stat.textContent = t("yukleniyor");
    for (let i = 0; i < 12; i++) {
      const k = el("div", "fo-k sk"), g = el("span", "fo-img yuk");
      k.append(g, el("span", "fo-alt"));
      UI.grid.append(k);
    }
  }

  function kart(f) {
    const b = el("button", "fo-k"); b.type = "button";
    const g = el("span", "fo-img yuk"), im = new Image();
    im.alt = ""; im.loading = "lazy"; im.decoding = "async";
    im.onload = () => g.classList.remove("yuk");
    im.onerror = () => { g.classList.remove("yuk"); im.remove(); g.append(el("span", "fo-yok", t("gorselYok"))); };
    im.src = f.onizleme; g.append(im);
    const bay = el("span", "fo-bayrak"); bay.innerHTML = bayrak(f.otel);
    const bg = el("span", "fo-begeni" + (f.begeniler.length ? "" : " sifir"));
    bg.innerHTML = KALP; bg.append(String(f.begeniler.length));
    g.append(bay, bg);
    const alt = el("span", "fo-alt"), met = el("span", "fo-met");
    met.append(el("b", "", f.ceken), el("small", "", goreli(f.zaman)));
    alt.append(avatar(f.ceken, f.otel, "kucuk"), met);
    b.append(g, alt);
    b.onclick = () => buyut(f);
    return b;
  }

  function daha() {
    const son = Math.min(gosterilen + SAYFA, liste.length), frag = document.createDocumentFragment();
    for (let i = gosterilen; i < son; i++) frag.append(kart(liste[i]));
    UI.grid.append(frag); gosterilen = son;
    const kalan = liste.length - gosterilen;
    UI.more.hidden = kalan <= 0;
    UI.more.textContent = t("daha") + " (" + sayi(kalan) + ")";
  }

  function chip(metin, temizle) {
    const c = el("button", "chip", metin + " ×"); c.type = "button"; c.onclick = temizle; return c;
  }

  function ciz() {
    liste = sec(); gosterilen = 0;
    UI.grid.textContent = ""; UI.stat.textContent = "";
    if (tumHata) {
      const k = el("div", "fo-bos"), b = el("button", "more", t("f_tekrar")); b.type = "button";
      b.onclick = () => { Object.keys(veri).forEach(o => delete veri[o]); yukle(); };
      k.append(el("p", "empty", t("f_hata")), b);
      UI.grid.append(k); UI.more.hidden = true; return;
    }
    UI.stat.append(el("strong", "", sayi(liste.length) + " " + t("f_say")));
    if (S.otel) UI.stat.append(chip(t("f_otel") + ": " + AD[S.otel], () => { S.otel = ""; UI.otel.value = ""; yukle(); }));
    if (S.q.trim()) UI.stat.append(chip(S.q.trim(), () => { S.q = ""; UI.q.value = ""; ciz(); }));
    if (hatali.length) UI.stat.append(el("span", "fo-uyari", t("f_otelYok") + " " + hatali.map(o => AD[o]).join(", ")));
    if (!liste.length) {
      const k = el("div", "fo-bos"); k.append(el("p", "empty", t("f_bos")));
      UI.grid.append(k); UI.more.hidden = true; return;
    }
    daha();
  }

  /* ---------- büyütme penceresi ---------- */
  function oyuncuyaGit(ad, otel) {
    const m = document.getElementById("mO"), un = document.getElementById("un"), ug = document.getElementById("ug"), uh = document.getElementById("uh");
    if (!m || !un || !ug) return;
    dlg.close(); m.click();
    if (uh) uh.value = otel;
    un.value = ad; ug.click();
    const modlar = document.querySelector(".modes");
    if (modlar) modlar.scrollIntoView({ block: "start" });
  }

  function begenenCiz(f, hepsi) {
    DR.bas.textContent = t("f_begenenler") + " (" + sayi(f.begeniler.length) + ")";
    DR.liste.textContent = "";
    if (!f.begeniler.length) { DR.liste.append(el("p", "fd-yok", t("f_begeniYok"))); return; }
    const L = hepsi ? f.begeniler : f.begeniler.slice(0, BEGENEN_ILK), frag = document.createDocumentFragment();
    L.forEach(ad => {
      const b = el("button", "fd-lk"); b.type = "button"; b.title = t("f_sorgula");
      b.append(avatar(ad, f.otel, "kucuk"), el("span", "", ad));
      b.onclick = () => oyuncuyaGit(ad, f.otel);
      frag.append(b);
    });
    DR.liste.append(frag);
    if (L.length < f.begeniler.length) {
      const m = el("button", "fd-daha", t("daha") + " (+" + sayi(f.begeniler.length - L.length) + ")"); m.type = "button";
      m.onclick = () => begenenCiz(f, true);
      DR.liste.append(m);
    }
  }

  function doldur(f) {
    DR.img.onerror = null; DR.img.alt = f.ceken; DR.img.src = f.url;
    DR.img.onerror = () => { if (DR.img.src !== f.onizleme) DR.img.src = f.onizleme; };

    DR.ceken.textContent = "";
    const ad = el("button", "fd-ad", f.ceken); ad.type = "button"; ad.title = t("f_sorgula");
    ad.onclick = () => oyuncuyaGit(f.ceken, f.otel);
    const kim = el("div", "fd-kim"); kim.append(ad, el("small", "", t("f_ceken") + " · " + goreli(f.zaman)));
    DR.ceken.append(avatar(f.ceken, f.otel, "orta"), kim);

    DR.bilgi.textContent = "";
    const otelDd = el("dd"); otelDd.innerHTML = bayrak(f.otel); otelDd.append(" " + AD[f.otel]);
    DR.bilgi.append(el("dt", "", t("f_otel")), otelDd);
    if (f.oda > 0) {
      const a = el("a", "", String(f.oda)); a.target = "_blank"; a.rel = "noopener noreferrer";
      a.href = "https://www." + AD[f.otel] + "/room/" + f.oda;
      const dd = el("dd"); dd.append(a);
      DR.bilgi.append(el("dt", "", t("f_oda")), dd);
    }
    DR.bilgi.append(el("dt", "", t("tarih")), el("dd", "", tamTarih(f.zaman)));

    begenenCiz(f, false);
    DR.ac.href = f.url;
    DR.on.hidden = ix <= 0; DR.sn.hidden = ix >= liste.length - 1;
  }

  function buyut(f) {
    ix = liste.indexOf(f); doldur(f);
    if (!dlg.open) dlg.showModal();
    DR.liste.scrollTop = 0; dlg.querySelector(".fd-in").scrollTop = 0;
  }
  function git(d) {
    const j = ix + d;
    if (j < 0 || j >= liste.length) return;
    ix = j; doldur(liste[j]);
  }

  function diyalogKur() {
    dlg = el("dialog"); dlg.id = "fdlg"; dlg.dataset.bas = t("f_baslik"); dlg.setAttribute("aria-label", t("f_baslik"));
    dlg.innerHTML =
      '<button class="fd-x" type="button" data-r="x">✕</button>' +
      '<div class="fd-in">' +
        '<div class="fd-sahne"><button class="fd-ok fd-on" type="button" data-r="on">‹</button><img class="fd-img" alt="" data-r="img"><button class="fd-ok fd-sn" type="button" data-r="sn">›</button></div>' +
        '<div class="fd-yan"><div class="fd-ceken" data-r="ceken"></div><dl class="fd-bilgi" data-r="bilgi"></dl>' +
        '<h3 class="fd-bas" data-r="bas"></h3><div class="fd-liste" data-r="liste"></div><a class="fd-ac" target="_blank" rel="noopener noreferrer" data-r="ac"></a></div>' +
      '</div>';
    dlg.querySelectorAll("[data-r]").forEach(e => { DR[e.dataset.r] = e; });
    DR.x.setAttribute("aria-label", t("f_kapat")); DR.on.setAttribute("aria-label", t("f_onceki")); DR.sn.setAttribute("aria-label", t("f_sonraki"));
    DR.ac.textContent = t("f_ac");
    DR.x.onclick = () => dlg.close();
    DR.on.onclick = () => git(-1); DR.sn.onclick = () => git(1);
    dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", e => { if (e.key === "ArrowLeft") git(-1); else if (e.key === "ArrowRight") git(1); });
    dlg.addEventListener("close", () => { DR.img.onerror = null; DR.img.removeAttribute("src"); });
    document.body.append(dlg);
  }

  /* ---------- sayfa iskeleti ---------- */
  function kur() {
    kok = document.getElementById("fts");
    if (!kok) return false;
    kok.textContent = "";
    const bas = el("div", "fo-bas"); bas.append(el("h2", "", t("f_baslik")), el("p", "", t("f_alt")));

    const tools = el("div", "tools fo-tools");
    const o = el("select"); o.setAttribute("aria-label", t("f_otel"));
    o.add(new Option(t("tumOtel"), "")); OTELLER.forEach(x => o.add(new Option(x[1], x[0]))); o.value = S.otel;
    const q = el("input"); q.type = "search"; q.maxLength = 30; q.placeholder = t("f_ara"); q.setAttribute("aria-label", t("f_ara"));
    q.autocomplete = "off"; q.spellcheck = false; q.setAttribute("autocapitalize", "off");
    const s = el("select"); s.setAttribute("aria-label", t("yeni") + " / " + t("f_begeni"));
    s.add(new Option(t("yeni"), "yeni")); s.add(new Option(t("f_begeni"), "begeni"));
    tools.append(o, q, s);

    UI.otel = o; UI.q = q;
    UI.stat = el("div", "stat"); UI.stat.setAttribute("aria-live", "polite");
    UI.grid = el("div", "fo-grid");
    UI.more = el("button", "more"); UI.more.type = "button"; UI.more.hidden = true;
    kok.append(bas, tools, UI.stat, UI.grid, UI.more);

    o.onchange = () => { S.otel = o.value; yukle(); };
    s.onchange = () => { S.sirala = s.value; ciz(); };
    let tm; q.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { S.q = q.value; ciz(); }, 150); };
    UI.more.onclick = daha;
    return true;
  }

  function ac() {
    if (!kuruldu) { if (!kur()) return; diyalogKur(); kuruldu = true; }
    yukle();
  }

  window.FOTO_UI = { ac };
})();
