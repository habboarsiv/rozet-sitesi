#!/usr/bin/env python3
"""Habbo mobi (eşya) listesini 9 otelin furnidata dosyasından çekip mobiler.js dosyasına yazar.

- Her otelin herkese açık furnidata dosyasını indirir ve mobileri sınıf adına göre birleştirir.
- Listede olmayan yeni mobilere bugünün tarihi verilir (YENİ işareti için).
- İlk kurulumda eski mobilerin tarihi, ikon dosyasının Last-Modified bilgisinden alınır.
- Bir otel indirilemezse ya da liste çok küçülürse dosyaya hiç yazmaz.
Sadece Python'un kendi kütüphanelerini kullanır."""
import datetime
import email.utils
import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

KLASOR = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.join(KLASOR, "mobiler.js")
TARIHLER = os.path.join(KLASOR, "mobi_tarihleri.json")
OTELLER = {"tr": "com.tr", "com": "com", "br": "com.br", "de": "de", "es": "es",
           "fi": "fi", "fr": "fr", "it": "it", "nl": "nl"}
IKON = "https://images.habbo.com/dcr/hof_furni/%s/%s.png"
UA = {"User-Agent": "Mozilla/5.0 (compatible; HabboArsiv/1.0)"}
IS_PARCACIGI = 12
EN_AZ_ORAN = 0.9


def indir(url, deneme=3):
    son = None
    for i in range(deneme):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as hata:
            son = hata
            time.sleep(2 * (i + 1))
    raise RuntimeError("%s: %s" % (url, son))


def otel_verisi(kod):
    for yol in ("1", "0"):
        try:
            return indir("https://www.habbo.%s/gamedata/furnidata_json/%s" % (OTELLER[kod], yol))
        except Exception as hata:
            print("   (%s/%s olmadı: %s)" % (kod, yol, str(hata)[:90]))
    raise RuntimeError("furnidata indirilemedi: " + kod)


def ogeler(veri):
    for anahtar, tur in (("roomitemtypes", "f"), ("wallitemtypes", "w")):
        grup = veri.get(anahtar) or {}
        liste = grup.get("furnitype", []) if isinstance(grup, dict) else grup
        for f in liste or []:
            if isinstance(f, dict) and f.get("classname"):
                yield tur, f


def birlestir(otel_veri):
    tum = {}
    for kod, veri in otel_veri.items():
        for tur, f in ogeler(veri):
            c = str(f["classname"])
            m = tum.setdefault(c, {"c": c, "y": tur, "h": [], "ad": {}, "ac": {}, "r": 0, "k": "", "l": "", "z": 0})
            if kod not in m["h"]:
                m["h"].append(kod)
            ad = str(f.get("name") or "").strip()
            if ad:
                m["ad"][kod] = ad
            try:
                m["r"] = max(m["r"], int(f.get("revision") or 0))
            except (TypeError, ValueError):
                pass
            m["k"] = m["k"] or str(f.get("category") or "")
            m["l"] = m["l"] or str(f.get("furniline") or "")
            m["z"] = m["z"] or (1 if f.get("rare") else 0)
            ac = str(f.get("description") or "").strip()
            if ac:
                m["ac"][kod] = ac[:200]
    return tum


def ikon_adaylari(c):
    taban, _, sira = c.partition("*")
    return [taban + "_icon_" + sira, taban + "_icon"] if sira else [taban + "_icon"]


def ikon_tarihi(m):
    """İkon dosyasının Last-Modified tarihi (YYYY-MM-DD); bulunamazsa ''."""
    for ad in ikon_adaylari(m["c"]):
        istek = urllib.request.Request(IKON % (m["r"], ad), method="HEAD", headers=UA)
        try:
            with urllib.request.urlopen(istek, timeout=20) as r:
                lm = r.headers.get("Last-Modified")
                if lm:
                    return email.utils.parsedate_to_datetime(lm).date().isoformat()
                return ""
        except urllib.error.HTTPError:
            continue
        except Exception:
            return ""
    return ""


def dil_yaz(tum):
    """Her dil için ayrı dosya: mobi_dil/<otel>.js (ad ve açıklama). Sadece içerik değiştiyse yazar."""
    klasor = os.path.join(KLASOR, "mobi_dil")
    os.makedirs(klasor, exist_ok=True)
    for kod in OTELLER:
        sozluk = {}
        for c in sorted(tum):
            ad = tum[c]["ad"].get(kod)
            if ad:
                ac = tum[c]["ac"].get(kod)
                sozluk[c] = [ad, ac] if ac else [ad]
        icerik = ('var MOBI_DIL = window.MOBI_DIL || {};\nMOBI_DIL["%s"] = %s;\n'
                  % (kod, json.dumps(sozluk, ensure_ascii=False, separators=(",", ":"))))
        yol = os.path.join(klasor, kod + ".js")
        if os.path.exists(yol) and open(yol, encoding="utf-8").read() == icerik:
            continue
        with open(yol, "w", encoding="utf-8") as f:
            f.write(icerik)
        print("   Dil dosyası yazıldı: %s (%d mobi)" % (yol.split(os.sep)[-1], len(sozluk)))


def eski_oku():
    if not os.path.exists(CIKTI):
        return None
    try:
        s = open(CIKTI, encoding="utf-8").read()
        i = s.index("var MOBILER = ") + len("var MOBILER = ")
        return json.JSONDecoder().raw_decode(s, i)[0]
    except Exception:
        return None


def main():
    bugun = datetime.date.today().isoformat()
    eski = eski_oku()
    eski_set = {b["c"] for b in eski} if eski else set()
    eski_t = {b["c"]: b.get("t") for b in eski} if eski else {}
    tarihler = json.load(open(TARIHLER, encoding="utf-8")) if os.path.exists(TARIHLER) else {}

    otel_veri = {}
    for kod in OTELLER:
        print("İndiriliyor:", kod, flush=True)
        otel_veri[kod] = otel_verisi(kod)
    tum = birlestir(otel_veri)
    print("Toplam %d mobi bulundu." % len(tum))
    if not tum:
        sys.exit("Hiç mobi bulunamadı, dosyaya yazılmadı.")
    if eski and len(tum) < len(eski) * EN_AZ_ORAN:
        sys.exit("Liste beklenenden çok küçük (%d < %d), dosyaya yazılmadı." % (len(tum), len(eski)))

    eksik = [m for c, m in tum.items() if c not in tarihler]
    if eski is None and eksik:
        print("İlk kurulum: %d mobinin tarihi ikon dosyasından okunuyor (birkaç dakika sürebilir)..." % len(eksik), flush=True)
        with ThreadPoolExecutor(max_workers=IS_PARCACIGI) as havuz:
            for m, t in zip(eksik, havuz.map(ikon_tarihi, eksik)):
                tarihler[m["c"]] = t
    else:
        for m in eksik:
            tarihler[m["c"]] = bugun

    liste = []
    for c, m in tum.items():
        ad = m["ad"]
        n = ad.get("tr") or ad.get("com") or next(iter(ad.values()), c)
        kayit = {"c": c, "n": n, "r": m["r"], "y": m["y"], "k": m["k"], "l": m["l"],
                 "z": m["z"], "h": sorted(m["h"], key=list(OTELLER).index), "dt": tarihler.get(c, "")}
        if eski is not None and c not in eski_set:
            kayit["t"] = bugun
        elif eski_t.get(c):
            kayit["t"] = eski_t[c]
        liste.append(kayit)
    liste.sort(key=lambda b: (b["dt"] or "", b["n"].lower()), reverse=False)
    liste.sort(key=lambda b: b["dt"] or "", reverse=True)

    yeni = [b for b in liste if b.get("t") == bugun]
    with open(TARIHLER, "w", encoding="utf-8") as f:
        json.dump(tarihler, f, ensure_ascii=False, sort_keys=True)
    dil_yaz(tum)
    if liste == eski:
        print("Değişiklik yok, mobiler.js'e dokunulmadı.")
        return
    veri = ("var MOBILER = " + json.dumps(liste, ensure_ascii=False, separators=(",", ":")) + ";\n" +
            "var MOBILER_BUILD = " + json.dumps({"tarih": bugun, "sayi": len(liste)}) + ";\n")
    with open(CIKTI, "w", encoding="utf-8") as f:
        f.write(veri)
    print("Bitti! %d mobi (yeni: %d)" % (len(liste), len(yeni)))
    for b in yeni[:20]:
        print("   YENİ:", b["c"], "-", b["n"])


if __name__ == "__main__":
    import sys
    main()
