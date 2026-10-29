# sahipleri_cek.py
# Her rozeti kaç kişinin taşıdığını Habbo'nun herkese açık (resmî) API'sinden çeker
# ve rozet_sahipler.js dosyasına yazar. Site bu dosyayı okuyup rozet detayında gösterir.
#
# Önce rozetleri_cek.py çalışmış olmalı (rozetler.js'teki rozet listesini kullanır).
#
# Nasıl çalışır:
#   - Sayılar her otel için ayrı sorulur (Türkiye'deki sahip sayısı ile .com'unki farklıdır).
#   - Önce henüz hiç sorulmamış rozetler sorulur: önce Türkiye oteli, en yeni rozetten
#     eskiye doğru; sonra diğer oteller.
#   - Sonuçlar rozet_sahipler.json dosyasında saklanır. Pencereyi kapatsanız ya da Habbo
#     sizi yavaşlatsa bile bir sonraki çalıştırmada kaldığı yerden devam eder.
#   - Her çalıştırmada ayrıca en eski kalan sayılardan bir kısmı yenilenir, böylece
#     sayılar zamanla güncel kalır.
#
# Kullanım:   python sahipleri_cek.py            (süre sınırı yok)
#             python sahipleri_cek.py --dakika 30 (en fazla 30 dakika çalış)

import argparse
import datetime
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from rozetleri_cek import CIKTI as LISTE_DOSYASI, KLASOR, OTELLER, UA

CACHE = os.path.join(KLASOR, "rozet_sahipler.json")
CIKTI = os.path.join(KLASOR, "rozet_sahipler.js")

SIRA = list(OTELLER)      # Dosyadaki sütun sırası: tr, com, it, es, de, fr, fi, nl, br
IS_PARCACIGI = 6          # Aynı anda kaç istek (--is ile değiştirilebilir)
PARCA = 100               # Kaç istekte bir ilerleme yazılsın
KAYIT_ARALIGI = 60        # En az kaç saniyede bir rozet_sahipler.json'a kaydedilsin
YENILEME = 2500           # Her çalıştırmada en eski kaç sayı yenilensin
DENEME = 4
# Yanıtta sayının bulunabileceği alan adları. Tanıyamazsak yanlış sayı göstermemek için durur.
ANAHTARLAR = ("count", "owners", "ownerCount", "owner_count", "badgeOwners", "total", "amount", "value")


KILIT = threading.Lock()
IST = {"istek": 0, "sure": 0.0, "429": 0}   # ölçüm: kaç istek, toplam yanıt süresi, kaç kez yavaşlatıldık
DURAKLAT = [0.0]                              # Bu zamana kadar bütün istekler beklesin (Habbo "yavaş ol" derse)


def bekle_gerekirse():
    while True:
        kalan = DURAKLAT[0] - time.time()
        if kalan <= 0:
            return
        time.sleep(min(kalan, 2))


def liste_oku():
    """rozetler.js'ten [(kod, [oteller])] listesini okur (en yeniden en eskiye)."""
    if not os.path.exists(LISTE_DOSYASI):
        print("HATA: rozetler.js bulunamadı. Önce rozetleri_cek.py çalışmalı.")
        sys.exit(1)
    with open(LISTE_DOSYASI, encoding="utf-8") as dosya:
        metin = dosya.read()
    bas = metin.index("var BADGES = ") + len("var BADGES = ")
    liste, _ = json.JSONDecoder().raw_decode(metin, bas)
    return [(b["code"], b["hotels"]) for b in liste]


def cache_oku():
    if not os.path.exists(CACHE):
        return {}
    try:
        with open(CACHE, encoding="utf-8") as dosya:
            return json.load(dosya)
    except Exception as hata:
        print("Uyarı: rozet_sahipler.json okunamadı (%s). Sıfırdan başlanacak." % hata)
        return {}


def cache_yaz(cache):
    gecici = CACHE + ".tmp"
    with open(gecici, "w", encoding="utf-8") as dosya:
        json.dump(cache, dosya, ensure_ascii=False, separators=(",", ":"))
    os.replace(gecici, CACHE)


def _bul(v, derinlik=0):
    if isinstance(v, bool):
        return None
    if isinstance(v, int):
        return v
    if isinstance(v, float) and v.is_integer():
        return int(v)
    if isinstance(v, dict) and derinlik < 3:
        for anahtar in ANAHTARLAR:
            if anahtar in v:
                sonuc = _bul(v[anahtar], derinlik + 1)
                if sonuc is not None:
                    return sonuc
    return None


def sayi_cikar(govde):
    """Yanıt gövdesinden sahip sayısını çıkarır; bulamazsa None."""
    try:
        return _bul(json.loads(govde))
    except ValueError:
        try:
            return int(govde.strip())
        except ValueError:
            return None


def sor(cift):
    """(otel, kod) için sahip sayısını sorar.
    Döner: (durum, sayi, ornek)  durum: tamam | yok | tanimadi | hata"""
    otel, kod = cift
    adres = "%s/api/public/badge/owners/%s" % (OTELLER[otel], urllib.parse.quote(kod, safe=""))
    basliklar = dict(UA)
    basliklar["Accept"] = "application/json"
    for deneme in range(DENEME):
        bekle_gerekirse()
        t = time.time()
        try:
            with urllib.request.urlopen(urllib.request.Request(adres, headers=basliklar), timeout=20) as cevap:
                govde = cevap.read().decode("utf-8", errors="replace")
            with KILIT:
                IST["istek"] += 1
                IST["sure"] += time.time() - t
            sayi = sayi_cikar(govde)
            if sayi is None:
                return ("tanimadi", None, govde[:200])
            return ("tamam", sayi, govde[:200])
        except urllib.error.HTTPError as hata:
            if hata.code == 404:
                with KILIT:
                    IST["istek"] += 1
                    IST["sure"] += time.time() - t
                return ("yok", None, "404")
            if hata.code in (429, 500, 502, 503, 504):
                try:
                    bekle = int(hata.headers.get("Retry-After", ""))
                except (TypeError, ValueError):
                    bekle = 10 if hata.code == 429 else 3 * (deneme + 1)
                with KILIT:
                    if hata.code == 429:
                        IST["429"] += 1
                    # Bir iş parçacığı "yavaş ol" uyarısı alınca hepsi birlikte bekler
                    DURAKLAT[0] = max(DURAKLAT[0], time.time() + min(max(bekle, 1), 60))
                continue
            return ("hata", None, "HTTP %d" % hata.code)
        except Exception:
            time.sleep(2 * (deneme + 1))
    return ("hata", None, "baglanti")


def kuyruk_hazirla(liste, cache, bugun, izinli=None):
    """Sorulacak (otel, kod) çiftlerini sıralar: önce hiç sorulmamışlar, sonra en eskiler."""
    oncelik = {o: i for i, o in enumerate(SIRA)}
    eksik = []
    mevcut = []
    for yas, (kod, oteller) in enumerate(liste):  # yas: 0 = en yeni rozet
        kayit = cache.get(kod, {})
        for otel in oteller:
            if otel not in OTELLER or (izinli and otel not in izinli):
                continue
            if otel not in kayit:
                eksik.append((oncelik[otel], yas, otel, kod))
            elif kayit[otel][1] != bugun:
                mevcut.append((kayit[otel][1], otel, kod))
    eksik.sort()
    mevcut.sort()
    kuyruk = [(o, k) for _, _, o, k in eksik] + [(o, k) for _, o, k in mevcut[:YENILEME]]
    return kuyruk, len(eksik)


def js_yaz(liste, cache):
    """cache'i sitenin okuyacağı rozet_sahipler.js dosyasına yazar. Değiştiyse True."""
    veri = {}
    for kod, oteller in liste:
        kayit = cache.get(kod)
        if not kayit:
            continue
        satir = [kayit[o][0] if o in kayit else None for o in SIRA]
        while satir and satir[-1] is None:
            satir.pop()
        if satir and any(x is not None for x in satir):
            veri[kod] = satir
    icerik = "var SAHIP_SIRA = %s;\nvar OWNERS = %s;\n" % (
        json.dumps(SIRA), json.dumps(veri, ensure_ascii=False, separators=(",", ":")))
    if os.path.exists(CIKTI):
        with open(CIKTI, encoding="utf-8") as dosya:
            if dosya.read() == icerik:
                return False
    gecici = CIKTI + ".tmp"
    with open(gecici, "w", encoding="utf-8") as dosya:
        dosya.write(icerik)
    os.replace(gecici, CIKTI)
    return True


def sure_yaz(dakika):
    dakika = int(dakika)
    if dakika >= 120:
        return "%d sa %d dk" % (dakika // 60, dakika % 60)
    return "%d dk" % dakika


def kaydet(cache, cift, sonuc, bugun):
    """Bir sorgu sonucunu cache'e işler. Döner: durum (tamam/yok/tanimadi/hata)."""
    otel, kod = cift
    durum, sayi, _ = sonuc
    if durum == "tamam":
        cache.setdefault(kod, {})[otel] = [sayi, bugun]
    elif durum == "yok":
        cache.setdefault(kod, {})[otel] = [None, bugun]
    return durum


def deneme_sorgusu(kuyruk, cache):
    """Büyük işe girmeden önce 3 küçük deneme yapar. Yanıt biçimi tanınmıyorsa durur."""
    print("Önce 3 deneme sorgusu yapılıyor...")
    sonuclar = [sor(c) for c in kuyruk[:3]]
    for cift, (durum, sayi, ornek) in zip(kuyruk[:3], sonuclar):
        print("   %s / %s -> %s  %s" % (cift[0], cift[1], durum, ("sayı: %s" % sayi) if sayi is not None else ornek))
    iyi = [s for s in sonuclar if s[0] == "tamam"]
    if iyi:
        return sonuclar
    if cache:
        return sonuclar  # önceden veri var; geçici bir sorun olabilir, devam edip bakalım
    print("\nHATA: Deneme sorgularının hiçbirinden sahip sayısı okunamadı. Sunucuya boşuna")
    print("yüklenmemek için durdum. Yukarıdaki satırlara göre:")
    print("  - 'hata  HTTP 429' ya da 'baglanti' ise: Habbo yavaşlatıyor ya da bağlantı yok; biraz sonra tekrar deneyin.")
    print("  - 'tanimadi' ya da '404' ise: Habbo'nun yanıt biçimi beklediğimizden farklı olabilir.")
    print("    Bu satırların ekran görüntüsünü betiği hazırlayan kişiye gösterin.")
    sys.exit(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dakika", type=float, default=0, help="en fazla kaç dakika çalışsın (0 = sınırsız)")
    ap.add_argument("--oteller", default="", help="sadece bu oteller sorulsun, örn: tr   ya da   tr,com")
    ap.add_argument("--is", dest="is_sayisi", type=int, default=IS_PARCACIGI, help="aynı anda kaç istek")
    arg = ap.parse_args()
    izinli = [o.strip() for o in arg.oteller.split(",") if o.strip()] or None
    if izinli:
        bilinmeyen = [o for o in izinli if o not in OTELLER]
        if bilinmeyen:
            print("HATA: bilinmeyen otel kodu:", ", ".join(bilinmeyen), "- geçerli olanlar:", ", ".join(OTELLER))
            sys.exit(1)
    bitis = time.time() + arg.dakika * 60 if arg.dakika else None

    bugun = int(datetime.date.today().strftime("%Y%m%d"))
    liste = liste_oku()
    cache = cache_oku()
    kuyruk, eksik_say = kuyruk_hazirla(liste, cache, bugun, izinli)

    print("%d rozet, %d sahip sayısı henüz sorulmamış, toplam %d sorgu yapılacak."
          % (len(liste), eksik_say, len(kuyruk)))
    if not kuyruk:
        print("Yapılacak bir şey yok.")
        js_yaz(liste, cache)
        return

    ilk_sonuclar = deneme_sorgusu(kuyruk, cache)
    for cift, sonuc in zip(kuyruk[:3], ilk_sonuclar):
        kaydet(cache, cift, sonuc, bugun)
    kuyruk = kuyruk[3:]   # deneme sorguları zaten işlendi, tekrar sorulmasın

    bitti, yok, hata, tanimadi = 0, 0, 0, 0
    durdu = None
    t0 = time.time()
    son_kayit = time.time()
    try:
        with ThreadPoolExecutor(max_workers=max(1, arg.is_sayisi)) as havuz:
            for i in range(0, len(kuyruk), PARCA):
                if bitis and time.time() > bitis:
                    durdu = "Süre sınırı doldu."
                    break
                parca = kuyruk[i:i + PARCA]
                sonuclar = list(havuz.map(sor, parca))
                sorun = 0
                for cift, sonuc in zip(parca, sonuclar):
                    durum = kaydet(cache, cift, sonuc, bugun)
                    if durum == "yok":
                        yok += 1
                    elif durum == "tanimadi":
                        tanimadi += 1
                        sorun += 1
                    elif durum == "hata":
                        hata += 1
                        sorun += 1
                bitti += len(parca)
                if time.time() - son_kayit > KAYIT_ARALIGI:
                    cache_yaz(cache)
                    son_kayit = time.time()
                gecen = time.time() - t0
                hiz = bitti / max(gecen, 1)
                kalan = (len(kuyruk) - bitti) / max(hiz, 0.001) / 60
                ort = IST["sure"] / max(IST["istek"], 1)
                print("   %d / %d   (%.1f sorgu/sn, ort. yanıt %.1f sn, yavaşlatılma: %d, kalan ~%s)"
                      % (bitti, len(kuyruk), hiz, ort, IST["429"], sure_yaz(kalan)))
                if sorun > len(parca) * 0.5:
                    durdu = "Habbo çok sayıda isteğe cevap vermedi (yavaşlatıyor olabilir)."
                    break
    except KeyboardInterrupt:
        cache_yaz(cache)
        js_yaz(liste, cache)
        print("Durduruldu. O ana kadar bulunanlar kaydedildi.")
        raise

    cache_yaz(cache)
    degisti = js_yaz(liste, cache)
    if durdu:
        print("\nDURDU:", durdu)
        print("Sorun değil: bulunanlar kaydedildi, bir sonraki çalıştırmada kaldığı yerden devam eder.")
    if hata or tanimadi:
        print("%d sorgu cevapsız kaldı, bir sonraki seferde tekrar denenecek." % (hata + tanimadi))
    print("Bitti!" if not durdu else "Kısmen bitti.",
          "rozet_sahipler.js", "güncellendi." if degisti else "aynı kaldı.")

    # Küçük özet
    sayilar = [v[0] for k in cache.values() for v in k.values() if v[0] is not None]
    if sayilar:
        print("\n--- Özet ---")
        print("Sahip sayısı bilinen (rozet, otel) çifti: %d" % len(sayilar))
        print("En çok sahibi olan: %d,  sıfır sahipli: %d,  tam 1000 olan: %d"
              % (max(sayilar), sum(1 for s in sayilar if s == 0), sum(1 for s in sayilar if s == 1000)))
        if yok:
            print("Habbo'da bulunamayan (404) çift sayısı bu çalıştırmada: %d" % yok)


if __name__ == "__main__":
    main()
