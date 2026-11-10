# rozetleri_cek.py
# Habbo'nun herkese açık metin dosyalarından rozet adlarını ve açıklamalarını çeker
# ve rozetler.js dosyasına yazar. Sitemiz bu dosyayı okuyacak.
#
# SIRALAMA (en yeniden en eskiye):
#   Habbo'nun metin dosyaları tarih içermez, satır sırası da kronolojik değildir.
#   Bu yüzden her rozetin tarihi, görselinin Habbo sunucusundaki "Last-Modified"
#   (son değişiklik) bilgisinden alınır. Bu tarih rozet_tarihleri.json dosyasında
#   saklanır, böylece her rozet için bu işlem sadece BİR KEZ yapılır.
#   - Önceki rozetler.js'te olmayan rozetler YENİ sayılır; tarihleri bugündür,
#     "t" alanıyla işaretlenir ve listenin en başına gelir.
#   - Görseli bulunamayan eski rozetler listenin sonuna gider.
#
# İSİMSİZ ROZETLER:
#   Habbo bazen rozetin görselini metin dosyasına (ad/açıklama) girmeden önce yayınlar.
#   Bu rozetler metin dosyasında hiç geçmediği için normal yolla bulunamaz. Bu yüzden
#   aktif rozet serilerinin (DE68P, PTF87, WSH14 gibi) numarası çevresindeki kodların
#   görselleri denenir; görseli varsa rozet, adı yerine KODUYLA listeye eklenir.
#   Ad sonradan metin dosyasına gelince otomatik olarak gerçek adıyla güncellenir.
#
# Bu betik her çalıştığında veri değiştiyse dosyayı günceller, değişmediyse dokunmaz.
# Herhangi bir otel indirilemezse dosyaya hiç yazmaz (eksik veriyle üzerine yazmaz).

import datetime
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from email.utils import parsedate_to_datetime

KLASOR = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.join(KLASOR, "rozetler.js")
TARIH_DOSYASI = os.path.join(KLASOR, "rozet_tarihleri.json")

GORSEL = "https://images.habbo.com/c_images/album1584/"
UA = {"User-Agent": "Mozilla/5.0 (kisisel rozet arsivi projesi)"}

# Her otelin adresi. Anahtar (tr, com, it...) sitedeki bayrak kodlarıyla aynı.
OTELLER = {
    "tr": "https://www.habbo.com.tr",
    "com": "https://www.habbo.com",
    "it": "https://www.habbo.it",
    "es": "https://www.habbo.es",
    "de": "https://www.habbo.de",
    "fr": "https://www.habbo.fr",
    "fi": "https://www.habbo.fi",
    "nl": "https://www.habbo.nl",
    "br": "https://www.habbo.com.br",
}

# Adı gösterirken hangi dili tercih edelim? Önce Türkçe, yoksa İngilizce, yoksa herhangi biri.
TERCIH = ["tr", "com"]

ONEK_AD = "badge_name_"
ONEK_ACIKLAMA = "badge_desc_"

DENEME = 3          # Bir otel indirilemezse kaç kez denensin
EN_AZ_ORAN = 0.9    # Yeni liste eskisinin %90'ından küçükse bir sorun var say, yazma
IS_PARCACIGI = 10   # Görsel tarihlerini aynı anda kaç istekle soralım
PARCA = 500         # Kaç rozette bir ilerleme yazılıp kaydedilsin


def indir(taban):
    """Bir otelin metin dosyasını indirir ve yazı olarak döndürür."""
    adres = taban + "/gamedata/external_flash_texts/0"
    istek = urllib.request.Request(adres, headers=UA)
    with urllib.request.urlopen(istek, timeout=60) as cevap:
        return cevap.read().decode("utf-8", errors="replace")


def indir_dene(taban):
    """indir() işlemini birkaç kez dener. Hepsi başarısız olursa None döndürür."""
    for deneme in range(1, DENEME + 1):
        try:
            return indir(taban)
        except Exception as hata:
            print("   Deneme %d/%d başarısız: %s" % (deneme, DENEME, hata))
            if deneme < DENEME:
                time.sleep(5 * deneme)
    return None


def ayikla(metin):
    """Yazının içinden rozet adlarını ve açıklamalarını çıkarır.
    Her satır şuna benzer: badge_name_ABC=Rozet adı
    Üçüncü sonuç (sira): her rozetin dosyada ilk göründüğü sıra numarası."""
    adlar, aciklamalar, sira = {}, {}, {}

    def kaydet(kod):
        if kod not in sira:
            sira[kod] = len(sira)

    for satir in metin.splitlines():
        if "=" not in satir:
            continue
        anahtar, deger = satir.split("=", 1)
        if anahtar.startswith(ONEK_AD):
            kod = anahtar[len(ONEK_AD):].strip()
            if kod:  # kodsuz satırları atla
                adlar[kod] = deger.strip()
                kaydet(kod)
        elif anahtar.startswith(ONEK_ACIKLAMA):
            kod = anahtar[len(ONEK_ACIKLAMA):].strip()
            if kod:
                aciklamalar[kod] = deger.strip().replace("\\n", " ")
                kaydet(kod)
    return adlar, aciklamalar, sira


def sec(sozluk):
    """Birden çok dildeki metinden gösterilecek olanı seçer."""
    for otel in TERCIH:
        if otel in sozluk:
            return sozluk[otel]
    return next(iter(sozluk.values()), "")


def birlestir(sonuclar):
    """Bütün otellerin verisini rozet koduna göre toplar.
    Her rozete '_skor' ekler: metin dosyalarındaki göreli konumunun ortalaması.
    Sadece aynı tarihli rozetleri kendi aralarında sıralamak için kullanılır."""
    rozetler = {}
    for otel, (adlar, aciklamalar, sira) in sonuclar.items():
        son = max(len(sira) - 1, 1)
        for kod, konum in sira.items():
            r = rozetler.setdefault(
                kod, {"adlar": {}, "aciklamalar": {}, "oteller": [], "konumlar": []}
            )
            if kod in adlar:
                r["adlar"][otel] = adlar[kod]
            if kod in aciklamalar:
                r["aciklamalar"][otel] = aciklamalar[kod]
            if otel not in r["oteller"]:
                r["oteller"].append(otel)
            r["konumlar"].append(konum / son)

    sonuc = {}
    for kod, r in rozetler.items():
        sonuc[kod] = {
            "code": kod,
            "name": sec(r["adlar"]) or kod,
            "desc": sec(r["aciklamalar"]),
            "hotels": r["oteller"],
            "_skor": sum(r["konumlar"]) / len(r["konumlar"]),
        }
    return sonuc


# ---------------------------------------------------------------- görsel tarihleri

def tarih_oku():
    """Daha önce bulunan tarihleri okur: {kod: "2026-10-28" ya da "" (bilinmiyor)}."""
    if not os.path.exists(TARIH_DOSYASI):
        return {}
    try:
        with open(TARIH_DOSYASI, encoding="utf-8") as dosya:
            return json.load(dosya)
    except Exception as hata:
        print("Uyarı: rozet_tarihleri.json okunamadı (%s). Sıfırdan bakılacak." % hata)
        return {}


def tarih_yaz(tarihler):
    gecici = TARIH_DOSYASI + ".tmp"
    with open(gecici, "w", encoding="utf-8") as dosya:
        json.dump(tarihler, dosya, ensure_ascii=False, separators=(",", ":"))
    os.replace(gecici, TARIH_DOSYASI)


def gorsel_tarihi(kod):
    """Rozet görselinin sunucudaki son değişiklik tarihini bulur.
    "2026-10-28" -> bulundu, "" -> görsel yok/tarih yok, None -> geçici hata (sonra tekrar denenir)."""
    for uzanti in (".png", ".gif"):
        adres = GORSEL + urllib.parse.quote(kod, safe="") + uzanti
        istek = urllib.request.Request(adres, method="HEAD", headers=UA)
        try:
            with urllib.request.urlopen(istek, timeout=20) as cevap:
                zaman = cevap.headers.get("Last-Modified")
            if not zaman:
                return ""
            return parsedate_to_datetime(zaman).date().isoformat()
        except urllib.error.HTTPError as hata:
            if hata.code == 404:
                continue  # .png yoksa .gif dene
            return None
        except Exception:
            return None
    return ""


def tarihleri_coz(kodlar, tarihler):
    """Tarihi bilinmeyen rozetlerin görsel tarihlerini bulur ve rozet_tarihleri.json'a yazar.
    Yarıda kalırsa kaldığı yerden devam eder."""
    if not kodlar:
        return 0
    print("\nRozet görsellerinin tarihleri kontrol ediliyor: %d rozet." % len(kodlar))
    print("İlk seferde birkaç dakika sürebilir. Kapatırsanız kaldığı yerden devam eder.")
    hata_sayisi, bitti = 0, 0
    try:
        with ThreadPoolExecutor(max_workers=IS_PARCACIGI) as havuz:
            for i in range(0, len(kodlar), PARCA):
                parca = kodlar[i:i + PARCA]
                for kod, sonuc in zip(parca, havuz.map(gorsel_tarihi, parca)):
                    if sonuc is None:
                        hata_sayisi += 1
                    else:
                        tarihler[kod] = sonuc
                bitti += len(parca)
                tarih_yaz(tarihler)
                print("   %d / %d" % (bitti, len(kodlar)))
    except KeyboardInterrupt:
        tarih_yaz(tarihler)
        print("Durduruldu. O ana kadar bulunanlar kaydedildi.")
        raise
    if hata_sayisi:
        print("   %d rozet için geçici hata oldu, bir sonraki çalıştırmada tekrar denenecek." % hata_sayisi)
    return bitti


def rapor(liste, tarihler):
    """İlk kurulumda sıralamanın güvenilir olup olmadığını göstermek için özet yazar."""
    bulunan = [tarihler.get(b["code"]) for b in liste if tarihler.get(b["code"])]
    print("\n--- Tarih özeti ---")
    print("Tarihi bulunan: %d, bulunamayan: %d" % (len(bulunan), len(liste) - len(bulunan)))
    if not bulunan:
        print("Hiçbir görselin tarihi alınamadı; sıralama bu yüzden tahmine dayalı.")
        return
    en_sik, adet = Counter(bulunan).most_common(1)[0]
    oran = 100.0 * adet / len(bulunan)
    print("En çok rozetin olduğu gün: %s (%%%d)" % (en_sik, round(oran)))
    if oran > 30:
        print("UYARI: Rozetlerin büyük kısmı aynı güne ait. Habbo görselleri toplu yüklemiş")
        print("olabilir; bu durumda tarihler gerçek çıkış tarihini göstermez.")
    aylar = Counter(t[:7] for t in bulunan)
    print("En yeni aylar:", ", ".join("%s: %d" % (a, aylar[a]) for a in sorted(aylar, reverse=True)[:6]))
    print("En yeni görünen 10 rozet:")
    for b in liste[:10]:
        print("   %s  %s - %s" % (tarihler.get(b["code"]) or "?", b["code"], b["name"]))


# ---------------------------------------------------------------- görseli olmayanları gizle

GIZLEME_GUN = 60   # Yeni eklenen rozetlerin görseli bu kadar gün boyunca tekrar tekrar kontrol edilir


def gorsel_var(kod):
    """Rozet görseli Habbo'da var mı? True: var, False: yok (404), None: geçici hata."""
    for uzanti in (".png", ".gif"):
        adres = GORSEL + urllib.parse.quote(kod, safe="") + uzanti
        istek = urllib.request.Request(adres, method="HEAD", headers=UA)
        try:
            with urllib.request.urlopen(istek, timeout=20):
                return True
        except urllib.error.HTTPError as hata:
            if hata.code == 404:
                continue  # .png yoksa .gif dene
            return None
        except Exception:
            return None
    return False


def gorselleri_denetle(veri, eski_liste, tarihler, bugun):
    """Görseli henüz olmayan rozetleri listeden çıkarır.
    Her çalıştırmada şunların görseli sorulur:
      - listede olmayanlar (yeni gelenler ve daha önce gizlenenler): görsel gelince listeye girer
      - listede olup tarihi/görseli bulunamayanlar
      - son %d günde eklenenler (henüz görseli yüklenmemiş olabilir)
    Geçici hatada eski durum korunur. Dosyada tutulan bir durum yoktur; her seferinde baştan bakılır.""" % GIZLEME_GUN
    if eski_liste is None:
        return veri
    eski_set = {b["code"] for b in eski_liste}
    eski_t = {b["code"]: (b.get("t") or "") for b in eski_liste}
    sinir = (datetime.date.fromisoformat(bugun) - datetime.timedelta(days=GIZLEME_GUN)).isoformat()

    sorulacak = []
    for kod in veri:
        if kod not in eski_set:
            sorulacak.append(kod)
        elif tarihler.get(kod) == "" or (eski_t[kod] and eski_t[kod] >= sinir):
            sorulacak.append(kod)
    if not sorulacak:
        return veri

    print("\nGörsel var mı diye kontrol ediliyor: %d rozet." % len(sorulacak))
    gizli, gelen = set(), 0
    with ThreadPoolExecutor(max_workers=IS_PARCACIGI) as havuz:
        for kod, var in zip(sorulacak, havuz.map(gorsel_var, sorulacak)):
            if var is True:
                if kod not in eski_set:
                    tarihler[kod] = bugun   # görseli yeni göründü: YENİ sayılır
                    gelen += 1
            elif var is False:
                gizli.add(kod)
            elif kod not in eski_set:       # geçici hata: gizli olan gizli kalsın
                gizli.add(kod)
    print("   Görseli olmadığı için gizlenen: %d, görseli gelip listeye giren: %d" % (len(gizli), gelen))
    return {k: v for k, v in veri.items() if k not in gizli}


# ---------------------------------------------------------------- isimsiz rozetleri bul

KESIF_AKTIF_GUN = 90   # Son bu kadar günde rozeti çıkmış seriler "aktif" sayılır
KESIF_GERI = 15        # Serinin en büyük numarasından kaç numara geriye bakılsın (aradaki boşluklar)
KESIF_ILERI = 10       # Serinin en büyük numarasından kaç numara ileriye bakılsın
KOD_DESENI = re.compile(r"^([A-Za-z]{2,5})(\d{2,5})([A-Za-z]?)$")   # DE68P, PTF87, WSH14, TM219


def isimsizleri_bul(veri, eski_liste, tarihler, bugun):
    """Metin dosyasında henüz adı/açıklaması olmayan ama görseli yayınlanmış rozetleri bulur.
    Bulunanlar adı yerine koduyla ve hotels=[] ile veri'ye eklenir (YENİ sayılır).
    Metin dosyasına sonradan gelirlerse veri zaten gerçek bilgileriyle dolacağı için güncellenirler.
    (veri, yeni_bulunan_sayisi) döndürür."""
    if eski_liste is None:
        return veri, 0

    # 1) Önceki çalıştırmalarda görselden bulunmuş, metni hâlâ gelmemiş rozetleri koru.
    #    (hotels boşsa o rozet metinden değil, görselden bulunmuş demektir)
    for b in eski_liste:
        if not b.get("hotels") and b["code"] not in veri:
            veri[b["code"]] = {"code": b["code"], "name": b.get("name") or b["code"],
                               "desc": b.get("desc", ""), "hotels": [], "_skor": 1.0}

    # 2) Rozetleri serilere ayır: (önek, sonek, hane sayısı) -> {numara: kod}
    seriler, ornek = {}, {}
    for kod in veri:
        x = KOD_DESENI.match(kod)
        if not x:
            continue
        anahtar = (x.group(1).upper(), x.group(3).upper(), len(x.group(2)))
        seriler.setdefault(anahtar, {})[int(x.group(2))] = kod
        ornek.setdefault(anahtar, (x.group(1), x.group(3)))

    sinir = (datetime.date.fromisoformat(bugun) - datetime.timedelta(days=KESIF_AKTIF_GUN)).isoformat()
    bilinen = {k.upper() for k in veri}
    adaylar = []
    for anahtar, numaralar in seriler.items():
        if not any((tarihler.get(k) or "") >= sinir for k in numaralar.values()):
            continue   # seri uzun süredir durgun, boşuna sorgulama
        onek, sonek = ornek[anahtar]
        en_buyuk = max(numaralar)
        for n in range(max(1, en_buyuk - KESIF_GERI), en_buyuk + KESIF_ILERI + 1):
            if n in numaralar:
                continue
            kod = onek + str(n).zfill(anahtar[2]) + sonek
            if kod.upper() not in bilinen:
                adaylar.append(kod)
    adaylar = sorted(set(adaylar))
    if not adaylar:
        return veri, 0

    print("\nİsimsiz rozet taraması: %d kod deneniyor." % len(adaylar))
    bulunan = []
    with ThreadPoolExecutor(max_workers=IS_PARCACIGI) as havuz:
        for kod, var in zip(adaylar, havuz.map(gorsel_var, adaylar)):
            if var is True:
                bulunan.append(kod)
    for kod in bulunan:
        veri[kod] = {"code": kod, "name": kod, "desc": "", "hotels": [], "_skor": 1.0}
        tarihler[kod] = bugun
    print("   Görseli olup metni olmayan yeni rozet: %d" % len(bulunan))
    return veri, len(bulunan)


# ---------------------------------------------------------------- dosya işlemleri

def eski_oku():
    """Önceki rozetler.js'teki rozet listesini okur. Dosya yoksa ya da okunamazsa None."""
    if not os.path.exists(CIKTI):
        return None
    try:
        with open(CIKTI, encoding="utf-8") as dosya:
            metin = dosya.read()
        kod_bas = metin.index("var BADGES = ") + len("var BADGES = ")
        liste, _ = json.JSONDecoder().raw_decode(metin, kod_bas)
        return liste
    except Exception as hata:
        print("Uyarı: eski rozetler.js okunamadı (%s). Sıfırdan kurulacak." % hata)
        return None


def sirala(veri, eski_liste, tarihler, bugun):
    """Rozetleri 'en yeniden en eskiye' sıralar, yenileri işaretler.
    Sıra: görsel tarihi (yeni -> eski), aynı tarihliler kendi aralarında metin konumuna göre,
    tarihi bilinmeyenler en sonda. (liste, yeni_kodlar) döndürür."""
    eski_tarih = {}
    eski_set = set()
    if eski_liste is not None:
        eski_set = {b["code"] for b in eski_liste}
        eski_tarih = {b["code"]: b.get("t") for b in eski_liste}

    yeni_kodlar = [k for k in veri if eski_liste is not None and k not in eski_set]
    yeni_set = set(yeni_kodlar)

    siralama = sorted(veri, key=str.lower)  # eşitlikte kararlı olsun diye önce koda göre
    siralama.sort(key=lambda k: (tarihler.get(k) or "", veri[k]["_skor"]), reverse=True)

    liste = []
    for kod in siralama:
        r = veri[kod]
        b = {"code": r["code"], "name": r["name"], "desc": r["desc"], "hotels": r["hotels"]}
        ilk_gorulme = bugun if kod in yeni_set else eski_tarih.get(kod)
        if ilk_gorulme:
            b["t"] = ilk_gorulme
        liste.append(b)
    return liste, yeni_kodlar


def yaz(liste, bugun):
    """rozetler.js'i güvenli şekilde yazar (önce geçici dosya, sonra yer değiştirme)."""
    gecici = CIKTI + ".tmp"
    with open(gecici, "w", encoding="utf-8") as dosya:
        dosya.write("var BUILD = " + json.dumps({"tarih": bugun, "sira": "yeni"}) + ";\n")
        dosya.write("var BADGES = ")
        dosya.write(json.dumps(liste, ensure_ascii=False, separators=(",", ":")))
        dosya.write(";\n")
    os.replace(gecici, CIKTI)


def main():
    bugun = datetime.date.today().isoformat()
    sonuclar, basarisiz = {}, []

    for otel, taban in OTELLER.items():
        print("İndiriliyor:", otel, "...")
        metin = indir_dene(taban)
        if metin is None:
            basarisiz.append(otel)
            continue
        adlar, aciklamalar, sira = ayikla(metin)
        if not sira:
            print("   Dosyada hiç rozet bulunamadı, bu otel başarısız sayıldı.")
            basarisiz.append(otel)
            continue
        sonuclar[otel] = (adlar, aciklamalar, sira)
        print("  ", len(adlar), "rozet adı bulundu")
        time.sleep(1)  # Habbo'yu yormamak için kısa bekleme

    if basarisiz:
        print("HATA: şu oteller indirilemedi:", ", ".join(basarisiz))
        print("Eksik veriyle üzerine yazmamak için rozetler.js'e dokunulmadı.")
        sys.exit(1)

    veri = birlestir(sonuclar)
    eski_liste = eski_oku()

    if eski_liste and len(veri) < len(eski_liste) * EN_AZ_ORAN:
        print("HATA: yeni liste (%d) eskisinden (%d) çok küçük. Bir şey ters gitmiş olabilir."
              % (len(veri), len(eski_liste)))
        print("rozetler.js'e dokunulmadı.")
        sys.exit(1)

    tarihler = tarih_oku()
    eski_set = {b["code"] for b in eski_liste} if eski_liste else set()

    # Daha önce hiç görmediğimiz rozetler YENİ'dir: tarihleri bugündür, görselin tarihine bakılmaz.
    yeni_say = 0
    if eski_liste is not None:
        for kod in veri:
            if kod not in eski_set and kod not in tarihler:
                tarihler[kod] = bugun
                yeni_say += 1
    # Metin dosyasında henüz adı olmayan ama görseli yayınlanmış rozetleri de ekle.
    veri, isimsiz_say = isimsizleri_bul(veri, eski_liste, tarihler, bugun)
    # Geri kalanların tarihi görsellerinden bulunur (her rozet için sadece bir kez).
    eksik = sorted(k for k in veri if k not in tarihler)
    bakilan = tarihleri_coz(eksik, tarihler)
    gorunur = gorselleri_denetle(veri, eski_liste, tarihler, bugun)
    tarih_yaz(tarihler)

    liste, yeni_kodlar = sirala(gorunur, eski_liste, tarihler, bugun)

    if eski_liste is not None and liste == eski_liste:
        print("Değişiklik yok. rozetler.js aynı kaldı (%d rozet)." % len(liste))
        return

    yaz(liste, bugun)
    print("Bitti!", len(liste), "rozet rozetler.js dosyasına yazıldı.")

    if yeni_kodlar:
        print("\nYeni eklenen rozetler (%d):" % len(yeni_kodlar))
        for b in liste[:len(yeni_kodlar)][:30]:
            print("  ", b["code"], "-", b["name"])
        if len(yeni_kodlar) > 30:
            print("   ... ve %d tane daha" % (len(yeni_kodlar) - 30))        
        try:
            from discord_bildir import rozet_bildir
            yeni_set = set(yeni_kodlar)
            rozet_bildir([b for b in liste if b["code"] in yeni_set])
        except Exception as hata:
            print("Discord bildirimi gönderilemedi:", hata)
    if bakilan:
        rapor(liste, tarihler)


if __name__ == "__main__":
    main()
