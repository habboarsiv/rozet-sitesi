/* Habbo Arşiv - alt bölümdeki bölüm bağlantıları + üst alandaki bölüm kısayolları */
(function () {
  document.querySelectorAll("[data-git]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var b = document.getElementById("m" + a.getAttribute("data-git"));
      if (!b) return;
      e.preventDefault(); b.click();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
})();
/* Üst alandaki kısayollar: bölümü açar ve sekme çubuğuna kaydırır */
(function () {
  var azalt = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-hgit]").forEach(function (a) {
    a.addEventListener("click", function () {
      var b = document.getElementById("m" + a.getAttribute("data-hgit"));
      if (!b) return;
      b.click();
      var m = document.querySelector(".modes");
      if (m) m.scrollIntoView({ behavior: azalt ? "auto" : "smooth", block: "start" });
    });
  });
})();
