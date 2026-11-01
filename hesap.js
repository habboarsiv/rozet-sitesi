/* Habbo Arşiv - hesap sistemi (Supabase).
   Buradaki anahtar "publishable" anahtardır, herkese açık olması sorun değil.
   Gizli (secret / service_role) anahtarı ASLA bu dosyaya koyma. */
const HESAP = (() => {
  const URL = "https://rpjtukycyfkxfksynmlj.supabase.co";
  const KEY = "sb_publishable_8ZxMyahabKsa-WrQzGmJhQ_uQ8daT6g";
  const OTELLER = { tr: ".com.tr", com: ".com", br: ".com.br", de: ".de", es: ".es", fi: ".fi", fr: ".fr", it: ".it", nl: ".nl" };

  // Doğrulama programıyla aynı kural: otel + nick'in hex hali (kimseye e-posta gitmez)
  const eposta = (otel, nick) => otel + "-" +
    [...new TextEncoder().encode(nick.toLowerCase())].map(b => b.toString(16).padStart(2, "0")).join("") + "@habboarsiv.com";

  const oku = () => { try { return JSON.parse(localStorage.getItem("hesap")); } catch { return null; } };

  async function istek(yol, govde) {
    const r = await fetch(URL + yol, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: KEY },
      body: JSON.stringify(govde),
    });
    return { ok: r.ok, v: await r.json().catch(() => ({})) };
  }

  const fn = (govde) => istek("/functions/v1/habbo-auth", govde);

  async function giris(otel, nick, sifre) {
    const { ok, v } = await istek("/auth/v1/token?grant_type=password", { email: eposta(otel, nick), password: sifre });
    if (!ok) return { hata: "Otel, kullanıcı adı veya şifre hatalı." };
    let p = {};
    try {
      const r = await fetch(URL + "/rest/v1/profiller?select=habbo_ad,otel,rol&id=eq." + v.user.id,
        { headers: { apikey: KEY, Authorization: "Bearer " + v.access_token } });
      p = (await r.json())[0] || {};
    } catch { /* profil okunamazsa yazılan adı kullan */ }
    localStorage.setItem("hesap", JSON.stringify({
      token: v.access_token, yenile: v.refresh_token, bitis: Date.now() + v.expires_in * 1000,
      id: v.user.id, ad: p.habbo_ad || nick, otel: p.otel || otel, rol: p.rol || "uye",
    }));
    return { tamam: true };
  }

  const cikis = () => localStorage.removeItem("hesap");

  // Sayfadaki #hesapLink bağlantısına giriş yapan kişinin adını yazar
  function baglanti() {
    const a = document.getElementById("hesapLink"), h = oku();
    if (a && h) a.textContent = h.ad + " (" + h.otel.toUpperCase() + ")";
  }

  // Geçerli oturum belirteci (süresi dolduysa yeniler)
  async function token() {
    const h = oku(); if (!h) return null;
    if (Date.now() < h.bitis - 60000) return h.token;
    const { ok, v } = await istek("/auth/v1/token?grant_type=refresh_token", { refresh_token: h.yenile });
    if (!ok) { cikis(); return null; }
    Object.assign(h, { token: v.access_token, yenile: v.refresh_token, bitis: Date.now() + v.expires_in * 1000 });
    localStorage.setItem("hesap", JSON.stringify(h));
    return h.token;
  }

  // Veritabanı isteği (giriş yapmışsa kişinin yetkisiyle)
  async function rest(yol, secenek = {}) {
    const t = await token();
    const r = await fetch(URL + "/rest/v1/" + yol, {
      ...secenek,
      headers: { apikey: KEY, Authorization: "Bearer " + (t || KEY), "Content-Type": "application/json", ...(secenek.headers || {}) },
    });
    const txt = await r.text(); let v = null;
    try { v = txt ? JSON.parse(txt) : null; } catch { /* boş cevap */ }
    return { ok: r.ok, v };
  }

  return { OTELLER, fn, giris, cikis, oku, baglanti, token, rest };
})();
HESAP.baglanti();
