/* Habbo Arşiv - ana sayfa üst alanı (hero) davranışları.
   index.html'deki inline kod (S, go, suz, item, BADGES, HOTELS ...) çalıştıktan SONRA yüklenir.
   Yaptıkları: renkli başlık, istatistik sayacı, hızlı erişim çipleri, rozet şeridi, "/" kısayolu,
   sekme sayaçları, yapışkan başlık ölçüsü, oyuncu sorgu sonucunu kapatma. */
(function () {
  "use strict";
  var form = document.getElementById("heroForm");
  if (!form || typeof BADGES === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var azalt = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
  var davranis = azalt ? "auto" : "smooth";
  var sayi = function (n) { return n.toLocaleString("tr-TR"); };

  /* ---- 1) Başlıkta son kelime ("Arşiv") renkli ---- */
  var h1 = document.querySelector(".hero h1");
  if (h1) {
    var kelimeler = String(typeof SITE_ADI !== "undefined" ? SITE_ADI : h1.textContent).trim().split(/\s+/);
    var son = kelimeler.pop(), sp = document.createElement("span");
    sp.className = "vurgu"; sp.textContent = son;
    h1.textContent = kelimeler.length ? kelimeler.join(" ") + " " : "";
    h1.appendChild(sp);
  }

  /* ---- 2) Yapışkan üst çubuğun yüksekliğini CSS'e bildir (sekmeler ve filtre paneli buna göre durur) ---- */
  function olc() {
    var h = $("siteHeader");
    if (h) document.documentElement.style.setProperty("--sh-h", h.offsetHeight + "px");
  }
  olc();
  addEventListener("resize", olc);
  addEventListener("load", olc);
  if (window.ResizeObserver && $("siteHeader")) new ResizeObserver(olc).observe($("siteHeader"));

  /* ---- 3) İstatistik satırı (sayarak artar) ---- */
  function say(e, hedef) {
    if (azalt || hedef < 30) { e.textContent = sayi(hedef); return; }
    var t0 = null, sure = 900;
    (function adim(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / sure, 1);
      e.textContent = sayi(Math.round(hedef * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(adim);
    })(performance.now());
  }
  var promoSayi = typeof PROMOS !== "undefined" && PROMOS.length ? PROMOS.length : 0;
  var deg = {
    rozet: BADGES.length,
    otel: typeof HOTELS !== "undefined" ? HOTELS.length : 0,
    promo: promoSayi
  };
  Object.keys(deg).forEach(function (k) {
    var e = document.querySelector('[data-say="' + k + '"]');
    if (e && deg[k]) say(e, deg[k]);
  });
  var te = document.querySelector('[data-say="tarih"]');
  if (te) {
    var tr = typeof BUILD !== "undefined" && BUILD.tarih && typeof tarih === "function" ? tarih(BUILD.tarih) : "";
    if (tr) te.textContent = tr; else te.parentNode.previousElementSibling.remove(), te.parentNode.remove();
  }
  if (!promoSayi) document.querySelectorAll("[data-promo]").forEach(function (e) { e.remove(); });

  /* ---- 4) Sekmelerin yanına sayaç (Rozetler, Promolar) ---- */
  [["mR", BADGES.length], ["mP", promoSayi]].forEach(function (x) {
    var b = $(x[0]);
    if (!b || !x[1]) return;
    var s = document.createElement("span"); s.className = "say"; s.textContent = sayi(x[1]); b.appendChild(s);
  });

  /* ---- 5) Hızlı erişim çipleri: mevcut filtreleri görünür kılar ---- */
  var SIRALI = typeof BUILD !== "undefined" && BUILD.sira === "yeni";
  if (typeof BOS !== "undefined") BOS.yeni = false;          // "Hepsini temizle" bunu da sıfırlasın
  var _suz = window.suz, _go = window.go;
  window.suz = function () { var l = _suz(); return S.yeni ? l.filter(yeniMi) : l; };   // "Yeni eklenenler" süzgeci
  window.go = function () { _go(); senkron(); };

  var cipler = [];
  function cip(ad, anahtar) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "hc"; b.textContent = ad; b.setAttribute("aria-pressed", "false");
    b.onclick = function () {
      if ($("mR").getAttribute("aria-pressed") !== "true") $("mR").click();   // Rozetler sekmesine geç
      S[anahtar] = !S[anahtar];
      go();
      if (S[anahtar]) { var l = document.querySelector(".layout"); if (l) l.scrollIntoView({ behavior: davranis, block: "start" }); }
    };
    $("heroCip").appendChild(b); cipler.push([b, anahtar]);
  }
  if (SIRALI) cip("Yeni eklenenler", "yeni");
  cip("Sadece tek otelde olanlar", "tek");
  cip("Açıklamalı rozetler", "desc");

  function senkron() {
    cipler.forEach(function (c) { c[0].setAttribute("aria-pressed", !!S[c[1]]); });
    // "Yeni eklenenler" açıkken, sonuç satırında kaldırılabilir etiket göster
    if (S.yeni && $("stat")) {
      var b = document.createElement("button"); b.className = "chip"; b.type = "button"; b.textContent = "Son eklenenler ×";
      b.onclick = function () { S.yeni = false; go(); };
      $("stat").appendChild(b);
    }
  }
  senkron();

  /* Dokunmatik cihazda klavye ipucu anlamsız: kısa yazı */
  if (window.matchMedia && matchMedia("(hover:none)").matches) $("un").placeholder = "Oyuncu adını yaz";

  /* ---- 6) "/" tuşu oyuncu arama kutusuna odaklanır ---- */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    var a = document.activeElement;
    if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
    if (document.body.classList.contains("gm-kilit") || document.querySelector("dialog[open]")) return;
    e.preventDefault();
    scrollTo({ top: 0, behavior: davranis });
    $("un").focus({ preventScroll: true });
  });

  /* ---- 7) Oyuncu sorgusu: sonuç alanına kaydır, kapatma düğmesi ---- */
  function sonuca() {
    setTimeout(function () {
      var u = $("usr");
      if (u && !u.hidden && $("ud").firstChild) u.scrollIntoView({ behavior: davranis, block: "start" });
    }, 150);
  }
  $("ug").addEventListener("click", sonuca);
  $("un").addEventListener("keydown", function (e) { if (e.key === "Enter") sonuca(); });
  if ($("usrKapat")) $("usrKapat").onclick = function () { $("ud").innerHTML = ""; $("un").focus(); };
  if (typeof KULLANICI_SORGU !== "undefined" && !KULLANICI_SORGU) form.hidden = true;

  /* ---- 8) Rozet şeridi: arşivden rastgele, her ziyarette farklı ---- */
  var sag = $("heroSag");
  if (!sag || (window.matchMedia && matchMedia("(max-width:860px)").matches)) return;   // telefonda yüklenmez

  var havuz = BADGES.filter(function (b) { return b.hotels && b.hotels.length; });
  if (havuz.length < 40) return;
  var ADET = 66, HEDEF = 45, secim = [], kullanilan = {};
  while (secim.length < ADET) {
    var i = Math.floor(Math.random() * havuz.length);
    if (!kullanilan[i]) { kullanilan[i] = 1; secim.push(havuz[i]); }
  }
  var yuklenen = [], bekleyen = secim.length, bitti = false;

  function kur() {
    if (bitti) return; bitti = true;
    if (yuklenen.length < 18) return;                          // yeterince görsel gelmediyse şerit hiç kurulmaz
    var kap = document.createElement("div"); kap.className = "mq";
    var satir = 3;
    for (var r = 0; r < satir; r++) {
      var oge = yuklenen.filter(function (_, k) { return k % satir === r; });
      while (oge.length < 8) oge = oge.concat(oge);            // satır en az bir ekran dolsun
      var sat = document.createElement("div"); sat.className = "mq-sat" + (r === 1 ? " ters" : "");
      var iz = document.createElement("div"); iz.className = "mq-iz";
      var sure = [64, 80, 70][r];
      iz.style.setProperty("--sure", sure + "s");
      iz.style.animationDelay = "-" + (Math.random() * sure).toFixed(1) + "s";
      for (var kopya = 0; kopya < 2; kopya++) oge.forEach(function (o) { iz.appendChild(karo(o)); });
      sat.appendChild(iz); kap.appendChild(sat);
    }
    sag.appendChild(kap);
    requestAnimationFrame(function () { kap.classList.add("hazir"); });
  }
  function karo(o) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "mq-t"; b.tabIndex = -1; b.title = o.b.name || o.b.code;
    var im = new Image(); im.alt = ""; im.src = o.src; b.appendChild(im);
    b.onclick = function () { item(o.b).onclick(); };          // rozet ayrıntı penceresini aç
    return b;
  }
  function bitir() { bekleyen--; if (yuklenen.length >= HEDEF || bekleyen <= 0) kur(); }
  secim.forEach(function (b) {
    var im = new Image(), yol = IMG + encodeURIComponent(b.code), gifDendi = false;
    im.onload = function () { yuklenen.push({ b: b, src: im.src }); bitir(); };
    im.onerror = function () { if (!gifDendi) { gifDendi = true; im.src = yol + ".gif"; return; } bitir(); };
    im.src = yol + ".png";
  });
  setTimeout(kur, 6000);
})();
