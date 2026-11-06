/* Habbo Arşiv - üst alandaki sayaç şeridi (rozet, promo sayısı ve son güncelleme) */
(function () {
  var k = document.getElementById("led");
  if (!k || typeof BADGES === "undefined") return;
  var f = function (n) { return n.toLocaleString("tr-TR"); };
  var tarih = (typeof BUILD !== "undefined" && BUILD.tarih) ? new Date(BUILD.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) : "";
  [[f(BADGES.length), "rozet"], [typeof PROMOS !== "undefined" ? f(PROMOS.length) : "", "promo"], [tarih, "son güncelleme"]].forEach(function (x) {
    if (!x[0]) return;
    var c = document.createElement("div"); c.className = "led-c";
    var b = document.createElement("b"); b.textContent = x[0];
    var s = document.createElement("span"); s.textContent = x[1];
    c.appendChild(b); c.appendChild(s); k.appendChild(c);
  });
})();
