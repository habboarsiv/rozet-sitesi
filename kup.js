/* Habbo Arşiv - ana sayfa 3D küpü
   Tek dosya: stil, küp ve etkileşim burada. Kaldırmak için index.html'deki kup.js satırını sil.
   - Gerçek 3B, altı yüzlü; fareyle/parmakla her yöne döndürülür
   - Bırakınca atalet ile döner, sonra yavaş sürekli dönüşe geçer
   - Havada süzülür; imleç yaklaşınca ışık yüzeyde imleci takip eder
   - "Hareketi azalt" ayarı açıksa süzülme ve kendiliğinden dönüş kapanır */
(function () {
  var hero = document.querySelector(".hero-in");
  if (!hero || document.getElementById("kupSahne")) return;

  /* ---------- stil ---------- */
  var css = [
    ".kup-sahne{--s:136px;--k:1.8;position:relative;width:calc(var(--s)*var(--k));height:calc(var(--s)*var(--k));z-index:2;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;outline:0;border-radius:24px}",
    ".kup-sahne.tut{cursor:grabbing}",
    ".kup-sahne:focus-visible{box-shadow:0 0 0 2px rgba(90,167,255,.6)}",
    ".kup-hale{position:absolute;inset:-6%;pointer-events:none;background:radial-gradient(closest-side,rgba(61,139,255,calc(.17 + var(--hv,0)*.2)),rgba(61,139,255,calc(.05 + var(--hv,0)*.05)) 60%,transparent)}",
    ".kup-gol{position:absolute;left:50%;bottom:calc(var(--s)*var(--k)*.14 - var(--s)*.085);width:calc(var(--s)*1.1);height:calc(var(--s)*.17);margin-left:calc(var(--s)*-.55);pointer-events:none;background:radial-gradient(closest-side,rgba(50,115,255,.42),rgba(4,9,28,.38) 55%,transparent);filter:blur(7px);animation:kupGol 6.4s ease-in-out infinite}",
    ".kup-orb{position:absolute;left:50%;top:calc(var(--s)*var(--k)*.86);width:calc(var(--s)*1.7);height:calc(var(--s)*1.7);margin:calc(var(--s)*-.85) 0 0 calc(var(--s)*-.85);border-radius:50%;pointer-events:none;border:1px solid rgba(90,165,255,.32);background:radial-gradient(closest-side,rgba(60,130,255,.15),transparent 72%);box-shadow:0 0 30px rgba(60,130,255,.14),inset 0 0 26px rgba(60,130,255,.14);transform:rotateX(74deg)}",
    ".kup-orb::before{content:'';position:absolute;inset:13%;border-radius:50%;border:1px dashed rgba(120,180,255,.32);animation:kupOrb 40s linear infinite}",
    ".kup-orb::after{content:'';position:absolute;inset:31%;border-radius:50%;border:1px solid rgba(120,180,255,.2)}",
    "@keyframes kupOrb{to{transform:rotate(360deg)}}",
    ".kup-yuz{position:absolute;inset:0;display:grid;place-items:center;perspective:calc(var(--s)*5.2);animation:kupYuz 6.4s ease-in-out infinite}",
    "@keyframes kupYuz{0%,100%{transform:translateY(calc(var(--s)*.04))}50%{transform:translateY(calc(var(--s)*-.05))}}",
    "@keyframes kupGol{0%,100%{transform:scale(1);opacity:.95}50%{transform:scale(.8);opacity:.5}}",
    ".kup{position:relative;width:var(--s);height:var(--s);transform-style:preserve-3d;will-change:transform}",
    ".kup-f{position:absolute;inset:0;overflow:hidden;-webkit-backface-visibility:hidden;backface-visibility:hidden;color:#6fb0ff;" +
      "background:repeating-linear-gradient(90deg,rgba(255,255,255,.024) 0 1px,transparent 1px 3px)," +
      "linear-gradient(115deg,transparent 24%,rgba(150,195,255,.14) 44%,rgba(120,170,255,.05) 52%,transparent 64%)," +
      "linear-gradient(145deg,#233f86 0%,#142757 46%,#0b1738 100%)}",
    ".kup-f svg{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:.55;stroke-linecap:round;stroke-linejoin:round;opacity:.42}",
    ".kup-sh{position:absolute;inset:0;pointer-events:none;background:#020615;opacity:var(--sh,.4)}",
    ".kup-gl{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at var(--hx,50%) var(--hy,50%),rgba(190,220,255,calc(var(--g,0)*.5)) 0,rgba(110,170,255,calc(var(--g,0)*.2)) 26%,transparent 60%)}",
    ".kup-ed{position:absolute;inset:0;pointer-events:none;border:1px solid rgba(98,166,255,.82);opacity:calc(.8 + var(--hv,0)*.2);" +
      "box-shadow:inset 0 0 0 1px rgba(8,26,84,.7),inset 0 0 calc(16px + var(--hv,0)*12px) rgba(55,125,255,calc(.22 + var(--hv,0)*.2));" +
      "background:radial-gradient(circle at 0 0,rgba(200,226,255,.95) 0 1px,transparent 7px),radial-gradient(circle at 100% 0,rgba(200,226,255,.95) 0 1px,transparent 7px),radial-gradient(circle at 0 100%,rgba(200,226,255,.95) 0 1px,transparent 7px),radial-gradient(circle at 100% 100%,rgba(200,226,255,.95) 0 1px,transparent 7px)}",
    ".kup-ed::before{content:'';position:absolute;inset:9%;border:1px solid rgba(110,165,255,.15)}",
    ".kup-f[data-f=f]{transform:translateZ(calc(var(--s)/2))}",
    ".kup-f[data-f=b]{transform:rotateY(180deg) translateZ(calc(var(--s)/2))}",
    ".kup-f[data-f=r]{transform:rotateY(90deg) translateZ(calc(var(--s)/2))}",
    ".kup-f[data-f=l]{transform:rotateY(-90deg) translateZ(calc(var(--s)/2))}",
    ".kup-f[data-f=t]{transform:rotateX(90deg) translateZ(calc(var(--s)/2))}",
    ".kup-f[data-f=d]{transform:rotateX(-90deg) translateZ(calc(var(--s)/2))}",
    "@media (prefers-color-scheme:light){.kup-orb{border-color:rgba(40,90,220,.38)}.kup-orb::before{border-color:rgba(40,90,220,.34)}.kup-orb::after{border-color:rgba(40,90,220,.24)}.kup-gol{background:radial-gradient(closest-side,rgba(30,70,170,.34),rgba(10,20,60,.2) 55%,transparent)}.kup-hale{background:radial-gradient(closest-side,rgba(61,120,255,calc(.13 + var(--hv,0)*.15)),transparent)}}",
    "@media (max-width:1000px){.kup-sahne{--s:116px;right:12px}}",
    "@media (max-width:700px){.kup-sahne{--s:82px;--k:1.5}}",
    "@media (prefers-reduced-motion:reduce){.kup-yuz,.kup-gol,.kup-orb::before{animation:none}}"
  ].join("\n");
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- yüz süsleri: ince çizgisel geometri ---------- */
  var SVG = {
    f: '<rect x="14" y="14" width="72" height="72"/><rect x="26" y="26" width="48" height="48"/><path d="M50 36 64 50 50 64 36 50Z"/><path d="M50 14v12M50 74v12M14 50h12M74 50h12"/>',
    r: '<rect x="14" y="14" width="72" height="72"/><path d="M14 86 86 14M14 66 66 14M14 46 46 14M34 86 86 34M54 86 86 54"/>',
    b: '<circle cx="50" cy="50" r="36"/><circle cx="50" cy="50" r="23"/><circle cx="50" cy="50" r="3.5"/><path d="M50 8v15M50 77v15M8 50h15M77 50h15"/>',
    l: '<path d="M14 32V14h18M68 14h18v18M86 68v18H68M32 86H14V68"/><path d="M38 50h24M50 38v24"/><rect x="30" y="30" width="40" height="40"/>',
    t: '<path d="M50 11 84 30.5v39L50 89 16 69.5v-39Z"/><path d="M50 11v78M16 30.5l68 39M84 30.5l-68 39"/>',
    d: '<path d="M14 14h72v72H14Z"/><path d="M38 14v72M62 14v72M14 38h72M14 62h72"/>'
  };

  /* ---------- DOM ---------- */
  var sahne = document.createElement("div");
  sahne.id = "kupSahne";
  sahne.className = "kup-sahne";
  sahne.tabIndex = 0;
  sahne.setAttribute("role", "img");
  sahne.setAttribute("aria-label", "Habbo Arşiv küpü. Sürükleyerek veya ok tuşlarıyla döndürebilirsin.");
  var yuzler = ["f", "r", "b", "l", "t", "d"].map(function (k) {
    return '<div class="kup-f" data-f="' + k + '"><svg viewBox="0 0 100 100" aria-hidden="true">' + SVG[k] + '</svg><div class="kup-sh"></div><div class="kup-gl"></div><div class="kup-ed"></div></div>';
  }).join("");
  sahne.innerHTML = '<div class="kup-hale"></div><div class="kup-orb"></div><div class="kup-gol"></div><div class="kup-yuz"><div class="kup">' + yuzler + '</div></div>';
  (document.getElementById("heroKup") || hero).appendChild(sahne);

  var kup = sahne.querySelector(".kup");
  /* Yüzlerin normali (n) ve yüzey eksenleri (u: sağ, v: aşağı), küp koordinatında */
  var YUZ = [
    { k: "f", n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
    { k: "b", n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
    { k: "r", n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
    { k: "l", n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
    { k: "t", n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    { k: "d", n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] }
  ];
  YUZ.forEach(function (y) { y.el = sahne.querySelector('.kup-f[data-f="' + y.k + '"]'); });

  /* ---------- küçük matris yardımcıları (3x3, CSS ile aynı eksenler: x sağ, y aşağı, z izleyiciye) ---------- */
  function mul(A, B) {
    var C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], i, j, k;
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) for (k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j];
    return C;
  }
  function rotX(a) { var c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0], [0, c, -s], [0, s, c]]; }
  function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; }
  function uy(M, v) { return [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function norm(v) { var l = Math.sqrt(dot(v, v)) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function temizle(M) { /* sürüklenmeyi önlemek için ortonormal tut */
    var c0 = norm([M[0][0], M[1][0], M[2][0]]);
    var c1 = norm([M[0][1], M[1][1], M[2][1]]);
    var c2 = norm(cross(c0, c1));
    c1 = norm(cross(c2, c0));
    return [[c0[0], c1[0], c2[0]], [c0[1], c1[1], c2[1]], [c0[2], c1[2], c2[2]]];
  }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }

  /* ---------- durum ---------- */
  var azalt = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var BOSTA_Y = azalt ? 0 : 0.26, BOSTA_X = azalt ? 0 : 0.085;   /* rad/sn: yavaş sürekli dönüş */
  var SONUM = azalt ? 4.5 : 1.35;                                /* bırakınca ataletin sönme hızı */
  var K = 0.0095;                                                /* rad / piksel */
  var R = temizle(mul(rotX(-0.62), rotY(0.78)));                 /* güzel bir başlangıç açısı */
  var wx = BOSTA_X, wy = BOSTA_Y;
  var tutuyor = false, sonX = 0, sonY = 0, sonT = 0, sonHareket = 0, pid = null;
  var px = null, py = null, hv = 0, hvHedef = 0;
  var L0 = norm([-0.45, -0.7, 0.6]), L = L0;
  var gorunur = true, calisiyor = false, onceki = 0, boy = 136;

  function boyutOlc() { boy = kup.offsetWidth || 136; }
  boyutOlc();
  window.addEventListener("resize", boyutOlc);

  /* ---------- sürükleme ---------- */
  sahne.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    tutuyor = true; pid = e.pointerId;
    sonX = e.clientX; sonY = e.clientY; sonT = performance.now(); sonHareket = sonT;
    px = e.clientX; py = e.clientY; hvHedef = 1;
    sahne.classList.add("tut");
    try { sahne.setPointerCapture(pid); } catch (_) {}
    basla();
    e.preventDefault();
  });
  sahne.addEventListener("pointermove", function (e) {
    if (!tutuyor || e.pointerId !== pid) return;
    var t = performance.now(), dt = Math.max(0.008, (t - sonT) / 1000);
    var dx = e.clientX - sonX, dy = e.clientY - sonY;
    if (dx || dy) {
      R = temizle(mul(mul(rotX(-dy * K), rotY(dx * K)), R));
      wy = clamp(wy * 0.55 + (dx * K / dt) * 0.45, -9, 9);
      wx = clamp(wx * 0.55 + (-dy * K / dt) * 0.45, -9, 9);
      sonHareket = t;
    }
    sonX = e.clientX; sonY = e.clientY; sonT = t; px = e.clientX; py = e.clientY;
  });
  function birak(e) {
    if (!tutuyor || (e && e.pointerId !== pid)) return;
    tutuyor = false; sahne.classList.remove("tut");
    try { sahne.releasePointerCapture(pid); } catch (_) {}
    if (performance.now() - sonHareket > 90) { wx = BOSTA_X; wy = BOSTA_Y; }   /* durup bıraktıysa fırlatma yok */
    if (e && e.pointerType !== "mouse") { px = py = null; hvHedef = 0; }
  }
  sahne.addEventListener("pointerup", birak);
  sahne.addEventListener("pointercancel", birak);
  sahne.addEventListener("dragstart", function (e) { e.preventDefault(); });

  /* klavye: ok tuşları küpü iter */
  sahne.addEventListener("keydown", function (e) {
    var h = { ArrowLeft: [0, -2.4], ArrowRight: [0, 2.4], ArrowUp: [2.4, 0], ArrowDown: [-2.4, 0] }[e.key];
    if (!h) return;
    wx += h[0]; wy += h[1]; hvHedef = 1; basla(); e.preventDefault();
  });

  /* ---------- imleç ışığı ---------- */
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" && !tutuyor) return;
    px = e.clientX; py = e.clientY;
    var r = sahne.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var d = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
    hvHedef = tutuyor ? 1 : clamp(1 - d / (boy * 1.35), 0, 1);
    if (hvHedef > 0.01) basla();
  }, { passive: true });
  function imlecCikti() { if (!tutuyor) { px = py = null; hvHedef = 0; } }
  document.addEventListener("mouseleave", imlecCikti);
  window.addEventListener("blur", imlecCikti);

  /* ---------- çizim döngüsü ---------- */
  function ciz(dt) {
    /* dönüş: yavaş sürekli dönüşe doğru sönümlenen açısal hız */
    if (!tutuyor) {
      var f = Math.exp(-dt * SONUM);
      wx = BOSTA_X + (wx - BOSTA_X) * f;
      wy = BOSTA_Y + (wy - BOSTA_Y) * f;
      if (wx || wy) R = temizle(mul(mul(rotX(wx * dt), rotY(wy * dt)), R));
    }
    kup.style.transform = "matrix3d(" + [R[0][0], R[1][0], R[2][0], 0, R[0][1], R[1][1], R[2][1], 0, R[0][2], R[1][2], R[2][2], 0, 0, 0, 0, 1].map(function (x) { return x.toFixed(5); }).join(",") + ")";

    /* ışık: normalde sol-üst-ön; imleç yaklaşınca imlecin yönüne kayar */
    hv += (hvHedef - hv) * (1 - Math.exp(-dt * 7));
    sahne.style.setProperty("--hv", hv.toFixed(3));
    var r = sahne.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var ox = px == null ? 0 : px - cx, oy = py == null ? 0 : py - cy;
    var Lp = norm([ox / boy, oy / boy, 0.85]);
    var m = hv * 0.85;
    L = norm([L0[0] + (Lp[0] - L0[0]) * m, L0[1] + (Lp[1] - L0[1]) * m, L0[2] + (Lp[2] - L0[2]) * m]);

    for (var i = 0; i < YUZ.length; i++) {
      var y = YUZ[i], n = uy(R, y.n);
      if (n[2] < -0.08) continue;                                 /* arka yüzler görünmüyor */
      var lit = Math.max(0, dot(n, L));
      y.el.style.setProperty("--sh", (0.5 * (1 - Math.pow(lit, 0.8))).toFixed(3));
      var g = 0, hx = 50, hy = 50;
      if (hv > 0.02 && px != null && n[2] > 0.12) {
        var U = uy(R, y.u), V = uy(R, y.v);
        var det = U[0] * V[1] - V[0] * U[1];
        if (Math.abs(det) > 0.14) {
          var qx = ox - (boy / 2) * n[0], qy = oy - (boy / 2) * n[1];
          var u = (qx * V[1] - V[0] * qy) / det, v = (U[0] * qy - qx * U[1]) / det;
          hx = 50 + (u / boy) * 100; hy = 50 + (v / boy) * 100;
          g = hv * clamp(n[2] * 1.3, 0, 1) * clamp(Math.abs(det) * 1.4, 0, 1);
        }
      }
      y.el.style.setProperty("--g", g.toFixed(3));
      y.el.style.setProperty("--hx", hx.toFixed(1) + "%");
      y.el.style.setProperty("--hy", hy.toFixed(1) + "%");
    }
  }
  function dongu(t) {
    if (!gorunur || document.hidden) { calisiyor = false; return; }
    var dt = onceki ? Math.min(0.05, (t - onceki) / 1000) : 0.016;
    onceki = t;
    ciz(dt);
    /* hareketsizse (azaltılmış hareket, atalet bitti, ışık yok) döngüyü uyut */
    if (azalt && !tutuyor && Math.abs(wx) < 0.002 && Math.abs(wy) < 0.002 && Math.abs(hv - hvHedef) < 0.002) { calisiyor = false; return; }
    requestAnimationFrame(dongu);
  }
  function basla() {
    if (calisiyor || !gorunur) return;
    calisiyor = true; onceki = 0; requestAnimationFrame(dongu);
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { gorunur = es[0].isIntersecting; if (gorunur) basla(); }, { threshold: 0 }).observe(sahne);
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) basla(); });
  ciz(0.016);
  basla();
})();
