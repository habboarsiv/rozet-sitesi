# promolari_cek.py
# Habbo'nun bütün promo görsellerinin listesini (web promoları, istemci içi küçük promolar,
# eski promolar) bütün otellerden toplar ve promolar.js dosyasına yazar. Site bu dosyayı okur.
#
# Liste kaynağı: HabboAssets'in herkese açık arşiv API'si (Habbo kendisi böyle bir liste sunmuyor).
# Görsel dosyaları mümkün olduğunda Habbo'nun kendi sunucusundan (images.habbo.com) yüklenir;
# eski olanlar için HabboAssets'in yedeği yedek adres olarak saklanır.
#
# Güvenli çalışır: önce küçük bir deneme yapar, yanıt biçimi tanınmazsa durur ve ne geldiğini yazar.
# Eski kayıtlar silinmez: Habbo bir görseli kaldırsa bile arşivde kalır, liste sadece büyür.
#
# Kullanım:   python promolari_cek.py

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

from rozetleri_cek import KLASOR, UA

CIKTI = os.path.join(KLASOR, "promolar.js")
API = "https://www.habboassets.com/api/v2/images"
SITE = "https://www.habboassets.com"
CDN_ONEK = "https://cdn.habboassets.com/images.habbo.com/"

# (API'deki tür adı, sitedeki kısa kod)
TURLER = [("webpromo", "web"), ("clientpromo", "kucuk"), ("dump", "diger")]
# HabboAssets otel numaraları -> sitedeki otel kodları
OTELLER = {1: "com", 2: "br", 3: "es", 4: "fi", 5: "fr", 6: "de", 7: "it", 8: "nl", 9: "tr", 10: "sandbox"}
TAKMA = {"en": "com", "com": "com", "pt": "br", "br": "br", "com.br": "br", "tr": "tr", "com.tr": "tr",
         "es": "es", "fi": "fi", "fr": "fr", "de": "de", "it": "it", "nl": "nl", "sandbox": "sandbox"}

URL_A = ("url", "cdn_url", "image_url", "src", "image", "file_url", "path", "link", "original", "file")
AD_A = ("name", "filename", "file_name", "title", "file")
TARIH_A = ("found_at", "found", "first_seen", "first_seen_at", "created_at", "added_at", "date")
OTEL_A = ("hotel", "hotel_short", "short", "domain", "lang", "hotel_code")
UZANTI = (".png", ".gif", ".jpg", ".jpeg", ".webp")

SAYFA = 200            # sayfa başına istenen kayıt (API daha azını verirse sorun değil)
EN_FAZLA_SAYFA = 600
BEKLEME = 0.35         # istekler arası bekleme (HabboAssets dakikada 240 isteğe izin veriyor)
DENEME = 4


def getir(params, otel_id):
    adres = API + "?" + urllib.parse.urlencode(params)
    basliklar = dict(UA)
    basliklar["Accept"] = "application/json"
    basliklar["X-Hotel-ID"] = str(otel_id)
    for d in range(DENEME):
        try:
            with urllib.request.urlopen(urllib.request.Request(adres, headers=basliklar), timeout=60) as c:
                return json.loads(c.read().decode("utf-8", errors="replace"))
        except urllib.error.HTTPError as h:
            if h.code in (429, 500, 502, 503, 504):
                try:
                    bekle = int(h.headers.get("Retry-After", ""))
                except (TypeError, ValueError):
                    bekle = 10 * (d + 1)
                time.sleep(min(max(bekle, 1), 60))
                continue
            print("   HTTP %d: %s" % (h.code, adres))
            return None
        except Exception:
            time.sleep(3 * (d + 1))
    return None


def liste_bul(v, derinlik=0):
    """Yanıtın içinden kayıt listesini bulur; bulamazsa None."""
    if isinstance(v, list):
        return v
    if isinstance(v, dict) and derinlik < 3:
        for k in ("data", "images", "items", "results", "files"):
            if k in v:
                r = liste_bul(v[k], derinlik + 1)
                if r is not None:
                    return r
    return None


def ilk(o, anahtarlar):
    for a in anahtarlar:
        v = o.get(a)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def adres_duzelt(url):
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("/"):
        return SITE + url
    return url


def oge_coz(o, otel_kodu):
    """Tek bir API kaydını {n, u, f, t, h} haline getirir. Anlaşılmazsa None."""
    if isinstance(o, str):
        o = {"url": o}
    if not isinstance(o, dict):
        return None
    url = ""
    for a in URL_A:
        v = o.get(a)
        if isinstance(v, dict):
            v = ilk(v, URL_A)
        if isinstance(v, str) and v.strip():
            aday = adres_duzelt(v.strip())
            if urllib.parse.urlparse(aday).path.lower().endswith(UZANTI):
                url = aday
                break
    if not url:
        return None
    ad = ilk(o, AD_A) or urllib.parse.urlparse(url).path
    ad = urllib.parse.unquote(ad).rsplit("/", 1)[-1]
    t = ilk(o, TARIH_A)[:10]
    if not re.match(r"^\d{4}-\d\d-\d\d$", t):
        t = ""
    ham = ilk(o, OTEL_A).lower().replace("https://", "").replace("www.", "").replace("habbo.", "").strip("/")
    otel = TAKMA.get(ham) or otel_kodu
    if url.startswith(CDN_ONEK):          # Habbo'nun kendi sunucusundaki asıl adres
        asil, yedek = "https://images.habbo.com/" + url[len(CDN_ONEK):], url
    else:
        asil, yedek = url, ""
    return {"n": ad, "u": asil, "f": yedek, "t": t, "h": otel}


def kaydet(kayitlar, ogeler, tur):
    for x in ogeler:
        anahtar = x["n"].lower() + "|" + tur
        k = kayitlar.get(anahtar)
        if k is None:
            kayitlar[anahtar] = {"n": x["n"], "u": x["u"], "k": tur, "h": [x["h"]]}
            if x["f"]:
                kayitlar[anahtar]["f"] = x["f"]
            if x["t"]:
                kayitlar[anahtar]["t"] = x["t"]
        else:
            if x["h"] not in k["h"]:
                k["h"].append(x["h"])
            if x["t"] and (not k.get("t") or x["t"] < k["t"]):
                k["t"] = x["t"]
            if x["f"] and "f" not in k:
                k["f"] = x["f"]


def tara(tur_api, tur_kod, otel_id, otel_kodu, kayitlar):
    """Bir tür + otel için bütün sayfaları gezer. (ilk_sayfa_adresleri, hata_oldu_mu) döner."""
    gorulen, ilk_sayfa, hata = set(), set(), False
    for sayfa in range(1, EN_FAZLA_SAYFA + 1):
        veri = getir({"kind": tur_api, "page": sayfa, "per_page": SAYFA, "limit": SAYFA, "offset": len(gorulen)}, otel_id)
        if veri is None:
            hata = True
            break
        liste = liste_bul(veri)
        if liste is None:
            print("   Tanınmayan yanıt biçimi:", json.dumps(veri, ensure_ascii=False)[:300])
            hata = True
            break
        ogeler = [x for x in (oge_coz(o, otel_kodu) for o in liste) if x]
        yeni = [x for x in ogeler if x["u"] not in gorulen]
        if sayfa == 1:
            ilk_sayfa = {x["u"] for x in ogeler}
        if not yeni:
            break
        gorulen.update(x["u"] for x in yeni)
        kaydet(kayitlar, yeni, tur_kod)
        if sayfa % 10 == 0:
            print("      sayfa %d, %d görsel" % (sayfa, len(gorulen)))
        time.sleep(BEKLEME)
    return ilk_sayfa, hata, len(gorulen)


def eski_oku():
    if not os.path.exists(CIKTI):
        return {}
    try:
        with open(CIKTI, encoding="utf-8") as d:
            metin = d.read()
        bas = metin.index("var PROMOS = ") + len("var PROMOS = ")
        liste, _ = json.JSONDecoder().raw_decode(metin, bas)
        return {x["n"].lower() + "|" + x["k"]: x for x in liste}
    except Exception as hata:
        print("Uyarı: eski promolar.js okunamadı (%s). Sıfırdan kurulacak." % hata)
        return {}


def deneme():
    """Büyük işe girmeden önce tek istek: yanıt biçimi tanınıyor mu?"""
    print("Önce küçük bir deneme yapılıyor...")
    veri = getir({"kind": "webpromo", "page": 1, "per_page": 5, "limit": 5}, 1)
    liste = liste_bul(veri) if veri is not None else None
    ogeler = [x for x in (oge_coz(o, "com") for o in (liste or [])) if x]
    if ogeler:
        print("   Tamam: örnek ->", ogeler[0]["n"], ogeler[0]["t"] or "(tarihsiz)", ogeler[0]["h"])
        return
    print("\nHATA: Yanıttan görsel listesi çıkarılamadı. Sunucuya boşuna yüklenmemek için durdum.")
    print("Gelen yanıtın başı:", json.dumps(veri, ensure_ascii=False)[:600] if veri is not None else "(yanıt yok / bağlantı hatası)")
    print("Bu satırı betiği hazırlayan kişiye gösterin.")
    sys.exit(1)


def yaz(liste):
    icerik = "var PROMO_BUILD = %s;\nvar PROMOS = %s;\n" % (
        json.dumps({"adet": len(liste)}),
        json.dumps(liste, ensure_ascii=False, separators=(",", ":")))
    if os.path.exists(CIKTI):
        with open(CIKTI, encoding="utf-8") as d:
            if d.read() == icerik:
                return False
    gecici = CIKTI + ".tmp"
    with open(gecici, "w", encoding="utf-8") as d:
        d.write(icerik)
    os.replace(gecici, CIKTI)
    return True


def main():
    deneme()
    kayitlar = eski_oku()
    eski_say = len(kayitlar)
    hatalar = 0
    for tur_api, tur_kod in TURLER:
        ilk_sayfalar = None
        for otel_id, otel_kodu in OTELLER.items():
            print("%s / %s ..." % (tur_api, otel_kodu))
            ilk_sayfa, hata, say = tara(tur_api, tur_kod, otel_id, otel_kodu, kayitlar)
            print("   %d görsel" % say)
            if hata:
                hatalar += 1
            if ilk_sayfalar is None:
                ilk_sayfalar = ilk_sayfa
            elif ilk_sayfa and ilk_sayfa == ilk_sayfalar and not hata:
                print("   Bu otel ilkiyle aynı liste verdi; kalan oteller atlanıyor.")
                break
    if not kayitlar:
        print("HATA: hiç kayıt bulunamadı, promolar.js'e dokunulmadı.")
        sys.exit(1)
    liste = sorted(kayitlar.values(), key=lambda x: (x.get("t", ""), x["n"].lower()), reverse=True)
    for x in liste:
        x["h"].sort()
    degisti = yaz(liste)
    print("\nBitti! %d promo görseli (önceki: %d). promolar.js %s"
          % (len(liste), eski_say, "güncellendi." if degisti else "aynı kaldı."))
    if hatalar:
        print("%d istek grubunda hata oldu; bir sonraki çalıştırmada tamamlanır." % hatalar)


if __name__ == "__main__":
    main()
