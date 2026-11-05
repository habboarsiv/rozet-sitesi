/* Habbo Arşiv - ana sayfadaki "Mobiler" bölümü.
   İlk açıldığında mobi listesini ve seçilen dilin ad/açıklama dosyasını yükler. */
(function () {
  var kuruldu = false, kok;
  var OTEL = { tr: ".com.tr", com: ".com", br: ".com.br", de: ".de", es: ".es", fi: ".fi", fr: ".fr", it: ".it", nl: ".nl" };
  var SAYFA = 72, YENI_GUN = 14;
  var surum = function () { return Math.floor(Date.now() / 36e5); };   // saatlik önbellek anahtarı
  var $ = function (id) { return kok.querySelector("#" + id); };

  function yukle(src, cb) {
    var s = document.createElement("script"); s.src = src; s.onload = s.onerror = cb; document.head.appendChild(s);
  }

  var ISKELET =
    '<div class="mb-top"><span id="mbDil"></span></div>' +
    '<p class="mb-alt" data-i18n="altYazi"></p>' +
    '<div class="mb-ara"><input id="mbq" type="search" data-i18n-ph="ara" autocomplete="off">' +
    '<select id="mbotel"></select><select id="mbtur"></select><select id="mbsira"></select>' +
    '<label class="mb-ch"><input type="checkbox" id="mbnadir"> <span data-i18n="nadir"></span></label></div>' +
    '<div class="mb-say" id="mbsay" data-i18n="yukleniyor"></div><div class="mb-grid" id="mbliste"></div>' +
    '<button class="more" id="mbdaha" type="button" hidden data-i18n="daha"></button><div id="mbmd" hidden></div>';

  window.MOBI_UI = {
    ac: function () {
      if (kuruldu) return; kuruldu = true;
      kok = document.getElementById("ms"); kok.innerHTML = ISKELET;
      DIL.uygula(kok); DIL.secici($("mbDil"));
      var dil = DIL.sec();
      var devam = function () {
        if (typeof MOBILER === "undefined") { $("mbsay").textContent = DIL.t("hazirDegil"); return; }
        yukle("mobi_dil/" + dil + ".js?v=" + surum(), function () { basla(dil); });
      };
      if (typeof MOBILER === "undefined") yukle("mobiler.js?v=" + surum(), devam); else devam();
    }
  };

  function basla(dil) {
    var t = DIL.t, ISO = DIL.iso(), sonuc = [], goster = SAYFA;
    var sec = function (el, liste) { liste.forEach(function (x) { el.add(new Option(x[1], x[0])); }); };
    sec($("mbotel"), [["", t("tumOtel")]].concat(Object.keys(OTEL).map(function (k) { return [k, OTEL[k]]; })));
    sec($("mbtur"), [["", t("zeminDuvar")], ["f", t("zemin")], ["w", t("duvar")]]);
    sec($("mbsira"), [["yeni", t("yeni")], ["eski", t("eski")], ["ad", t("az")]]);

    var lc = function (x) { return (x || "").toLocaleLowerCase(ISO); };
    var kayit = function (m) { return ((window.MOBI_DIL || {})[dil] || {})[m.c] || []; };
    var adi = function (m) { return kayit(m)[0] || m.n; };
    var aciklama = function (m) { return kayit(m)[1] || ""; };
    var yeniMi = function (m) { return m.t && (Date.now() - new Date(m.t).getTime()) / 864e5 <= YENI_GUN; };

    function ikonlar(m) {
      var p = m.c.split("*"), ad = p[1] ? [p[0] + "_icon_" + p[1], p[0] + "_icon"] : [p[0] + "_icon"], o = [];
      ["png", "gif"].forEach(function (u) { ad.forEach(function (a) { o.push("https://images.habbo.com/dcr/hof_furni/" + m.r + "/" + a + "." + u); }); });
      return o;
    }
    function resim(m) {
      var im = document.createElement("img"), L = ikonlar(m), i = 0;
      im.loading = "lazy"; im.alt = ""; im.src = L[0];
      im.onerror = function () {
        if (++i < L.length) im.src = L[i];
        else { var e = document.createElement("span"); e.className = "mb-yok"; e.textContent = t("gorselYok"); im.replaceWith(e); }
      };
      return im;
    }

    function sirala() {
      var q = lc($("mbq").value.trim()), o = $("mbotel").value, tp = $("mbtur").value, n = $("mbnadir").checked, so = $("mbsira").value;
      sonuc = MOBILER.filter(function (m) {
        return (!o || m.h.indexOf(o) >= 0) && (!tp || m.y === tp) && (!n || m.z) &&
          (!q || lc(adi(m)).indexOf(q) >= 0 || lc(m.n).indexOf(q) >= 0 || lc(m.c).indexOf(q) >= 0 || lc(aciklama(m)).indexOf(q) >= 0);
      });
      if (so === "eski") sonuc = sonuc.slice().reverse();
      else if (so === "ad") sonuc = sonuc.slice().sort(function (a, b) { return adi(a).localeCompare(adi(b), ISO); });
      goster = SAYFA; ciz(true);
    }

    function ciz(bastan) {
      var kutu = $("mbliste"); if (bastan) kutu.textContent = "";
      $("mbsay").textContent = sonuc.length.toLocaleString(ISO) + " " + t("sayi");
      sonuc.slice(kutu.children.length, goster).forEach(function (m) {
        var k = document.createElement("button"); k.className = "mb-k"; k.type = "button";
        var rs = document.createElement("div"); rs.className = "mb-rs"; rs.appendChild(resim(m));
        var ad = document.createElement("b"); ad.textContent = adi(m);
        var kod = document.createElement("small"); kod.textContent = m.c;
        k.appendChild(rs); k.appendChild(ad); k.appendChild(kod);
        if (yeniMi(m)) { var e = document.createElement("span"); e.className = "mb-et"; e.textContent = t("yeniEt"); k.appendChild(e); }
        if (m.z) { var z = document.createElement("span"); z.className = "mb-et z"; z.textContent = t("nadirEt"); k.appendChild(z); }
        k.onclick = function () { ac(m); }; kutu.appendChild(k);
      });
      $("mbdaha").hidden = goster >= sonuc.length;
    }

    function ac(m) {
      var md = $("mbmd"); md.textContent = "";
      var kap = document.createElement("div");
      var rs = document.createElement("div"); rs.className = "mb-rs"; rs.appendChild(resim(m));
      var h = document.createElement("h2"); h.textContent = adi(m); kap.appendChild(rs); kap.appendChild(h);
      if (aciklama(m)) { var p = document.createElement("p"); p.textContent = aciklama(m); kap.appendChild(p); }
      var dl = document.createElement("dl");
      var sat = function (a, b) {
        if (!b) return;
        var x = document.createElement("dt"), d = document.createElement("dd"); x.textContent = a; d.textContent = b; dl.appendChild(x); dl.appendChild(d);
      };
      sat(t("kod"), m.c); sat(t("tur"), m.y === "w" ? t("duvarMobi") : t("zeminMobi")); sat(t("kategori"), m.k); sat(t("seri"), m.l);
      sat(t("nadirDeger"), m.z ? t("evet") : "");
      sat(t("oteller"), m.h.map(function (x) { return OTEL[x]; }).join("  "));
      sat(t("tarih"), m.dt ? new Date(m.dt).toLocaleDateString(ISO, { day: "numeric", month: "long", year: "numeric" }) : "");
      kap.appendChild(dl); md.appendChild(kap); md.hidden = false;
    }

    $("mbmd").onclick = function (e) { if (e.target === $("mbmd")) $("mbmd").hidden = true; };
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") $("mbmd").hidden = true; });
    $("mbdaha").onclick = function () { goster += SAYFA; ciz(false); };
    var z; $("mbq").oninput = function () { clearTimeout(z); z = setTimeout(sirala, 200); };
    ["mbotel", "mbtur", "mbsira", "mbnadir"].forEach(function (id) { $(id).onchange = sirala; });
    sirala();
  }
})();
