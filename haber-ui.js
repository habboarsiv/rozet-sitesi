/* Habbo Arşiv - ana sayfadaki "Haberler" bölümü. İlk açıldığında yayınlanmış haberleri listeler. */
(function () {
  /* "... tarafından yazıldı" satırının stili (yalnızca bu satıra özel) */
  if (!document.getElementById("hb-yz-style")) {
    var st = document.createElement("style"); st.id = "hb-yz-style";
    st.textContent =
      ".hb-yz{display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line,#2a3040)}" +
      ".hb-yza{flex:none;display:grid;place-items:center;width:30px;height:30px;border-radius:10px;overflow:hidden;background:var(--surface2,#141d36);border:1px solid var(--line2,var(--line,#2a3040))}" +
      ".hb-yza img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated}" +
      ".hb-yzt{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}" +
      ".hb-yzn{overflow-wrap:anywhere;font-size:.84rem;line-height:1.3;color:var(--mute,#98a2b3)}" +
      ".hb-yzn b{font-weight:800;color:var(--ink,#eef1f6)}" +
      ".hb-yzd{font-size:.74rem;line-height:1.3;color:var(--mute,#98a2b3);font-variant-numeric:tabular-nums}";
    document.head.appendChild(st);
  }
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
            var y = n.profiller || {}, k = document.createElement("div"); k.className = "hb-yz";
            var tarih = new Date(n.yayin_tarihi).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
            if (y.habbo_ad && HESAP.OTELLER[y.otel]) {
              var av = document.createElement("span"); av.className = "hb-yza";
              var ai = document.createElement("img"); ai.alt = ""; ai.loading = "lazy";
              ai.onerror = function () { av.remove(); };
              ai.src = "https://www.habbo" + HESAP.OTELLER[y.otel] + "/habbo-imaging/avatarimage?user=" + encodeURIComponent(y.habbo_ad) + "&headonly=1&size=m&direction=2&head_direction=3&gesture=sml";
              av.appendChild(ai); k.appendChild(av);
            }
            var yt = document.createElement("div"); yt.className = "hb-yzt";
            if (y.habbo_ad) {
              var yn = document.createElement("span"); yn.className = "hb-yzn";
              var yb = document.createElement("b"); yb.textContent = y.habbo_ad;
              yn.appendChild(yb); yn.appendChild(document.createTextNode(" tarafından yazıldı")); yt.appendChild(yn);
            }
            var yd = document.createElement("span"); yd.className = "hb-yzd";
            yd.textContent = (y.habbo_ad && y.otel ? String(y.otel).toUpperCase() + " · " : "") + tarih;
            yt.appendChild(yd); k.appendChild(yt);
            ic.appendChild(k); a.appendChild(kap); a.appendChild(ic); kutu.appendChild(a);
          });
        })
        .catch(function () { kutu.textContent = "Haberler yüklenemedi. Sayfayı yenile ya da biraz sonra tekrar dene."; });
    }
  };
})();
