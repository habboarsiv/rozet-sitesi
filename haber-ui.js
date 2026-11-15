/* Habbo Arşiv - ana sayfadaki "Haberler" bölümü. İlk açıldığında yayınlanmış haberleri listeler:
   arama kutusu, yazar avatarı, yorum sayacı ve (yetkili girişliyse) "Haber yaz" kısayolu. */
(function () {
  var kuruldu = false;
  var SEC = "id,baslik,ozet,kapak,etiketler,sicak,yayin_tarihi,profiller(habbo_ad,otel)";
  var SIRA = "&durum=eq.yayinda&order=yayin_tarihi.desc&limit=60";
  var SVG = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  var IC_ARA = SVG('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>');
  var IC_YORUM = SVG('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>');

  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  // Türkçe harfleri ve büyük/küçük harfi yok sayar: "Işık" yazınca "isik" da bulunur
  function sade(s) { return String(s || "").toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  function kart(n) {
    var a = el("a", "hb-kart"); a.href = "haber?id=" + n.id;
    var kap = el("div", "hb-kap");
    if (n.kapak && n.kapak.indexOf("https://res.cloudinary.com/") === 0) {
      var im = document.createElement("img"); im.loading = "lazy"; im.alt = ""; im.src = n.kapak.replace("/upload/", "/upload/w_560/"); kap.appendChild(im);
    }
    if (n.sicak) kap.appendChild(el("span", "hb-hot", "HOT"));
    var ic = el("div", "hb-ic");
    if ((n.etiketler || []).length) {
      var et = el("div", "hb-et");
      n.etiketler.forEach(function (x) { et.appendChild(el("span", "", x)); });
      ic.appendChild(et);
    }
    ic.appendChild(el("h3", "", n.baslik));
    if (n.ozet) ic.appendChild(el("p", "", n.ozet));

    var y = n.profiller || {}, pie = el("div", "hb-pie");
    var yz = el("span", "hb-yz");
    if (y.habbo_ad && typeof SITE !== "undefined" && SITE.avatar) yz.appendChild(SITE.avatar({ ad: y.habbo_ad, otel: y.otel }, "m", true, "hb-av"));
    var yk = el("span", "hb-yk");
    if (y.habbo_ad) yk.appendChild(el("b", "", y.habbo_ad));
    yk.appendChild(el("time", "", new Date(n.yayin_tarihi).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })));
    yz.appendChild(yk); pie.appendChild(yz);
    var say = n.yorumlar && n.yorumlar[0] ? n.yorumlar[0].count : null;
    if (say != null) {
      var yo = el("span", "hb-yo"); yo.title = say + " yorum"; yo.setAttribute("aria-label", say + " yorum");
      yo.innerHTML = IC_YORUM; yo.appendChild(document.createTextNode(String(say))); pie.appendChild(yo);
    }
    ic.appendChild(pie); a.appendChild(kap); a.appendChild(ic);
    return { a: a, metin: sade([n.baslik, n.ozet, (n.etiketler || []).join(" "), y.habbo_ad].join(" ")) };
  }

  window.HABER_UI = {
    ac: function () {
      if (kuruldu) return; kuruldu = true;
      var kok = document.getElementById("hs");
      kok.textContent = "";

      var ust = el("div", "hb-top");
      ust.appendChild(el("p", "mb-alt", "Habbo Arşiv'den güncel haberler."));
      var etiket = el("label", "hb-ara"); etiket.innerHTML = IC_ARA;
      var girdi = document.createElement("input");
      girdi.type = "search"; girdi.placeholder = "Haberlerde ara"; girdi.maxLength = 60; girdi.autocomplete = "off"; girdi.spellcheck = false;
      girdi.setAttribute("aria-label", "Haberlerde ara");
      etiket.appendChild(girdi); ust.appendChild(etiket);
      // Yazar, moderatör ve yönetici için haber paneli kısayolu
      var h = typeof HESAP !== "undefined" && HESAP.oku ? HESAP.oku() : null;   // HESAP "const" olduğu için window.HESAP değil
      if (h && typeof SITE !== "undefined" && ["yazar", "moderator", "yonetici"].indexOf(SITE.rolOf(h)) > -1) {
        var yaz = el("a", "hb-yaz", "Haber yaz"); yaz.href = "/haber-yaz"; ust.appendChild(yaz);
      }
      var izgara = el("div", "hb-grid"); izgara.id = "hbliste"; izgara.textContent = "Yükleniyor...";
      var bos = el("p", "hb-bos"); bos.setAttribute("role", "status"); bos.setAttribute("aria-live", "polite");
      kok.append(ust, izgara, bos);

      var kartlar = [];
      function uygula() {
        var jt = sade(girdi.value.trim()).split(/\s+/).filter(Boolean), gor = [];
        kartlar.forEach(function (k) {
          var ok = jt.every(function (t) { return k.metin.indexOf(t) > -1; });
          k.a.style.display = ok ? "" : "none";
          k.a.classList.remove("hb-ilk");
          if (ok) gor.push(k.a);
        });
        if (gor.length) gor[0].classList.add("hb-ilk");   // ilk görünen haber büyük kart olur
        izgara.setAttribute("data-n", gor.length > 3 ? "m" : String(gor.length));
        bos.textContent = !gor.length && kartlar.length ? "Aramana uyan haber bulunamadı." : "";
      }
      girdi.addEventListener("input", uygula);

      var HATA = "Haberler yüklenemedi. Sayfayı yenile ya da biraz sonra tekrar dene.";
      // Yorum sayısı alınamazsa (ilişki tanımlı değilse) haberler sayaçsız yine de yüklenir
      HESAP.rest("haberler?select=" + SEC + ",yorumlar(count)" + SIRA)
        .then(function (r) { return r.ok ? r : HESAP.rest("haberler?select=" + SEC + SIRA); })
        .then(function (r) {
          izgara.textContent = "";
          if (!r.ok) { izgara.textContent = HATA; return; }
          if (!r.v.length) { izgara.textContent = "Henüz haber yok."; return; }
          r.v.forEach(function (n) { var k = kart(n); kartlar.push(k); izgara.appendChild(k.a); });
          uygula();
        })
        .catch(function () { izgara.textContent = HATA; });
    }
  };
})();
