/* Habbo Arşiv - Fotoğraflar bölümü.
   Ana görünüm: Habbo'nun herkese açık "son paylaşılan fotoğraflar" akışı (Worker: foto-worker.js), otel filtresiyle.
   Arama kutusu: yazılan oyuncu adı doğrudan Habbo'da aranır (akıştaki fotoğraflara bakılmaz); oyuncu bulununca
   Habbo'nun oyuncuya özel akışından o oyuncunun tüm fotoğrafları çekilir ve bir oyuncu kartıyla gösterilir.
   index.html'deki mod() fonksiyonu sekme açılınca FOTO_UI.ac() çağırır. */
(function () {
  "use strict";

  // Worker'ı Cloudflare'a kurunca adresini buraya yaz (sonunda / olsun)
  const FOTO_API = "https://habbo-foto.habboarsiv-api.workers.dev/";

  const SAYFA = 24, BEGENEN_ILK = 60, TAZE_MS = 60000, ZAMAN_ASIMI = 10000, EN_COK = 1000;   // EN_COK: foto-worker.js'teki sınırla aynı
  const OTELLER = [["tr", "habbo.com.tr"], ["com", "habbo.com"], ["de", "habbo.de"], ["es", "habbo.es"], ["fr", "habbo.fr"],
    ["it", "habbo.it"], ["nl", "habbo.nl"], ["fi", "habbo.fi"], ["br", "habbo.com.br"]];
  const AD = {}; OTELLER.forEach(o => { AD[o[0]] = o[1]; });
  const GORSEL_RE = /^https:\/\/habbo-stories-content\.s3\.amazonaws\.com\//;
  const KIMLIK_RE = /^hh[a-z]{2}-[0-9a-f]{32}$/i;

  // dil.js yüklenmemişse kullanılacak Türkçe metinler (çeviriler dil.js içinde)
  const TR = {
    f_baslik: "Fotoğraflar", f_alt: "Habbo'da yayınlanan son fotoğraflar. Bir oyuncunun tüm fotoğraflarını görmek için adını ara.",
    f_ara: "Oyuncu adı ara", f_begeni: "En çok beğenilen", f_begenenler: "Beğenenler", f_begeniYok: "Henüz beğeni yok",
    f_hata: "Fotoğraflar şu an alınamıyor. Biraz sonra tekrar dene.", f_bos: "Bu otelde gösterilecek fotoğraf yok.",
    f_oda: "Oda", f_ceken: "Çeken", f_ac: "Görseli yeni sekmede aç", f_sorgula: "Oyuncuyu sorgula",
    f_otelYok: "Yanıt vermeyen oteller:", f_say: "fotoğraf", f_kapat: "Kapat", f_onceki: "Önceki", f_sonraki: "Sonraki",
    f_tekrar: "Tekrar dene", f_otel: "Otel", f_stCekti: "Çektiği fotoğraf", f_stAlinan: "Aldığı beğeni",
    f_oyuncuFoto: "Bu oyuncunun fotoğrafları", f_oyBos: "Bu oyuncunun yayınlanmış fotoğrafı yok.",
    f_habboAra: "Habbo'da ara", f_bulunamadi: "Bu adda bir oyuncu bulunamadı.", f_aramaHata: "Oyuncu şu an aranamadı. Biraz sonra tekrar dene.",
    f_once: "{t} önce", f_sinir: "En yeni {n} fotoğraf gösteriliyor.",
    tumOtel: "Tüm oteller", yeni: "Yeniden eskiye", daha: "Daha fazla göster", gorselYok: "Görsel yok", tarih: "Tarih", yukleniyor: "Yükleniyor...",
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
  const ARA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';

  // "3 dakika önce", "7 ay önce", "5 yıl 8 ay önce"
  function goreli(ms) {
    try {
      const simdi = new Date(), d = new Date(ms), fark = Math.round((ms - simdi.getTime()) / 1000), a = Math.abs(fark);
      let ay = (simdi.getFullYear() - d.getFullYear()) * 12 + simdi.getMonth() - d.getMonth();
      if (simdi.getDate() < d.getDate()) ay--;
      const rf = new Intl.RelativeTimeFormat(dil(), { numeric: "auto" });
      if (fark < 0 && ay >= 12) {
        const y = Math.floor(ay / 12), m = ay % 12, nf = u => new Intl.NumberFormat(dil(), { style: "unit", unit: u, unitDisplay: "long" });
        const parca = [nf("year").format(y)];
        if (m) parca.push(nf("month").format(m));
        return t("f_once").replace("{t}", parca.join(" "));
      }
      if (fark < 0 && ay >= 1) return rf.format(-ay, "month");
      if (a < 60) return rf.format(fark, "second");
      if (a < 3600) return rf.format(Math.round(fark / 60), "minute");
      if (a < 86400) return rf.format(Math.round(fark / 3600), "hour");
      return rf.format(Math.round(fark / 86400), "day");
    } catch { return new Date(ms).toLocaleDateString(dil()); }
  }
  function tamTarih(ms) {
    try { return new Date(ms).toLocaleString(dil(), { dateStyle: "medium", timeStyle: "short" }); } catch { return new Date(ms).toLocaleString(); }
  }

  let kok, dlg, kuruldu = false, ix = -1, gosterilen = 0, seq = 0, aramaSeq = 0, tumHata = false;
  let tum = [], liste = [], hatali = [];
  const UI = {}, DR = {}, veri = {}, oyuncuFoto = {}, tamDurum = {}, tamZaman = {};
  // oyuncu: şu an gösterilen oyuncu {ad, otel, id} ya da null (null ise son paylaşılanlar akışı görünür)
  const S = { otel: "tr", sirala: "yeni", oyuncu: null, not: null };   // not: "bulunamadi" | "hata" | null
  const ank = e => e.ad.toLocaleLowerCase("tr") + "|" + e.otel;   // oyuncu anahtarı: ad + otel (aynı ad başka otelde başka kişi olabilir)

  /* ---------- veri ---------- */
  const taze = o => veri[o] && Date.now() - veri[o].z < TAZE_MS;

  function gecerli(f) {
    return f && typeof f.id === "string" && typeof f.url === "string" && GORSEL_RE.test(f.url) && Array.isArray(f.begeniler);
  }
  function hazirla(f, otel) {
    f.otel = otel;
    f.onizleme = GORSEL_RE.test(f.onizleme || "") ? f.onizleme : f.url;
    return f;
  }

  async function workerCek(otel, oyuncu) {
    const ctl = new AbortController(), z = setTimeout(() => ctl.abort(), ZAMAN_ASIMI);
    try {
      const r = await fetch(FOTO_API + "?otel=" + encodeURIComponent(otel) + (oyuncu ? "&oyuncu=" + encodeURIComponent(oyuncu) : ""),
        { credentials: "omit", signal: ctl.signal });
      if (!r.ok) throw new Error("http " + r.status);
      const j = await r.json();
      if (!j || !j.ok || !Array.isArray(j.fotolar)) throw new Error("bicim");
      return j.fotolar.filter(gecerli).map(f => hazirla(f, otel));
    } finally { clearTimeout(z); }
  }

  async function otelCek(otel) {
    if (taze(otel)) return veri[otel].liste;
    const l = await workerCek(otel);
    veri[otel] = { z: Date.now(), liste: l };
    return l;
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

  // Oyuncunun tüm fotoğrafları: Habbo'nun oyuncuya özel akışı (son paylaşılanlar akışına bakılmaz)
  async function tamFotoCek(e) {
    const k = ank(e);
    if (tamDurum[k] === "yukleniyor") return;
    if (tamDurum[k] === "tamam" && Date.now() - tamZaman[k] < TAZE_MS) return;
    if (!KIMLIK_RE.test(e.id || "")) { tamDurum[k] = "yok"; return; }
    tamDurum[k] = "yukleniyor";
    try {
      oyuncuFoto[k] = await workerCek(e.otel, e.id);
      tamDurum[k] = "tamam"; tamZaman[k] = Date.now();
    } catch { tamDurum[k] = "yok"; }
    if (S.oyuncu && ank(S.oyuncu) === k) ciz();
  }

  // Habbo'nun herkese açık kullanıcı sorgusu: adı kimliğe çevirir
  async function kullaniciBul(ad, otel) {
    const ctl = new AbortController(), z = setTimeout(() => ctl.abort(), ZAMAN_ASIMI);
    try {
      const r = await fetch("https://www." + AD[otel] + "/api/public/users?name=" + encodeURIComponent(ad), { credentials: "omit", signal: ctl.signal });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("http " + r.status);
      const j = await r.json();
      return (j && typeof j.uniqueId === "string" && typeof j.name === "string") ? { id: j.uniqueId, ad: j.name } : null;
    } finally { clearTimeout(z); }
  }

  function sirala(l) {
    l.sort(S.sirala === "begeni"
      ? (a, b) => b.begeniler.length - a.begeniler.length || b.zaman - a.zaman
      : (a, b) => b.zaman - a.zaman);
    return l;
  }

  /* ---------- liste ---------- */
  function iskeletEkle() {
    for (let i = 0; i < 12; i++) {
      const k = el("div", "fo-k sk"), g = el("span", "fo-img yuk");
      k.append(g, el("span", "fo-alt"));
      UI.grid.append(k);
    }
  }
  function iskelet() {
    UI.grid.textContent = ""; UI.more.hidden = true;
    UI.stat.textContent = t("yukleniyor");
    iskeletEkle();
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

  function hataKutusu(mesaj, tekrar) {
    const k = el("div", "fo-bos"), b = el("button", "more", t("f_tekrar")); b.type = "button";
    b.onclick = tekrar;
    k.append(el("p", "empty", mesaj), b);
    UI.grid.append(k); UI.more.hidden = true;
  }
  function bosKutu(mesaj) {
    const k = el("div", "fo-bos"); k.append(el("p", "empty", mesaj));
    UI.grid.append(k); UI.more.hidden = true;
  }

  function ciz() {
    UI.grid.textContent = ""; UI.stat.textContent = ""; gosterilen = 0;
    if (S.oyuncu) { oyuncuCiz(); return; }
    UI.panel.hidden = true;
    if (tumHata) { liste = []; hataKutusu(t("f_hata"), () => { Object.keys(veri).forEach(o => delete veri[o]); yukle(); }); return; }
    liste = sirala(tum.slice());
    UI.stat.append(el("strong", "", sayi(liste.length) + " " + t("f_say")));
    if (S.otel) UI.stat.append(chip(t("f_otel") + ": " + AD[S.otel], () => { S.otel = ""; UI.otel.value = ""; yukle(); }));
    if (S.not) UI.stat.append(el("span", "fo-uyari", t(S.not === "hata" ? "f_aramaHata" : "f_bulunamadi")));
    if (hatali.length) UI.stat.append(el("span", "fo-uyari", t("f_otelYok") + " " + hatali.map(o => AD[o]).join(", ")));
    if (!liste.length) { bosKutu(t("f_bos")); return; }
    daha();
  }

  // Oyuncu görünümü: oyuncu kartı + oyuncunun tüm fotoğrafları
  function oyuncuCiz() {
    const e = S.oyuncu, k = ank(e), d = tamDurum[k], fotolar = oyuncuFoto[k] || [];
    panelCiz(e, d === "tamam" ? fotolar : null);
    if (d === "yukleniyor" || !d) { liste = []; UI.stat.textContent = t("yukleniyor"); UI.more.hidden = true; iskeletEkle(); return; }
    if (d === "yok") { liste = []; hataKutusu(t("f_hata"), () => { delete tamDurum[k]; tamFotoCek(e); ciz(); }); return; }
    liste = sirala(fotolar.slice());
    UI.stat.append(el("strong", "", sayi(liste.length) + " " + t("f_say")));
    if (liste.length >= EN_COK) UI.stat.append(el("span", "fo-uyari", t("f_sinir").replace("{n}", sayi(EN_COK))));
    if (!liste.length) { bosKutu(t("f_oyBos")); return; }
    daha();
  }

  /* ---------- oyuncu kartı ve arama ---------- */
  function oyuncuSec(e) {
    S.oyuncu = { ad: e.ad, otel: e.otel, id: e.id }; S.not = null;
    UI.q.value = e.ad; UI.oneri.hidden = true;
    tamFotoCek(e); ciz();
  }
  function oyuncuKapat() {
    S.oyuncu = null; S.not = null; UI.q.value = ""; UI.oneri.hidden = true;
    yukle();
  }

  // Yazılan adı doğrudan Habbo'da arar. otel verilirse yalnızca o otelde, verilmezse seçili otelde (ya da hepsinde).
  async function ara(ad, otel) {
    ad = ad.trim();
    if (ad.length < 2) return;
    const n = ++aramaSeq, hedef = otel ? [otel] : (S.otel ? [S.otel] : OTELLER.map(o => o[0]));
    UI.oneri.hidden = true; UI.panel.hidden = true; UI.more.hidden = true;
    UI.grid.textContent = ""; UI.stat.textContent = t("yukleniyor"); iskeletEkle(); S.not = null;
    const sonuc = await Promise.allSettled(hedef.map(o => kullaniciBul(ad, o)));
    if (n !== aramaSeq) return;   // bu arada yeni bir arama başladı
    const bulunan = []; let hata = 0;
    sonuc.forEach((s, i) => {
      if (s.status !== "fulfilled") hata++;
      else if (s.value) bulunan.push({ ad: s.value.ad, otel: hedef[i], id: s.value.id });
    });
    if (bulunan.length === 1) { oyuncuSec(bulunan[0]); return; }
    S.oyuncu = null; S.not = bulunan.length ? null : (hata === hedef.length ? "hata" : "bulunamadi");
    if (!tum.length && !tumHata) yukle(); else ciz();
    if (bulunan.length > 1) oneriCiz(bulunan, "");   // aynı ad birkaç otelde varsa seçtir
  }

  function panelCiz(e, fotolar) {
    const P = UI.panel;
    P.textContent = ""; P.hidden = false;
    const ust = el("div", "fo-oy-ust"), kim = el("div", "fo-oy-kim"), met = el("div", "fo-oy-met");
    const alt = el("div", "fo-oy-alt"); alt.innerHTML = bayrak(e.otel); alt.append(AD[e.otel]);
    met.append(el("b", "fo-oy-ad", e.ad), alt);
    kim.append(avatar(e.ad, e.otel, "orta"), met);
    const ey = el("div", "fo-eylem");
    const sq = el("button", "fo-btn", t("f_sorgula")); sq.type = "button"; sq.onclick = () => oyuncuyaGit(e.ad, e.otel, true);
    const kp = el("button", "fo-btn fo-kp", "✕"); kp.type = "button"; kp.setAttribute("aria-label", t("f_kapat")); kp.onclick = oyuncuKapat;
    ey.append(sq, kp);
    ust.append(kim, ey);
    P.append(ust);
    if (fotolar) {
      const alinan = fotolar.reduce((n, f) => n + f.begeniler.length, 0), sts = el("div", "fo-st-kap");
      [[fotolar.length, t("f_stCekti")], [alinan, t("f_stAlinan")]].forEach(x => {
        const d = el("div", "fo-st"); d.append(el("b", "", sayi(x[0])), el("small", "", x[1])); sts.append(d);
      });
      P.append(sts);
    }
  }

  // Arama kutusunun altındaki açılır kutu: "Habbo'da ara" satırı ya da (aynı ad birkaç otelde varsa) otel seçimi
  function oneriCiz(l, araAd) {
    UI.oneri.textContent = "";
    l.forEach(e => {
      const b = el("button", "fo-or"); b.type = "button"; b.setAttribute("role", "option");
      const m = el("span", "fo-or-m"), alt = el("small"); alt.innerHTML = bayrak(e.otel); alt.append(AD[e.otel]);
      m.append(el("b", "", e.ad), alt);
      b.append(avatar(e.ad, e.otel, "kucuk"), m);
      b.onmousedown = ev => ev.preventDefault();   // yazı kutusu odağını kaybetmesin
      b.onclick = () => oyuncuSec(e);
      UI.oneri.append(b);
    });
    if (araAd) {
      const b = el("button", "fo-or fo-ara"); b.type = "button"; b.setAttribute("role", "option");
      const ik = el("span", "fo-or-ik"); ik.innerHTML = ARA;
      const m = el("span", "fo-or-m");
      m.append(el("b", "", araAd), el("small", "", t("f_habboAra") + " · " + (S.otel ? AD[S.otel] : t("tumOtel"))));
      b.append(ik, m);
      b.onmousedown = ev => ev.preventDefault();
      b.onclick = () => ara(araAd);
      UI.oneri.append(b);
    }
    UI.oneri.hidden = !UI.oneri.children.length;
  }
  function oneriGoster() {
    const q = UI.q.value.trim();
    oneriCiz([], q.length >= 2 && !(S.oyuncu && q.toLocaleLowerCase("tr") === S.oyuncu.ad.toLocaleLowerCase("tr")) ? q : "");
  }

  /* ---------- büyütme penceresi ---------- */
  // Oyuncular sekmesinde sorgulatır (motto / görünüş geçmişi vb.)
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

  // Bu bölümde oyuncunun tüm fotoğraflarını açar (kimlik biliniyorsa doğrudan, bilinmiyorsa Habbo'da adı aratarak)
  function oyuncuAc(ad, otel, id) {
    dlg.close();
    if (KIMLIK_RE.test(id || "")) oyuncuSec({ ad, otel, id }); else ara(ad, otel);
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
      b.onclick = () => oyuncuAc(ad, f.otel);
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
    ad.onclick = () => oyuncuAc(f.ceken, f.otel, f.cekenId);
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

    // Otel değişince oyuncu görünümü kapanır (oyuncu o otele aittir) ve o otelin akışı yüklenir
    o.onchange = () => { S.otel = o.value; S.oyuncu = null; S.not = null; q.value = ""; on.hidden = true; yukle(); };
    s.onchange = () => { S.sirala = s.value; ciz(); };
    let tm;
    q.oninput = () => {
      clearTimeout(tm);
      if (!q.value.trim()) { on.hidden = true; if (S.oyuncu) oyuncuKapat(); else if (S.not) { S.not = null; ciz(); } return; }
      tm = setTimeout(oneriGoster, 120);
    };
    q.onfocus = () => { if (q.value.trim().length >= 2) oneriGoster(); };
    q.onkeydown = ev => {
      if (ev.key === "Enter") { ev.preventDefault(); clearTimeout(tm); ara(q.value); }
      else if (ev.key === "Escape") { on.hidden = true; }
    };
    UI.more.onclick = daha;
    document.addEventListener("click", ev => { if (!kap.contains(ev.target)) on.hidden = true; });
    return true;
  }

  function ac() {
    if (!kuruldu) { if (!kur()) return; diyalogKur(); kuruldu = true; }
    if (S.oyuncu) { tamFotoCek(S.oyuncu); ciz(); } else yukle();
  }

  window.FOTO_UI = { ac };
})();
