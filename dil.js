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
    f_baslik: ["Fotoğraflar", "Photos", "Fotos", "Fotos", "Fotos", "Valokuvat", "Photos", "Foto", "Foto's"],
    f_alt: ["Oyuncuların çektiği ve Habbo'da yayınlanan son fotoğraflar.", "The latest photos taken by players and published on Habbo.", "As fotos mais recentes tiradas por jogadores e publicadas no Habbo.", "Die neuesten Fotos, die Spieler aufgenommen und im Habbo veröffentlicht haben.", "Las últimas fotos tomadas por los jugadores y publicadas en Habbo.", "Pelaajien ottamat ja Habbossa julkaistut tuoreimmat valokuvat.", "Les dernières photos prises par les joueurs et publiées sur Habbo.", "Le ultime foto scattate dai giocatori e pubblicate su Habbo.", "De nieuwste foto's die spelers hebben gemaakt en op Habbo zijn gepubliceerd."],
    f_ara: ["Oyuncu adı ara", "Search player name", "Pesquisar nome do jogador", "Spielernamen suchen", "Buscar nombre de jugador", "Hae pelaajan nimeä", "Rechercher un joueur", "Cerca nome giocatore", "Zoek spelernaam"],
    f_begeni: ["En çok beğenilen", "Most liked", "Mais curtidas", "Meistgeliked", "Más gustadas", "Eniten tykätyt", "Les plus aimées", "Più piaciute", "Meeste likes"],
    f_begenenler: ["Beğenenler", "Liked by", "Curtido por", "Gefällt", "Les gustó a", "Tykänneet", "Aimé par", "Piace a", "Geliket door"],
    f_begeniYok: ["Henüz beğeni yok", "No likes yet", "Ainda sem curtidas", "Noch keine Likes", "Aún sin me gusta", "Ei vielä tykkäyksiä", "Pas encore de j'aime", "Ancora nessun mi piace", "Nog geen likes"],
    f_hata: ["Fotoğraflar şu an alınamıyor. Biraz sonra tekrar dene.", "Photos can't be loaded right now. Please try again later.", "Não foi possível carregar as fotos agora. Tente novamente mais tarde.", "Die Fotos können gerade nicht geladen werden. Versuche es später erneut.", "No se pueden cargar las fotos ahora. Inténtalo más tarde.", "Valokuvia ei voi ladata juuri nyt. Yritä myöhemmin uudelleen.", "Impossible de charger les photos pour le moment. Réessaie plus tard.", "Impossibile caricare le foto al momento. Riprova più tardi.", "De foto's kunnen nu niet worden geladen. Probeer het later opnieuw."],
    f_bos: ["Sonuç yok. Aramayı kısaltmayı ya da başka bir otel seçmeyi dene.", "No results. Try a shorter search or another hotel.", "Nenhum resultado. Tente uma busca mais curta ou outro hotel.", "Keine Ergebnisse. Versuche eine kürzere Suche oder ein anderes Hotel.", "Sin resultados. Prueba con una búsqueda más corta u otro hotel.", "Ei tuloksia. Kokeile lyhyempää hakua tai toista hotellia.", "Aucun résultat. Essaie une recherche plus courte ou un autre hôtel.", "Nessun risultato. Prova una ricerca più breve o un altro hotel.", "Geen resultaten. Probeer een kortere zoekopdracht of een ander hotel."],
    f_oda: ["Oda", "Room", "Quarto", "Raum", "Sala", "Huone", "Salon", "Stanza", "Kamer"],
    f_ceken: ["Çeken", "Photographer", "Fotógrafo", "Fotograf", "Fotógrafo", "Kuvaaja", "Photographe", "Fotografo", "Fotograaf"],
    f_ac: ["Görseli yeni sekmede aç", "Open image in new tab", "Abrir imagem em nova aba", "Bild in neuem Tab öffnen", "Abrir imagen en una pestaña nueva", "Avaa kuva uudessa välilehdessä", "Ouvrir l'image dans un nouvel onglet", "Apri l'immagine in una nuova scheda", "Afbeelding openen in nieuw tabblad"],
    f_sorgula: ["Oyuncuyu sorgula", "Look up player", "Consultar jogador", "Spieler abfragen", "Consultar jugador", "Hae pelaaja", "Consulter le joueur", "Cerca giocatore", "Speler opzoeken"],
    f_otelYok: ["Yanıt vermeyen oteller:", "Hotels that didn't respond:", "Hotéis que não responderam:", "Hotels ohne Antwort:", "Hoteles que no respondieron:", "Hotellit, jotka eivät vastanneet:", "Hôtels sans réponse :", "Hotel che non hanno risposto:", "Hotels zonder antwoord:"],
    f_say: ["fotoğraf", "photos", "fotos", "Fotos", "fotos", "valokuvaa", "photos", "foto", "foto's"],
    f_kapat: ["Kapat", "Close", "Fechar", "Schließen", "Cerrar", "Sulje", "Fermer", "Chiudi", "Sluiten"],
    f_onceki: ["Önceki", "Previous", "Anterior", "Zurück", "Anterior", "Edellinen", "Précédente", "Precedente", "Vorige"],
    f_sonraki: ["Sonraki", "Next", "Próxima", "Weiter", "Siguiente", "Seuraava", "Suivante", "Successiva", "Volgende"],
    f_tekrar: ["Tekrar dene", "Try again", "Tentar novamente", "Erneut versuchen", "Reintentar", "Yritä uudelleen", "Réessayer", "Riprova", "Opnieuw proberen"],
    f_otel: ["Otel", "Hotel", "Hotel", "Hotel", "Hotel", "Hotelli", "Hôtel", "Hotel", "Hotel"],
    f_cekti: ["Çektikleri", "Photos taken", "Fotos tiradas", "Aufgenommen", "Fotos tomadas", "Ottamat", "Photos prises", "Foto scattate", "Gemaakt"],
    f_begendi: ["Beğendikleri", "Liked", "Curtidas", "Geliked", "Gustadas", "Tykätyt", "Aimées", "Piaciute", "Geliket"],
    f_stCekti: ["Çektiği fotoğraf", "Photos taken", "Fotos tiradas", "Aufgenommene Fotos", "Fotos tomadas", "Otetut valokuvat", "Photos prises", "Foto scattate", "Gemaakte foto's"],
    f_stAlinan: ["Aldığı beğeni", "Likes received", "Curtidas recebidas", "Erhaltene Likes", "Me gusta recibidos", "Saadut tykkäykset", "J'aime reçus", "Mi piace ricevuti", "Ontvangen likes"],
    f_stBegendi: ["Beğendiği fotoğraf", "Photos liked", "Fotos curtidas", "Geliked Fotos", "Fotos que le gustaron", "Tykätyt valokuvat", "Photos aimées", "Foto piaciute", "Geliket foto's"],
    f_kapsam: ["Yalnızca son paylaşılan fotoğraflar arasında aranır.", "Only the most recently shared photos are searched.", "A busca inclui apenas as fotos compartilhadas mais recentemente.", "Es werden nur die zuletzt geteilten Fotos durchsucht.", "Solo se busca entre las fotos compartidas más recientemente.", "Haku kattaa vain viimeksi jaetut valokuvat.", "La recherche ne porte que sur les photos partagées le plus récemment.", "La ricerca riguarda solo le foto condivise più di recente.", "Er wordt alleen gezocht in de meest recent gedeelde foto's."],
    f_oyuncuFoto: ["Bu oyuncunun fotoğrafları", "This player's photos", "Fotos deste jogador", "Fotos dieses Spielers", "Fotos de este jugador", "Tämän pelaajan valokuvat", "Photos de ce joueur", "Foto di questo giocatore", "Foto's van deze speler"],
    f_oyBos: ["Bu oyuncunun burada gösterilecek fotoğrafı yok.", "No photos to show for this player here.", "Não há fotos deste jogador para mostrar aqui.", "Für diesen Spieler gibt es hier keine Fotos.", "No hay fotos de este jugador para mostrar aquí.", "Tällä pelaajalla ei ole täällä näytettäviä valokuvia.", "Aucune photo à afficher pour ce joueur ici.", "Nessuna foto da mostrare per questo giocatore.", "Er zijn hier geen foto's van deze speler om te tonen."],
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
  function uygula(kok) {
    if (!kok) document.documentElement.lang = iso();   // kısmi uygulamada sayfa dilini değiştirme
    const r = kok || document;
    r.querySelectorAll("[data-i18n]").forEach(e => { e.textContent = t(e.dataset.i18n); });
    r.querySelectorAll("[data-i18n-ph]").forEach(e => { e.placeholder = t(e.dataset.i18nPh); });
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
