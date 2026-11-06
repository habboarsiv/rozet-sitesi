# discord_bildir.py
# Yeni rozet bulununca Discord kanalına otomatik mesaj gönderir (webhook ile).
# Ek program/paket gerekmez, sadece Python'un kendi kütüphaneleri kullanılır.
#
# Webhook adresi şu iki yerden birinden okunur:
#   1) DISCORD_WEBHOOK_ROZET adlı ortam değişkeni
#   2) bu dosyanın yanındaki discord_webhook.txt dosyasının ilk satırı
# Bu adresi KİMSEYLE paylaşma ve GitHub'a yükleme (discord_webhook.txt .gitignore'da olmalı).
#
# Deneme mesajı göndermek için:   python discord_bildir.py test

import datetime
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

KLASOR = os.path.dirname(os.path.abspath(__file__))
WEBHOOK_DOSYASI = os.path.join(KLASOR, "discord_webhook.txt")

GORSEL = "https://images.habbo.com/c_images/album1584/"
SITE = "https://habboarsiv.com"
ISIM = "Habbo Arşiv"
RENK = 0xF5B301

# Discord, Python'un varsayılan kimliğini engelleyebilir; o yüzden kendi adımızı gönderiyoruz.
UA = {"User-Agent": "DiscordBot (https://habboarsiv.com, 1.0)", "Content-Type": "application/json"}

MESAJ_BASINA = 5   # Bir mesajda en fazla kaç rozet kartı olsun
EN_FAZLA = 15      # Tek seferde en fazla kaç rozet ayrıntılı duyurulsun (fazlası özetlenir)


def webhook_oku():
    adres = os.environ.get("DISCORD_WEBHOOK_ROZET", "").strip()
    if not adres and os.path.exists(WEBHOOK_DOSYASI):
        with open(WEBHOOK_DOSYASI, encoding="utf-8") as dosya:
            adres = dosya.readline().strip()
    return adres or None


def gonder(adres, veri, tekrar=True):
    """Webhook'a bir mesaj yollar. Başarılıysa True döner."""
    istek = urllib.request.Request(
        adres, data=json.dumps(veri).encode("utf-8"), headers=UA, method="POST"
    )
    try:
        with urllib.request.urlopen(istek, timeout=30):
            return True
    except urllib.error.HTTPError as hata:
        if hata.code == 429 and tekrar:  # çok hızlı gönderdik, Discord biraz bekletiyor
            try:
                bekle = float(json.loads(hata.read().decode("utf-8")).get("retry_after", 2))
            except Exception:
                bekle = 2.0
            time.sleep(min(bekle, 30) + 0.5)
            return gonder(adres, veri, tekrar=False)
        print("   Discord hatası: HTTP %d" % hata.code)
        return False
    except Exception as hata:
        print("   Discord'a ulaşılamadı:", hata)
        return False


def gorsel_adresi(kod):
    """Rozet görselinin adresini bulur (.png yoksa .gif). Bulunamazsa None."""
    for uzanti in (".png", ".gif"):
        adres = GORSEL + urllib.parse.quote(kod, safe="") + uzanti
        istek = urllib.request.Request(adres, method="HEAD", headers={"User-Agent": UA["User-Agent"]})
        try:
            with urllib.request.urlopen(istek, timeout=15):
                return adres
        except Exception:
            continue
    return None


def kart(rozet):
    """Bir rozet için Discord kartı (embed) hazırlar."""
    alanlar = [{"name": "Kod", "value": "`%s`" % rozet["code"], "inline": True}]
    oteller = rozet.get("hotels") or []
    if oteller:
        alanlar.append({"name": "Oteller", "value": ", ".join(oteller), "inline": True})
    k = {
        "title": "🆕 Yeni rozet: %s" % rozet["name"],
        "url": SITE,
        "color": RENK,
        "fields": alanlar,
        "footer": {"text": "habboarsiv.com"},
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    if rozet.get("desc"):
        k["description"] = rozet["desc"][:1000]
    gorsel = gorsel_adresi(rozet["code"])
    if gorsel:
        k["thumbnail"] = {"url": gorsel}
    return k


def rozet_bildir(rozetler):
    """Yeni bulunan rozetleri kanala duyurur. rozetler: [{"code","name","desc","hotels"}, ...]"""
    if not rozetler:
        return
    adres = webhook_oku()
    if not adres:
        print("Discord bildirimi atlandı: webhook adresi tanımlı değil (discord_webhook.txt yok).")
        return

    ayrintili, fazla = rozetler[:EN_FAZLA], rozetler[EN_FAZLA:]
    print("\nDiscord'a %d yeni rozet bildiriliyor..." % len(rozetler))
    gonderilen = 0
    for i in range(0, len(ayrintili), MESAJ_BASINA):
        parca = ayrintili[i:i + MESAJ_BASINA]
        veri = {"username": ISIM, "embeds": [kart(r) for r in parca]}
        if i == 0:
            veri["content"] = "🎉 **Yeni rozet bulundu!**" if len(rozetler) == 1 else \
                "🎉 **%d yeni rozet bulundu!**" % len(rozetler)
        if gonder(adres, veri):
            gonderilen += len(parca)
        time.sleep(1)
    if fazla:
        metin = "…ve %d rozet daha eklendi. Hepsi için: %s" % (len(fazla), SITE)
        gonder(adres, {"username": ISIM, "content": metin})
    print("   Discord'a gönderilen: %d / %d" % (gonderilen, len(ayrintili)))


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        rozet_bildir([{
            "code": "TEST01",
            "name": "Deneme rozeti",
            "desc": "Bu bir deneme mesajıdır. Bunu görüyorsan Discord bağlantısı çalışıyor.",
            "hotels": ["tr"],
        }])
    else:
        print("Deneme mesajı göndermek için:  python discord_bildir.py test")
