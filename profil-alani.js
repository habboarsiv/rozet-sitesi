/* Habbo Arşiv - sağ üst kullanıcı profil alanı.
   Giriş yapılmışsa #hesapLink etiketinin yerine avatarlı, rol rozetli, otel bayraklı bir
   profil bileşeni ve açılır menü gösterir. Giriş yapılmamışsa hiçbir şeye dokunmaz.
   Giriş/çıkış mantığı hesap.js'te kalır; burada yalnızca HESAP.oku() ve HESAP.cikis() çağrılır.
   Tüm sınıflar "hp-" ile başlar, sayfanın başka hiçbir bileşenini etkilemez.
   Kaldırmak için index.html'deki <script src="profil-alani.js"> satırını silmen yeterli. */
(function () {
  "use strict";
  if (typeof HESAP === "undefined") return;
  var eski = document.getElementById("hesapLink"), h = HESAP.oku();
  if (!eski || !h || !h.ad || document.getElementById("hpRoot")) return;

  var OT = HESAP.OTELLER || {};
  var otel = String(h.otel || "").toLowerCase();
  var kod = otel.toUpperCase();
  var ROLLER = {
    uye: { ad: "Üye", ikon: "hp-i-uye" },
    yazar: { ad: "Yazar", ikon: "hp-i-yazar" },
    yonetici: { ad: "Yönetici", ikon: "hp-i-yonetici" }
  };
  var rol = ROLLER[h.rol] ? h.rol : "uye";
  var R = ROLLER[rol];
  var panel = rol === "yazar" || rol === "yonetici"; // hesap.html'deki yetki kuralıyla aynı

  /* ---------- bayraklar (30x20) ---------- */
  function abd() {
    var s = "", i, r, c;
    for (i = 0; i < 13; i++) s += '<rect y="' + (i * 20 / 13).toFixed(3) + '" width="30" height="' + (20 / 13 + 0.02).toFixed(3) + '" fill="' + (i % 2 ? "#fff" : "#b22234") + '"/>';
    s += '<rect width="12.5" height="10.77" fill="#3c3b6e"/>';
    for (r = 0; r < 4; r++) for (c = 0; c < 5; c++) s += '<circle cx="' + (1.4 + c * 2.25).toFixed(2) + '" cy="' + (1.3 + r * 2.2).toFixed(2) + '" r=".42" fill="#fff"/>';
    return s;
  }
  var BAYRAK = {
    tr: '<rect width="30" height="20" fill="#e30a17"/><circle cx="10.6" cy="10" r="5.2" fill="#fff"/><circle cx="12" cy="10" r="4.2" fill="#e30a17"/><polygon points="13.30,10.00 15.05,9.38 15.10,7.53 16.22,9.00 18.00,8.47 16.95,10.00 18.00,11.53 16.22,11.00 15.10,12.47 15.05,10.62" fill="#fff"/>',
    com: abd(),
    de: '<rect width="30" height="6.67" fill="#000"/><rect y="6.67" width="30" height="6.67" fill="#dd0000"/><rect y="13.33" width="30" height="6.67" fill="#ffce00"/>',
    fr: '<rect width="10" height="20" fill="#0055a4"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ef4135"/>',
    es: '<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/><rect x="7.4" y="7.8" width="3.2" height="4.4" rx=".7" fill="#ad1519"/>',
    br: '<rect width="30" height="20" fill="#009c3b"/><polygon points="15,2.2 27.2,10 15,17.8 2.8,10" fill="#ffdf00"/><circle cx="15" cy="10" r="4.6" fill="#002776"/><path d="M10.5 9.1Q15 7.6 19.5 10.9" stroke="#fff" stroke-width=".9" fill="none"/>',
    fi: '<rect width="30" height="20" fill="#fff"/><rect x="7.5" width="4.5" height="20" fill="#003580"/><rect y="7.75" width="30" height="4.5" fill="#003580"/>',
    it: '<rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ce2b37"/>',
    nl: '<rect width="30" height="6.67" fill="#ae1c28"/><rect y="6.67" width="30" height="6.67" fill="#fff"/><rect y="13.33" width="30" height="6.67" fill="#21468b"/>'
  };
  function bayrak() {
    if (!BAYRAK[otel]) return "";
    return '<svg class="hp-fl" viewBox="0 0 30 20" aria-hidden="true">' + BAYRAK[otel] + "</svg>";
  }

  /* ---------- ikon takımı: çift katmanlı, gradyan dolgulu, ince parlamalı ---------- */
  var SPRITE =
    '<svg class="hp-sprite" width="0" height="0" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">' +
    "<defs>" +
    '<linearGradient id="hpg-s1" gradientUnits="userSpaceOnUse" x1="4" y1="2" x2="20" y2="22"><stop offset="0" stop-color="#f6f8ff"/><stop offset="1" stop-color="#8793b3"/></linearGradient>' +
    '<linearGradient id="hpg-s2" gradientUnits="userSpaceOnUse" x1="4" y1="2" x2="20" y2="22"><stop offset="0" stop-color="#a9b4d2"/><stop offset="1" stop-color="#4b5575"/></linearGradient>' +
    '<linearGradient id="hpg-b1" gradientUnits="userSpaceOnUse" x1="4" y1="2" x2="20" y2="22"><stop offset="0" stop-color="#b5dcff"/><stop offset="1" stop-color="#3d72ff"/></linearGradient>' +
    '<linearGradient id="hpg-b2" gradientUnits="userSpaceOnUse" x1="4" y1="2" x2="20" y2="22"><stop offset="0" stop-color="#4f86ff"/><stop offset="1" stop-color="#1a3aa8"/></linearGradient>' +
    '<linearGradient id="hpg-m1" gradientUnits="userSpaceOnUse" x1="3" y1="3" x2="21" y2="21"><stop offset="0" stop-color="#a6ffe3"/><stop offset="1" stop-color="#14bd8c"/></linearGradient>' +
    '<linearGradient id="hpg-m2" gradientUnits="userSpaceOnUse" x1="3" y1="3" x2="21" y2="21"><stop offset="0" stop-color="#2fd9a4"/><stop offset="1" stop-color="#0a6b55"/></linearGradient>' +
    "</defs>" +
    /* Üye: gümüş, yumuşak yüzeyli siluet */
    '<symbol id="hp-i-uye" viewBox="0 0 24 24">' +
    '<circle cx="12" cy="8" r="4.2" fill="url(#hpg-s2)" fill-opacity=".5"/>' +
    '<path d="M4.2 20.4c.7-3.7 4-6 7.8-6s7.1 2.3 7.8 6z" fill="url(#hpg-s2)" fill-opacity=".5"/>' +
    '<circle cx="12" cy="8" r="4.2" fill="none" stroke="url(#hpg-s1)" stroke-width="1.7"/>' +
    '<path d="M4.2 20.4c.7-3.7 4-6 7.8-6s7.1 2.3 7.8 6" fill="none" stroke="url(#hpg-s1)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M9.6 6.7a2.7 2.7 0 0 1 2.2-1.4" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.2" stroke-linecap="round"/>' +
    "</symbol>" +
    /* Yönetici: elektrik mavisi kalkan, parlak onay */
    '<symbol id="hp-i-yonetici" viewBox="0 0 24 24">' +
    '<path d="M12 2.6l7.4 2.8v5.7c0 4.7-3.1 8.4-7.4 10.3-4.3-1.9-7.4-5.6-7.4-10.3V5.4z" fill="url(#hpg-b2)" fill-opacity=".55"/>' +
    '<path d="M12 2.6L4.6 5.4v5.7c0 4.7 3.1 8.4 7.4 10.3z" fill="#fff" fill-opacity=".1"/>' +
    '<path d="M12 2.6l7.4 2.8v5.7c0 4.7-3.1 8.4-7.4 10.3-4.3-1.9-7.4-5.6-7.4-10.3V5.4z" fill="none" stroke="url(#hpg-b1)" stroke-width="1.7" stroke-linejoin="round"/>' +
    '<path d="M8.6 12.1l2.5 2.5 4.5-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</symbol>" +
    /* Yazar: mint yeşili kalem, alt çizgili */
    '<symbol id="hp-i-yazar" viewBox="0 0 24 24">' +
    '<path d="M16.3 3.5a2.2 2.2 0 0 1 3.1 3.1L7.6 18.4a2 2 0 0 1-.9.5l-3 .9a.5.5 0 0 1-.6-.6l.9-3a2 2 0 0 1 .5-.9z" fill="url(#hpg-m2)" fill-opacity=".55"/>' +
    '<path d="M16.3 3.5a2.2 2.2 0 0 1 3.1 3.1L7.6 18.4a2 2 0 0 1-.9.5l-3 .9a.5.5 0 0 1-.6-.6l.9-3a2 2 0 0 1 .5-.9z" fill="none" stroke="url(#hpg-m1)" stroke-width="1.7" stroke-linejoin="round"/>' +
    '<path d="M14 5.9l3.1 3.1" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M12.8 21h8.2" fill="none" stroke="url(#hpg-m1)" stroke-width="1.7" stroke-linecap="round"/>' +
    "</symbol>" +
    /* Menü ikonları: aynı dil, currentColor + yarı saydam dolgu */
    '<symbol id="hp-d-hesap" viewBox="0 0 24 24">' +
    '<circle cx="12" cy="12" r="9.2" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-width="1.6"/>' +
    '<circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="M6.3 18.2c1.1-2.2 3.2-3.4 5.7-3.4s4.6 1.2 5.7 3.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    "</symbol>" +
    '<symbol id="hp-d-panel" viewBox="0 0 24 24">' +
    '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h10A1.5 1.5 0 0 1 17 5.5V19a1 1 0 0 0 1 1H6a2 2 0 0 1-2-2z" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M17 9h2.5a1.5 1.5 0 0 1 1.5 1.5V18a2 2 0 0 1-2 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M7.5 8h6M7.5 11.5h6M7.5 15h3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    "</symbol>" +
    '<symbol id="hp-d-cikis" viewBox="0 0 24 24">' +
    '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H10v16H6.5A2.5 2.5 0 0 1 4 17.5z" fill="currentColor" fill-opacity=".14"/>' +
    '<path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M14.5 8l4 4-4 4M18.5 12H9.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</symbol>" +
    "</svg>";

  function ik(id, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>';
  }
  var OK = '<svg class="hp-ar" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SIL = '<svg class="hp-fb" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="9" r="4" fill="currentColor"/><path d="M4 21c.8-4.2 4-6.4 8-6.4s7.2 2.2 8 6.4z" fill="currentColor" fill-opacity=".7"/></svg>';

  /* ---------- stil ---------- */
  var CSS =
    ".hp,.hp-menu{--hp-a:#5aa2ff;--hp-a2:#2f6bff;--hp-ab:rgba(77,140,255,.16);--hp-al:rgba(90,162,255,.4);font-family:Manrope,system-ui,-apple-system,'Segoe UI',sans-serif}" +
    ".hp[data-rol=uye],.hp-menu[data-rol=uye]{--hp-a:#d3dbef;--hp-a2:#8f9ab8;--hp-ab:rgba(205,213,234,.1);--hp-al:rgba(205,213,234,.32)}" +
    ".hp[data-rol=yazar],.hp-menu[data-rol=yazar]{--hp-a:#3ee6b0;--hp-a2:#14b88a;--hp-ab:rgba(62,230,176,.13);--hp-al:rgba(62,230,176,.36)}" +
    ".hesap-link[hidden]{display:none!important}" +
    ".hp{position:absolute;top:14px;right:20px;z-index:30;max-width:calc(100% - 40px)}" +
    ".hp-btn{appearance:none;-webkit-appearance:none;margin:0;font:inherit;color:#eef2ff;cursor:pointer;position:relative;display:flex;align-items:center;gap:11px;max-width:100%;padding:6px 10px 6px 6px;text-align:left;overflow:hidden;" +
    "border:1px solid rgba(116,152,255,.26);border-radius:18px;" +
    "background:radial-gradient(120% 170% at 0% 0%,rgba(77,124,255,.24),transparent 56%),linear-gradient(150deg,#111c3a,#0a1228 62%,#0b1430);" +
    "box-shadow:inset 0 1px 0 rgba(255,255,255,.09),inset 0 0 24px rgba(77,124,255,.07),0 12px 28px -14px rgba(0,0,0,.85);" +
    "transition:border-color .22s,box-shadow .22s}" +
    ".hp-btn::before{content:'';position:absolute;left:14px;right:14px;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(150,185,255,.75),transparent);pointer-events:none}" +
    ".hp-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 36%,rgba(255,255,255,.075) 50%,transparent 64%);transform:translateX(-125%);transition:transform .75s ease;pointer-events:none}" +
    ".hp-btn:hover,.hp-btn[aria-expanded=true]{border-color:var(--hp-al);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),inset 0 0 24px rgba(77,124,255,.1),0 0 0 3px var(--hp-ab),0 0 30px -6px var(--hp-al),0 12px 28px -14px rgba(0,0,0,.85)}" +
    ".hp-btn:hover::after{transform:translateX(125%)}" +
    ".hp-btn:focus-visible{outline:2px solid var(--hp-a);outline-offset:3px}" +
    ".hp-av{position:relative;flex:none;width:42px;height:42px;padding:2px;border-radius:14px;background:linear-gradient(145deg,var(--hp-a),var(--hp-a2) 62%,rgba(255,255,255,.18));box-shadow:0 0 14px -3px var(--hp-al)}" +
    ".hp-avi{position:relative;display:grid;place-items:center;width:100%;height:100%;border-radius:12px;overflow:hidden;background:radial-gradient(circle at 50% 28%,rgba(90,140,255,.38),transparent 72%),#0a1126}" +
    ".hp-avi img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:pixelated}" +
    ".hp-fb{width:24px;height:24px;color:var(--hp-a);opacity:.75}" +
    ".hp-on{position:absolute;right:-3px;bottom:-3px;width:13px;height:13px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#86ffb6,#16c765 60%,#0a9a4c);border:2.5px solid #0a1228;box-shadow:0 0 8px rgba(34,214,120,.75)}" +
    ".hp-on::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:1.5px solid rgba(34,214,120,.6);animation:hp-p 2.6s ease-out infinite}" +
    "@keyframes hp-p{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.55);opacity:0}}" +
    ".hp-tx{display:flex;flex-direction:column;gap:5px;min-width:0}" +
    ".hp-nm{display:block;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:800 .98rem/1.1 'Bricolage Grotesque',Manrope,system-ui,sans-serif;letter-spacing:-.015em;color:#f4f7ff}" +
    ".hp-mt{display:flex;align-items:center;gap:6px}" +
    ".hp-rl{display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 8px 0 4px;border-radius:99px;background:var(--hp-ab);border:1px solid var(--hp-al);color:var(--hp-a);font:700 .68rem/1 Manrope,system-ui,sans-serif;letter-spacing:.01em;white-space:nowrap}" +
    ".hp-rl svg{width:15px;height:15px;flex:none;filter:drop-shadow(0 0 3px var(--hp-al))}" +
    ".hp-ht{display:inline-flex;align-items:center;gap:5px;height:20px;padding:0 8px 0 5px;border-radius:99px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#c5cfee;font:700 .66rem/1 ui-monospace,'SFMono-Regular',Consolas,monospace;letter-spacing:.06em;white-space:nowrap}" +
    ".hp-fl{display:block;flex:none;width:16px;height:11px;border-radius:2px;box-shadow:0 0 0 1px rgba(255,255,255,.22)}" +
    ".hp-ch{flex:none;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:var(--hp-a);transition:background .2s,border-color .2s}" +
    ".hp-ch svg{width:14px;height:14px;transition:transform .3s cubic-bezier(.3,.9,.3,1)}" +
    ".hp-btn:hover .hp-ch,.hp-btn[aria-expanded=true] .hp-ch{background:var(--hp-ab);border-color:var(--hp-al)}" +
    ".hp-btn[aria-expanded=true] .hp-ch svg{transform:rotate(180deg)}" +
    /* açılır menü: gövdeye eklenir, üst alanın taşma kırpmasından etkilenmez */
    ".hp-menu{position:absolute;top:0;left:0;z-index:1000;width:264px;max-width:calc(100vw - 16px);padding:8px;border-radius:20px;border:1px solid rgba(116,152,255,.28);" +
    "background:radial-gradient(130% 90% at 100% 0%,var(--hp-ab),transparent 60%),linear-gradient(160deg,#111c3a,#0a1228 70%);" +
    "box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 26px 54px -14px rgba(0,0,0,.92),0 0 40px -16px var(--hp-al);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);" +
    "opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-8px) scale(.97);transform-origin:100% 0;" +
    "transition:opacity .18s ease,transform .22s cubic-bezier(.2,.9,.3,1),visibility 0s linear .22s}" +
    ".hp-menu.hp-ac{opacity:1;visibility:visible;pointer-events:auto;transform:none;transition:opacity .2s ease,transform .26s cubic-bezier(.2,.9,.3,1),visibility 0s}" +
    ".hp-mh{display:flex;align-items:center;gap:12px;padding:8px 8px 12px}" +
    ".hp-mi{flex:none;display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:linear-gradient(150deg,var(--hp-ab),rgba(255,255,255,.03));border:1px solid var(--hp-al);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 0 18px -6px var(--hp-al)}" +
    ".hp-mi svg{width:25px;height:25px;filter:drop-shadow(0 0 4px var(--hp-al))}" +
    ".hp-mn{min-width:0}" +
    ".hp-mn b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:800 1.02rem/1.15 'Bricolage Grotesque',Manrope,system-ui,sans-serif;letter-spacing:-.015em;color:#f4f7ff}" +
    ".hp-mn span{display:flex;align-items:center;gap:6px;margin-top:4px;color:var(--hp-a);font:700 .74rem/1.2 Manrope,system-ui,sans-serif}" +
    ".hp-mn em{font:600 .7rem/1.2 ui-monospace,'SFMono-Regular',Consolas,monospace;font-style:normal;color:#8ea2d6;letter-spacing:.02em}" +
    ".hp-sep{height:1px;margin:2px 6px 6px;background:linear-gradient(90deg,transparent,rgba(130,165,255,.3),transparent)}" +
    ".hp-it{appearance:none;-webkit-appearance:none;margin:0;width:100%;display:flex;align-items:center;gap:12px;padding:7px 12px 7px 7px;border:0;border-radius:13px;background:transparent;color:#dbe4ff;font:600 .93rem/1.2 Manrope,system-ui,sans-serif;text-decoration:none;text-align:left;cursor:pointer;transition:background .16s,color .16s}" +
    ".hp-it i{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#9fb6ff;transition:background .16s,border-color .16s,color .16s,box-shadow .16s}" +
    ".hp-it i svg{width:19px;height:19px}" +
    ".hp-it .hp-ar{width:15px;height:15px;margin-left:auto;opacity:0;transform:translateX(-5px);transition:opacity .16s,transform .2s}" +
    ".hp-it:hover,.hp-it:focus-visible{background:rgba(77,124,255,.15);color:#fff;outline:0}" +
    ".hp-it:hover i,.hp-it:focus-visible i{background:rgba(77,124,255,.26);border-color:rgba(130,165,255,.5);color:#fff;box-shadow:0 0 14px -4px rgba(77,124,255,.85)}" +
    ".hp-it:hover .hp-ar,.hp-it:focus-visible .hp-ar{opacity:.75;transform:none}" +
    ".hp-it.hp-ex{color:#ffb8bf}" +
    ".hp-it.hp-ex i{color:#ff8d97;background:rgba(255,90,105,.08);border-color:rgba(255,90,105,.22)}" +
    ".hp-it.hp-ex:hover,.hp-it.hp-ex:focus-visible{background:rgba(255,90,105,.14);color:#ffd6d9}" +
    ".hp-it.hp-ex:hover i,.hp-it.hp-ex:focus-visible i{background:rgba(255,90,105,.22);border-color:rgba(255,120,130,.55);color:#fff;box-shadow:0 0 14px -4px rgba(255,90,105,.85)}" +
    "@media (max-width:560px){.hp{top:12px;right:14px;max-width:calc(100% - 28px)}.hp-btn{gap:9px;padding:5px 8px 5px 5px;border-radius:16px}.hp-av{width:38px;height:38px;border-radius:12px}.hp-avi{border-radius:10px}.hp-nm{max-width:104px;font-size:.92rem}.hp-ch{width:24px;height:24px}}" +
    "@media (prefers-reduced-motion:reduce){.hp-btn,.hp-btn::after,.hp-ch,.hp-ch svg,.hp-menu,.hp-menu.hp-ac,.hp-it,.hp-it i,.hp-it .hp-ar{transition:none!important}.hp-on::after{animation:none!important;opacity:0}}";

  var st = document.createElement("style");
  st.id = "hp-style";
  st.textContent = CSS;
  document.head.appendChild(st);

  /* ---------- bileşen ---------- */
  var root = document.createElement("div");
  root.className = "hp";
  root.id = "hpRoot";
  root.setAttribute("data-rol", rol);
  root.innerHTML =
    SPRITE +
    '<button class="hp-btn" id="hpBtn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="hpMenu">' +
    '<span class="hp-av"><span class="hp-avi">' + SIL + '</span><span class="hp-on" title="Çevrimiçi" aria-hidden="true"></span></span>' +
    '<span class="hp-tx"><span class="hp-nm"></span>' +
    '<span class="hp-mt"><span class="hp-rl">' + ik(R.ikon, "") + R.ad + "</span>" +
    '<span class="hp-ht">' + bayrak() + kod + "</span></span></span>" +
    '<span class="hp-ch">' + CHEV + "</span>" +
    "</button>";
  root.querySelector(".hp-nm").textContent = h.ad;

  var btn = root.querySelector(".hp-btn");
  btn.setAttribute("aria-label", "Hesap menüsü: " + h.ad + ", " + R.ad + (kod ? ", " + kod : ""));

  /* gerçek Habbo avatarı (yalnızca kafa); yüklenemezse siluet kalır */
  if (OT[otel]) {
    var im = new Image();
    im.alt = "";
    im.decoding = "async";
    im.onload = function () { var s = root.querySelector(".hp-fb"); if (s) s.style.display = "none"; };
    im.onerror = function () { im.remove(); };
    im.src = "https://www.habbo" + OT[otel] + "/habbo-imaging/avatarimage?user=" + encodeURIComponent(h.ad) + "&headonly=1&size=l&direction=2&head_direction=3&gesture=sml&img_format=png";
    root.querySelector(".hp-avi").appendChild(im);
  }

  /* açılır menü */
  var menu = document.createElement("div");
  menu.className = "hp-menu";
  menu.id = "hpMenu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Hesap");
  menu.setAttribute("data-rol", rol);
  menu.innerHTML =
    '<div class="hp-mh"><span class="hp-mi">' + ik(R.ikon, "") + '</span><div class="hp-mn"><b></b><span>' + R.ad +
    (OT[otel] ? " <em>habbo" + OT[otel] + "</em>" : "") + "</span></div></div>" +
    '<div class="hp-sep"></div>' +
    '<a class="hp-it" role="menuitem" href="hesap"><i>' + ik("hp-d-hesap", "") + "</i>Hesabım" + OK + "</a>" +
    (panel ? '<a class="hp-it" role="menuitem" href="haber-yaz"><i>' + ik("hp-d-panel", "") + "</i>Haber Paneli" + OK + "</a>" : "") +
    '<div class="hp-sep"></div>' +
    '<button class="hp-it hp-ex" role="menuitem" type="button" id="hpCik"><i>' + ik("hp-d-cikis", "") + "</i>Çıkış Yap</button>";
  menu.querySelector(".hp-mn b").textContent = h.ad;

  /* eski etiket yerinde kalır ama gizlenir (başka kod ona başvuruyorsa bozulmasın) */
  eski.parentNode.insertBefore(root, eski);
  eski.hidden = true;
  eski.setAttribute("aria-hidden", "true");
  document.body.appendChild(menu);

  /* ---------- davranış ---------- */
  var acik = false;
  function ogeler() { return Array.prototype.slice.call(menu.querySelectorAll("[role=menuitem]")); }
  function yerles() {
    var r = btn.getBoundingClientRect(), sx = window.pageXOffset, sy = window.pageYOffset;
    var w = menu.offsetWidth, sag = r.right + sx;
    menu.style.top = (r.bottom + sy + 10) + "px";
    menu.style.left = Math.max(8 + sx, sag - w) + "px";
  }
  function ac(odakla) {
    acik = true;
    yerles();
    menu.classList.add("hp-ac");
    btn.setAttribute("aria-expanded", "true");
    if (odakla) { var o = ogeler()[0]; if (o) o.focus({ preventScroll: true }); }
  }
  function kapat(geri) {
    if (!acik) return;
    acik = false;
    menu.classList.remove("hp-ac");
    btn.setAttribute("aria-expanded", "false");
    if (geri) btn.focus({ preventScroll: true });
  }

  btn.addEventListener("click", function (e) { if (acik) kapat(false); else ac(e.detail === 0); });
  btn.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); if (!acik) ac(true); else { var o = ogeler()[0]; if (o) o.focus(); } }
    else if (e.key === "Escape") kapat(true);
  });
  menu.addEventListener("keydown", function (e) {
    var l = ogeler(), i = l.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); kapat(true); }
    else if (e.key === "ArrowDown") { e.preventDefault(); l[(i + 1) % l.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); l[(i - 1 + l.length) % l.length].focus(); }
    else if (e.key === "Home") { e.preventDefault(); l[0].focus(); }
    else if (e.key === "End") { e.preventDefault(); l[l.length - 1].focus(); }
    else if (e.key === "Tab") kapat(false);
  });
  document.addEventListener("pointerdown", function (e) {
    if (acik && !root.contains(e.target) && !menu.contains(e.target)) kapat(false);
  });
  window.addEventListener("resize", function () { if (acik) yerles(); });

  /* çıkış: hesap.html'deki ile aynı işlem */
  menu.querySelector("#hpCik").addEventListener("click", function () {
    HESAP.cikis();
    location.reload();
  });
})();
