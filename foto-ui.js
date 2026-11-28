/* Habbo Arşiv - Fotoğraflar bölümü.
   Habbo'nun herkese açık fotoğraf akışını Worker (foto-worker.js) üzerinden listeler:
   otel filtresi, oyuncu adına göre arama, beğeni sayısı ve beğenen oyuncular.
   Bir oyuncu seçilince oyuncu kartı açılır: "Çektikleri" ve "Beğendikleri" ayrı sekmelerde görünür.
   index.html'deki mod() fonksiyonu sekme açılınca FOTO_UI.ac() çağırır. */
(function () {
  "use strict";

  // Worker'ı Cloudflare'a kurunca adresini buraya yaz (sonunda / olsun)
  const FOTO_API = "https://habbo-foto.habboarsiv-api.workers.dev/";

  const SAYFA = 24, BEGENEN_ILK = 60, TAZE_MS = 60000, ZAMAN_ASIMI = 10000, ONERI_SAYISI = 6;
  const OTELLER = [["tr", "habbo.com.tr"], ["com", "habbo.com"], ["de", "habbo.de"], ["es", "habbo.es"], ["fr", "habbo.fr"],
    ["it", "habbo.it"], ["nl", "habbo.nl"], ["fi", "habbo.fi"], ["br", "habbo.com.br"]];
  const AD = {}; OTELLER.forEach(o => { AD[o[0]] = o[1]; });
  const GORSEL_RE = /^https:\/\/habbo-stories-content\.s3\.amazonaws\.com\//;

  // dil.js yüklenmemişse kullanılacak Türkçe metinler (çeviriler dil.js içinde)
  const TR = {
    f_baslik: "Fotoğraflar", f_alt: "Oyuncuların çektiği ve Habbo'da yayınlanan son fotoğraflar.",
    f_ara: "Oyuncu adı ara", f_begeni: "En çok beğenilen", f_begenenler: "Beğenenler",
    f_begeniYok: "Henüz beğeni yok", f_hata: "Fotoğraflar şu an alınamıyor. Biraz sonra tekrar dene.",
    f_bos: "Sonuç yok. Aramayı kısaltmayı ya da başka bir otel seçmeyi dene.", f_oda: "Oda", f_ceken: "Çeken",
    f_ac: "Görseli yeni sekmede aç", f_sorgula: "Oyuncuyu sorgula", f_otelYok: "Yanıt vermeyen oteller:",
    f_say: "fotoğraf", f_cekti: "Çektikleri", f_begendi: "Beğendikleri", f_stCekti: "Çektiği fotoğraf", f_stAlinan: "Aldığı beğeni",
    f_stBegendi: "Beğendiği fotoğraf", f_oyuncuFoto: "Bu oyuncunun fotoğrafları", f_oyBos: "Bu oyuncunun burada gösterilecek fotoğrafı yok.",
    f_kapsam: "Yalnızca son paylaşılan fotoğraflar arasında aranır.", f_kapat: "Kapat", f_onceki: "Önceki", f_sonraki: "Sonraki", f_tekrar: "Tekrar dene", f_otel: "Otel",
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

  const KAMERA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>';

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
  let tum = [], liste = [], hatali = [], E = new Map(), onerListe = [], onerIx = -1, bekleyen = false;
  const UI = {}, DR = {}, veri = {}, oyuncuFoto = {}, tamDurum = {};
  // oyuncu: seçili oyuncu {ad, otel} ya da null;  mod: "cekti" | "begendi"
  const S = { otel: "tr", q: "", sirala: "yeni", oyuncu: null, mod: "cekti" };
  const ank = e => e.ad.toLocaleLowerCase("tr") + "|" + e.otel;   // oyuncu anahtarı: ad + otel (aynı ad başka otelde başka kişi olabilir)

  /* ---------- veri ---------- */
  const taze = o => veri[o] && Date.now() - veri[o].z < TAZE_MS;

  function gecerli(f) {
    return f && typeof f.id === "string" && typeof f.url === "string" && GORSEL_RE.test(f.url) && Array.isArray(f.begeniler);
  }

  function hazirla(f, otel) {
    f.otel = otel;
    f.onizleme = GORSEL_RE.test(f.onizleme || "") ? f.onizleme : f.url;
    f._c = f.ceken.toLocaleLowerCase("tr");   // aramada yalnızca çeken oyuncunun adına bakılır
    return f;
  }

  // Yüklenen fotoğraflardan oyuncu dizini: kim kaç fotoğraf çekmiş, kimin fotoğraflarını beğenmiş
  function endeksle() {
    E = new Map();
    const al = (ad, otel) => {
      const k = ad.toLocaleLowerCase("tr") + "|" + otel;
      let e = E.get(k);
      if (!e) { e = { ad, otel, id: "", cekti: [], begendi: [] }; E.set(k, e); }
      return e;
    };
    tum.forEach(f => {
      if (!f.ceken) return;
      const c = al(f.ceken, f.otel);
      c.ad = f.ceken; c.cekti.push(f);
      if (f.cekenId) c.id = f.cekenId;
      f.begeniler.forEach(b => { al(b, f.otel).begendi.push(f); });
    });
  }

  // Oyuncunun çektiği fotoğraflar: akıştakiler + (varsa) oyuncuya özel akıştan gelenler
  function cektiListe(e) {
    const ek = oyuncuFoto[ank(e)];
    if (!ek || !ek.length) return e.cekti;
    const ids = new Set(e.cekti.map(f => f.id));
    return e.cekti.concat(ek.filter(f => !ids.has(f.id)));
  }

  // Oyuncuya özel akış (Habbo bunu veriyorsa daha eski fotoğraflar da gelir). Olmazsa sessizce geçilir.
  async function tamFotoCek(e) {
    const k = ank(e);
    if (!e.id || tamDurum[k]) return;
    tamDurum[k] = "yukleniyor";
    try {
      const r = await fetch(FOTO_API + "?otel=" + encodeURIComponent(e.otel) + "&oyuncu=" + encodeURIComponent(e.id), { credentials: "omit" });
      const j = await r.json();
      if (!j || !j.ok || !Array.isArray(j.fotolar)) throw new Error("bicim");
      oyuncuFoto[k] = j.fotolar.filter(gecerli).map(f => hazirla(f, e.otel));
      tamDurum[k] = "tamam";
    } catch { tamDurum[k] = "yok"; }
    if (S.oyuncu && ank(S.oyuncu) === k) ciz();
  }

  async function otelCek(otel) {
    if (taze(otel)) return veri[otel].liste;
    const ctl = new AbortController(), z = setTimeout(() => ctl.abort(), ZAMAN_ASIMI);
    try {
      const r = await fetch(FOTO_API + "?otel=" + encodeURIComponent(otel), { credentials: "omit", signal: ctl.signal });
      if (!r.ok) throw new Error("http " + r.status);
      const j = await r.json();
      if (!j || !j.ok || !Array.isArray(j.fotolar)) throw new Error("bicim");
      const l = j.fotolar.filter(gecerli).map(f => hazirla(f, otel));
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
    endeksle();
    if (S.oyuncu && !E.has(ank(S.oyuncu))) S.oyuncu = null;
    ciz();
  }

  function sec() {
    let l;
    if (S.oyuncu) {
      const e = E.get(ank(S.oyuncu));
      l = !e ? [] : (S.mod === "begendi" ? e.begendi : cektiListe(e)).slice();
    } else {
      const q = S.q.trim().toLocaleLowerCase("tr");
      l = tum.filter(f => !q || f._c.indexOf(q) >= 0);
    }
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

  /* ---------- oyuncu kartı ve öneriler ---------- */
  function oyuncuSec(e) {
    S.oyuncu = { ad: e.ad, otel: e.otel };
    S.mod = cektiListe(e).length ? "cekti" : "begendi";
    S.q = e.ad; UI.q.value = e.ad; UI.oneri.hidden = true;
    tamFotoCek(e); ciz();
  }
  function oyuncuKapat() {
    S.oyuncu = null; S.q = ""; UI.q.value = ""; UI.oneri.hidden = true; ciz();
  }

  function panelCiz() {
    const P = UI.panel, e = S.oyuncu && E.get(ank(S.oyuncu));
    P.textContent = "";
    if (!e) { P.hidden = true; return; }
    P.hidden = false;
    const cek = cektiListe(e), alinan = cek.reduce((n, f) => n + f.begeniler.length, 0);

    const ust = el("div", "fo-oy-ust"), kim = el("div", "fo-oy-kim"), met = el("div", "fo-oy-met");
    const alt = el("div", "fo-oy-alt"); alt.innerHTML = bayrak(e.otel); alt.append(AD[e.otel]);
    met.append(el("b", "fo-oy-ad", e.ad), alt);
    kim.append(avatar(e.ad, e.otel, "orta"), met);
    const ey = el("div", "fo-eylem");
    const sq = el("button", "fo-btn", t("f_sorgula")); sq.type = "button"; sq.onclick = () => oyuncuyaGit(e.ad, e.otel, true);
    const kp = el("button", "fo-btn fo-kp", "✕"); kp.type = "button"; kp.setAttribute("aria-label", t("f_kapat")); kp.onclick = oyuncuKapat;
    ey.append(sq, kp);
    ust.append(kim, ey);

    const sts = el("div", "fo-st-kap");
    [[cek.length, t("f_stCekti")], [alinan, t("f_stAlinan")], [e.begendi.length, t("f_stBegendi")]].forEach(x => {
      const d = el("div", "fo-st"); d.append(el("b", "", sayi(x[0])), el("small", "", x[1])); sts.append(d);
    });

    const seg = el("div", "seg"); seg.setAttribute("role", "group");
    [["cekti", t("f_cekti"), cek.length], ["begendi", t("f_begendi"), e.begendi.length]].forEach(x => {
      const b = el("button", "tg", x[1] + " (" + sayi(x[2]) + ")"); b.type = "button";
      b.setAttribute("aria-pressed", S.mod === x[0] ? "true" : "false");
      b.onclick = () => { S.mod = x[0]; ciz(); };
      seg.append(b);
    });
    P.append(ust, sts, seg);
    if (S.mod === "begendi" || tamDurum[ank(e)] !== "tamam") P.append(el("p", "fo-not", t("f_kapsam")));
  }

  // Yazılan ada uyan oyuncular (çekenler ve beğenenler); tam eşleşme ve çok fotoğraflı olanlar önde
  function oneriBul(q) {
    q = q.trim().toLocaleLowerCase("tr");
    if (q.length < 2) return [];
    const s = [];
    E.forEach(e => {
      const ad = e.ad.toLocaleLowerCase("tr"), p = ad === q ? 0 : ad.startsWith(q) ? 1 : ad.includes(q) ? 2 : -1;
      if (p >= 0) s.push([p, e]);
    });
    s.sort((a, b) => a[0] - b[0] || (b[1].cekti.length + b[1].begendi.length) - (a[1].cekti.length + a[1].begendi.length) || a[1].ad.localeCompare(b[1].ad, "tr"));
    return s.slice(0, ONERI_SAYISI).map(x => x[1]);
  }
  function vurgula() {
    Array.from(UI.oneri.children).forEach((c, i) => c.setAttribute("aria-selected", i === onerIx ? "true" : "false"));
  }
  function oneriGoster() {
    UI.oneri.textContent = ""; onerIx = -1;
    if (S.oyuncu) { UI.oneri.hidden = true; onerListe = []; return; }
    onerListe = oneriBul(UI.q.value);
    if (!onerListe.length) { UI.oneri.hidden = true; return; }
    onerListe.forEach(e => {
      const b = el("button", "fo-or"); b.type = "button"; b.setAttribute("role", "option");
      const m = el("span", "fo-or-m"), alt = el("small"); alt.innerHTML = bayrak(e.otel); alt.append(AD[e.otel]);
      m.append(el("b", "", e.ad), alt);
      const sy = el("span", "fo-or-s");
      [[KAMERA, e.cekti.length, t("f_cekti")], [KALP, e.begendi.length, t("f_begendi")]].forEach(x => {
        const c = el("span"); c.title = x[2]; c.innerHTML = x[0]; c.append(String(x[1])); sy.append(c);
      });
      b.append(avatar(e.ad, e.otel, "kucuk"), m, sy);
      b.onmousedown = ev => ev.preventDefault();   // yazı kutusu odağını kaybetmesin
      b.onclick = () => oyuncuSec(e);
      UI.oneri.append(b);
    });
    UI.oneri.hidden = false;
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
      UI.panel.hidden = true;
      UI.grid.append(k); UI.more.hidden = true; return;
    }
    panelCiz();
    UI.stat.append(el("strong", "", sayi(liste.length) + " " + t("f_say")));
    if (S.otel) UI.stat.append(chip(t("f_otel") + ": " + AD[S.otel], () => { S.otel = ""; UI.otel.value = ""; yukle(); }));
    if (!S.oyuncu && S.q.trim()) UI.stat.append(chip(S.q.trim(), () => { S.q = ""; UI.q.value = ""; ciz(); }));
    if (hatali.length) UI.stat.append(el("span", "fo-uyari", t("f_otelYok") + " " + hatali.map(o => AD[o]).join(", ")));
    if (!liste.length) {
      const k = el("div", "fo-bos"); k.append(el("p", "empty", t(S.oyuncu ? "f_oyBos" : "f_bos")));
      UI.grid.append(k); UI.more.hidden = true; return;
    }
    daha();
  }

  /* ---------- büyütme penceresi ---------- */
  // Oyuncular sekmesinde sorgulatır (geçmiş, rozetler vb.)
  function oyuncuyaGit(ad, otel, pencereKapali) {
    const m = document.getElementById("mO"), un = document.getElementById("un"), ug = document.getElementById("ug"), uh = document.getElementById("uh");
    if (!m || !un || !ug) return;
    if (!pencereKapali) dlg.close();
    m.click();
    if (uh) uh.value = otel;
    un.value = ad; ug.click();
    const modlar = document.querySelector(".modes");
    if (modlar) modlar.scrollIntoView({ block: "start" });
  }

  // Bu bölümde oyuncunun kendi fotoğraf sayfasını açar
  function oyuncuGaleri(ad, otel) {
    dlg.close();
    const e = E.get(ank({ ad, otel }));
    if (!e) return;
    oyuncuSec(e);
    if (UI.tools) UI.tools.scrollIntoView({ block: "start" });
  }

  function begenenCiz(f, hepsi) {
    DR.bas.textContent = t("f_begenenler") + " (" + sayi(f.begeniler.length) + ")";
    DR.liste.textContent = "";
    if (!f.begeniler.length) { DR.liste.append(el("p", "fd-yok", t("f_begeniYok"))); return; }
    const L = hepsi ? f.begeniler : f.begeniler.slice(0, BEGENEN_ILK), frag = document.createDocumentFragment();
    L.forEach(ad => {
      const b = el("button", "fd-lk"); b.type = "button"; b.title = t("f_oyuncuFoto");
      b.append(avatar(ad, f.otel, "kucuk"), el("span", "", ad));
      b.onclick = () => oyuncuGaleri(ad, f.otel);
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
    const ad = el("button", "fd-ad", f.ceken); ad.type = "button"; ad.title = t("f_oyuncuFoto");
    ad.onclick = () => oyuncuGaleri(f.ceken, f.otel);
    const sq = el("button", "fd-sorgu", t("f_sorgula")); sq.type = "button"; sq.onclick = () => oyuncuyaGit(f.ceken, f.otel);
    const kim = el("div", "fd-kim"); kim.append(ad, el("small", "", t("f_ceken") + " · " + goreli(f.zaman)), sq);
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
    const kap = el("div", "fo-aramakap");
    const q = el("input"); q.type = "search"; q.maxLength = 30; q.placeholder = t("f_ara"); q.setAttribute("aria-label", t("f_ara"));
    q.autocomplete = "off"; q.spellcheck = false; q.setAttribute("autocapitalize", "off");
    const on = el("div", "fo-oneri"); on.setAttribute("role", "listbox"); on.hidden = true;
    kap.append(q, on);
    const s = el("select"); s.setAttribute("aria-label", t("yeni") + " / " + t("f_begeni"));
    s.add(new Option(t("yeni"), "yeni")); s.add(new Option(t("f_begeni"), "begeni"));
    tools.append(o, kap, s);

    UI.otel = o; UI.q = q; UI.oneri = on; UI.aramaKap = kap; UI.tools = tools;
    UI.panel = el("div", "fo-oy"); UI.panel.hidden = true;
    UI.stat = el("div", "stat"); UI.stat.setAttribute("aria-live", "polite");
    UI.grid = el("div", "fo-grid");
    UI.more = el("button", "more"); UI.more.type = "button"; UI.more.hidden = true;
    kok.append(bas, tools, UI.panel, UI.stat, UI.grid, UI.more);

    o.onchange = () => { S.otel = o.value; yukle(); };
    s.onchange = () => { S.sirala = s.value; ciz(); };
    let tm;
    q.oninput = () => {
      S.oyuncu = null; bekleyen = true; clearTimeout(tm);
      tm = setTimeout(() => { bekleyen = false; S.q = q.value; oneriGoster(); ciz(); }, 150);
    };
    q.onfocus = () => { if (!S.oyuncu && q.value.trim().length >= 2) oneriGoster(); };
    q.onkeydown = ev => {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        if (UI.oneri.hidden || !onerListe.length) return;
        ev.preventDefault();
        onerIx = (onerIx + (ev.key === "ArrowDown" ? 1 : -1) + onerListe.length) % onerListe.length; vurgula();
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        if (bekleyen) { clearTimeout(tm); bekleyen = false; S.q = q.value; oneriGoster(); }
        if (onerListe.length) oyuncuSec(onerListe[Math.max(onerIx, 0)]); else ciz();
      } else if (ev.key === "Escape") { UI.oneri.hidden = true; }
    };
    document.addEventListener("click", ev => { if (!kap.contains(ev.target)) UI.oneri.hidden = true; });
    UI.more.onclick = daha;
    return true;
  }

  function ac() {
    if (!kuruldu) { if (!kur()) return; diyalogKur(); kuruldu = true; }
    yukle();
  }

  window.FOTO_UI = { ac };
})();
