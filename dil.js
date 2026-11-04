/* Habbo Arşiv - dil desteği. Dil kodları otel kodlarıyla aynı: tr, com, br, de, es, fi, fr, it, nl */
const DIL = (() => {
  const L = ["tr", "com", "br", "de", "es", "fi", "fr", "it", "nl"];
  const AD = ["Türkçe", "English", "Português", "Deutsch", "Español", "Suomi", "Français", "Italiano", "Nederlands"];
  const ISO = ["tr", "en", "pt", "de", "es", "fi", "fr", "it", "nl"];
  // Her satır: [tr, com, br, de, es, fi, fr, it, nl]
  const T = {
    slogan: ["Habbo dünyasına dair aradığın her şey tek bir adreste.", "Everything you're looking for about the Habbo world, in one place.", "Tudo o que você procura sobre o mundo Habbo, em um só lugar.", "Alles, was du über die Habbo-Welt suchst, an einem Ort.", "Todo lo que buscas sobre el mundo Habbo, en un solo lugar.", "Kaikki mitä etsit Habbo-maailmasta, yhdessä paikassa.", "Tout ce que tu cherches sur l'univers Habbo, au même endroit.", "Tutto ciò che cerchi sul mondo Habbo, in un unico posto.", "Alles wat je zoekt over de Habbo-wereld, op één plek."],
    geri: ["← Habbo Arşiv'e dön", "← Back to Habbo Arşiv", "← Voltar ao Habbo Arşiv", "← Zurück zu Habbo Arşiv", "← Volver a Habbo Arşiv", "← Takaisin: Habbo Arşiv", "← Retour à Habbo Arşiv", "← Torna a Habbo Arşiv", "← Terug naar Habbo Arşiv"],
    baslik: ["Mobiler", "Furni", "Mobis", "Möbel", "Furnis", "Huonekalut", "Mobis", "Furni", "Furni"],
    altYazi: ["Habbo'da bulabileceğiniz tüm mobiler.", "All the furni you can find in Habbo.", "Todos os mobis que você pode encontrar no Habbo.", "Alle Möbel, die du im Habbo finden kannst.", "Todos los furnis que puedes encontrar en Habbo.", "Kaikki huonekalut, joita Habbosta löytyy.", "Tous les mobis que tu peux trouver dans Habbo.", "Tutti i furni che puoi trovare in Habbo.", "Alle furni die je in Habbo kunt vinden."],
    ara: ["Mobi adı, kodu ya da açıklaması ara...", "Search by furni name, code or description...", "Pesquise por nome, código ou descrição...", "Nach Name, Code oder Beschreibung suchen...", "Busca por nombre, código o descripción...", "Hae nimellä, koodilla tai kuvauksella...", "Rechercher par nom, code ou description...", "Cerca per nome, codice o descrizione...", "Zoek op naam, code of beschrijving..."],
    tumOtel: ["Tüm oteller", "All hotels", "Todos os hotéis", "Alle Hotels", "Todos los hoteles", "Kaikki hotellit", "Tous les hôtels", "Tutti gli hotel", "Alle hotels"],
    zeminDuvar: ["Zemin ve duvar", "Floor and wall", "Chão e parede", "Boden und Wand", "Suelo y pared", "Lattia ja seinä", "Sol et mur", "Pavimento e parete", "Vloer en muur"],
    zemin: ["Zemin mobileri", "Floor furni", "Mobis de chão", "Bodenmöbel", "Furnis de suelo", "Lattiahuonekalut", "Mobis de sol", "Furni a pavimento", "Vloerfurni"],
    duvar: ["Duvar mobileri", "Wall furni", "Mobis de parede", "Wandmöbel", "Furnis de pared", "Seinähuonekalut", "Mobis muraux", "Furni a parete", "Muurfurni"],
    yeni: ["Yeniden eskiye", "Newest first", "Mais novos primeiro", "Neueste zuerst", "Más nuevos primero", "Uusimmat ensin", "Plus récents d'abord", "Più recenti prima", "Nieuwste eerst"],
    eski: ["Eskiden yeniye", "Oldest first", "Mais antigos primeiro", "Älteste zuerst", "Más antiguos primero", "Vanhimmat ensin", "Plus anciens d'abord", "Più vecchi prima", "Oudste eerst"],
    az: ["A'dan Z'ye", "A to Z", "A a Z", "A bis Z", "De la A a la Z", "A–Ö", "De A à Z", "Da A a Z", "A tot Z"],
    nadir: ["Sadece nadirler", "Rares only", "Apenas raros", "Nur seltene", "Solo raros", "Vain harvinaiset", "Rares uniquement", "Solo rari", "Alleen zeldzame"],
    yukleniyor: ["Yükleniyor...", "Loading...", "Carregando...", "Wird geladen...", "Cargando...", "Ladataan...", "Chargement...", "Caricamento...", "Laden..."],
    sayi: ["mobi", "furni", "mobis", "Möbel", "furnis", "huonekalua", "mobis", "furni", "furni"],
    daha: ["Daha fazla göster", "Show more", "Mostrar mais", "Mehr anzeigen", "Mostrar más", "Näytä lisää", "Afficher plus", "Mostra altri", "Meer tonen"],
    hazirDegil: ["Mobi listesi henüz hazırlanmadı. Biraz sonra tekrar dene.", "The furni list isn't ready yet. Please try again later.", "A lista de mobis ainda não está pronta. Tente novamente mais tarde.", "Die Möbelliste ist noch nicht bereit. Versuche es später erneut.", "La lista de furnis aún no está lista. Inténtalo más tarde.", "Huonekalulista ei ole vielä valmis. Yritä myöhemmin uudelleen.", "La liste des mobis n'est pas encore prête. Réessaie plus tard.", "L'elenco dei furni non è ancora pronto. Riprova più tardi.", "De furnilijst is nog niet klaar. Probeer het later opnieuw."],
    yeniEt: ["YENİ", "NEW", "NOVO", "NEU", "NUEVO", "UUSI", "NOUVEAU", "NUOVO", "NIEUW"],
    nadirEt: ["NADİR", "RARE", "RARO", "SELTEN", "RARO", "HARVINAINEN", "RARE", "RARO", "ZELDZAAM"],
    gorselYok: ["Görsel yok", "No image", "Sem imagem", "Kein Bild", "Sin imagen", "Ei kuvaa", "Pas d'image", "Nessuna immagine", "Geen afbeelding"],
    kod: ["Kod", "Code", "Código", "Code", "Código", "Koodi", "Code", "Codice", "Code"],
    tur: ["Tür", "Type", "Tipo", "Typ", "Tipo", "Tyyppi", "Type", "Tipo", "Type"],
    zeminMobi: ["Zemin mobisi", "Floor furni", "Mobi de chão", "Bodenmöbel", "Furni de suelo", "Lattiahuonekalu", "Mobi de sol", "Furni a pavimento", "Vloerfurni"],
    duvarMobi: ["Duvar mobisi", "Wall furni", "Mobi de parede", "Wandmöbel", "Furni de pared", "Seinähuonekalu", "Mobi mural", "Furni a parete", "Muurfurni"],
    kategori: ["Kategori", "Category", "Categoria", "Kategorie", "Categoría", "Luokka", "Catégorie", "Categoria", "Categorie"],
    seri: ["Seri", "Line", "Linha", "Serie", "Línea", "Sarja", "Collection", "Linea", "Lijn"],
    nadirDeger: ["Nadir", "Rare", "Raro", "Selten", "Raro", "Harvinainen", "Rare", "Raro", "Zeldzaam"],
    evet: ["Evet", "Yes", "Sim", "Ja", "Sí", "Kyllä", "Oui", "Sì", "Ja"],
    oteller: ["Oteller", "Hotels", "Hotéis", "Hotels", "Hoteles", "Hotellit", "Hôtels", "Hotel", "Hotels"],
    tarih: ["Tarih", "Date", "Data", "Datum", "Fecha", "Päivämäärä", "Date", "Data", "Datum"],
  };

  function sec() {
    let k = null;
    try { k = localStorage.getItem("dil"); } catch { /* depolama kapalı */ }
    if (L.includes(k)) return k;
    const n = (navigator.language || "").slice(0, 2).toLowerCase(), i = ISO.indexOf(n);
    return i >= 0 ? L[i] : "com";   // desteklenmeyen dillerde İngilizce
  }
  const idx = () => L.indexOf(sec());
  const t = k => (T[k] && (T[k][idx()] || T[k][1])) || k;
  const iso = () => ISO[idx()];

  // data-i18n="anahtar" yazan öğelerin metnini, data-i18n-ph yazanların ipucu yazısını çevirir
  function uygula() {
    document.documentElement.lang = iso();
    document.querySelectorAll("[data-i18n]").forEach(e => { e.textContent = t(e.dataset.i18n); });
    document.querySelectorAll("[data-i18n-ph]").forEach(e => { e.placeholder = t(e.dataset.i18nPh); });
  }

  // Dil seçici (açılır liste). Dil değişince sayfa yenilenir.
  function secici(kutu) {
    const s = document.createElement("select");
    s.setAttribute("aria-label", "Language");
    L.forEach((k, i) => s.add(new Option(AD[i], k)));
    s.value = sec();
    s.onchange = () => { try { localStorage.setItem("dil", s.value); } catch { /* yoksay */ } location.reload(); };
    kutu.append(s);
  }

  return { L, T, sec, t, iso, uygula, secici };
})();
