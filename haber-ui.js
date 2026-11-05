/* Habbo Arşiv - ana sayfadaki "Haberler" bölümü. İlk açıldığında yayınlanmış haberleri listeler. */
(function () {
  var kuruldu = false;
  window.HABER_UI = {
    ac: function () {
      if (kuruldu) return; kuruldu = true;
      var kok = document.getElementById("hs");
      kok.innerHTML = '<p class="mb-alt">Habbo Arşiv\'den güncel haberler ve rehberler.</p><div class="hb-grid" id="hbliste">Yükleniyor...</div>';
      var kutu = kok.querySelector("#hbliste");
      HESAP.rest("haberler?select=id,baslik,ozet,kapak,etiketler,sicak,yayin_tarihi,profiller(habbo_ad,otel)&durum=eq.yayinda&order=yayin_tarihi.desc&limit=60")
        .then(function (r) {
          kutu.textContent = "";
          if (!r.ok) { kutu.textContent = "Haberler yüklenemedi. Sayfayı yenile ya da biraz sonra tekrar dene."; return; }
          if (!r.v.length) { kutu.textContent = "Henüz haber yok."; return; }
          r.v.forEach(function (n) {
            var a = document.createElement("a"); a.className = "hb-kart"; a.href = "haber?id=" + n.id;
            var kap = document.createElement("div"); kap.className = "hb-kap";
            if (n.kapak && n.kapak.indexOf("https://res.cloudinary.com/") === 0) {
              var im = document.createElement("img"); im.loading = "lazy"; im.alt = ""; im.src = n.kapak.replace("/upload/", "/upload/w_560/"); kap.appendChild(im);
            }
            if (n.sicak) { var h = document.createElement("span"); h.className = "hb-hot"; h.textContent = "HOT"; kap.appendChild(h); }
            var ic = document.createElement("div"); ic.className = "hb-ic";
            if ((n.etiketler || []).length) {
              var et = document.createElement("div"); et.className = "hb-et";
              n.etiketler.forEach(function (x) { var s = document.createElement("span"); s.textContent = x; et.appendChild(s); });
              ic.appendChild(et);
            }
            var b = document.createElement("h3"); b.textContent = n.baslik; ic.appendChild(b);
            if (n.ozet) { var p = document.createElement("p"); p.textContent = n.ozet; ic.appendChild(p); }
            var k = document.createElement("small"), y = n.profiller || {};
            k.textContent = (y.habbo_ad ? y.habbo_ad + " (" + (HESAP.OTELLER[y.otel] || "") + ") · " : "") +
              new Date(n.yayin_tarihi).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
            ic.appendChild(k); a.appendChild(kap); a.appendChild(ic); kutu.appendChild(a);
          });
        })
        .catch(function () { kutu.textContent = "Haberler yüklenemedi. Sayfayı yenile ya da biraz sonra tekrar dene."; });
    }
  };
})();
