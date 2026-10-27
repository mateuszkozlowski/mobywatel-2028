# mObywatel — system projektowy prototypu

Stan odczytu kodu: 25 października 2026. Opis implementacji webowej R36. Dokument uzupełnia [mapę produktu i pokrycia](mobywatel_mapa_produktu_i_pokrycie.md); nie jest deklaracją zgodności natywnej aplikacji z Material 3 ani certyfikacją dostępności.

## Kierunek

**Cyfrowy portfel i centrum życia obywatela.** Wyrazistość wynika z hierarchii tekstu, dużych zaokrąglonych powierzchni i czytelnego następnego kroku. AI pozostaje pomocą w zadaniu. Obywatel może znaleźć dokument, przeczytać pismo i przejść formularz bez rozmowy.

Główna nawigacja: **Dokumenty / Sprawy / Kod QR / Usługi / Więcej**. Historia, konto i preferencje należą do Więcej. Nie przywracamy wcześniejszego układu Ja / Sprawy / Historia jako aktualnej architektury.

## Kolor i jego znaczenie

| Rola | Bieżąca wartość | Zastosowanie |
|---|---|---|
| Główne działanie | `#304bc4` | Token `--c-primary`; starsze komponenty zawierają również inne odcienie niebieskiego |
| Powierzchnia tonalna | `#e5eafa` | Wspierające wybory i objaśnienia |
| Tło / powierzchnia | `#f2f3f7` / `#ffffff` | Oddzielenie grup treści bez ciężkich ramek |
| Tekst / tekst pomocniczy | `#17212d` / `#536073` | Nowe wspólne komponenty; starsza warstwa ma również tusz `#111c2c` |
| Kontur | `#d7deea` | Granice pól i istotnych grup |
| Prawo jazdy | `#674294` | Rodzina dokumentu, bez znaczenia „ważny” |
| KDR | `#286457` | Rodzina dokumentu |
| Pojazdy | `#efb25f` z tekstem `#38260e` | Bursztynowa karta kolekcji pojazdów; detale mają własne jaśniejsze powierzchnie |
| Tożsamość | Baza `#06152e`; gradient z `#122b57`, `#235bc8`, `#123467` | mDowód; gradient jest ograniczony do tej rodziny |

Niebieski nie oznacza prawnego potwierdzenia. Bursztyn ostrzeżeń otrzymuje tekst fazy i poziomu, a czerwony jest akcentem błędu lub krytycznej pilności. Nie używamy czerwieni jako wspólnego tła aplikacji. W kodzie pozostały starsze literalne kolory akcentów; nie należy traktować tej tabeli jako dowodu ich pełnego ujednolicenia.

## Typografia i przestrzeń

- **Instrument Sans** — nagłówki stron, wybrane tytuły i duże wartości. Typowy nagłówek strony: 32/38 px; Dokumenty mają 28/35 px, a na małych szerokościach 25 px. Hierarchia jest dopasowana do funkcji, nie do jednego rozmiaru wszędzie.
- **Inter** — nowe formularze, wyszukiwanie i wspólne wiersze. Wiersz: 600, 16/23 px; treść: 400, 14/22 px; metadane: 500, 12/18 px. Pola formularza: 16/24 px.
- **Dziedziczony tekst** — stos systemowy z SF Pro i Inter jako alternatywą. Nie cały interfejs renderuje Inter jako pierwszy krój.
- Wspólna skala odstępów: **4 / 8 / 12 / 16 / 24 / 32 px**. Główne kontenery mają promień 24 px, pola wyszukiwania i działania typu pill 28 px, zwykłe pola formularzy 14 px. Karta dokumentu zachowuje 25 px.
- Wiersze, pola i kontrolki zachowują pełne cele dotykowe. Główne pola mają minimum 52 px, wyszukiwanie 56 px, typowy wiersz 76 px, a zagęszczona lista dokumentów 72 px. Długi tekst może się łamać.

## Rama ekranu i kolekcje

Treść przewija się pomiędzy nagłówkiem a dolną nawigacją. Przy szerokości do 520 px znika rama telefonu i aplikacja korzysta z wysokości widoku oraz safe area. Dodatkowe reguły do 360 px ograniczają odstępy i upraszczają siatki. To reguły prototypu; test fizycznego telefonu jest osobnym etapem.

Dokumenty mają **jedną kolekcję**, prezentowaną jako Karty albo Lista. Oba widoki obejmują wszystkie posiadane dokumenty. Kolorowe skróty mają minimum 100 px wysokości i prowadzą bezpośrednio do szczegółów. Ulubione bez limitu są na początku, pozostałe dokumenty niżej; grupy się nie dublują. Ustawienia pod ikoną koła zębatego grupują wygląd, dodanie i zwiniętą sekcję ulubionych. Zmiana ulubionych dotyczy wyróżnienia i kolejności, nie posiadania. Wyszukiwanie jest pod ikoną, bez stałego dużego pola na ekranie z kilkoma dokumentami.

Kolekcja „Moje pojazdy” prowadzi do osobnego auta. Rejestracja, OC i badanie są przypisane do wybranego obiektu; Jan ma dwa pojazdy. Szczegóły dokumentu zachowują stały nagłówek i zakładki Dokument / Dane, a przewija się zawartość pod nimi.

## Komponenty i stany

| Wzorzec | Reguła użycia |
|---|---|
| Główne / drugorzędne działanie | Wyraźna etykieta skutku, wypełnienie niebieskie lub spokojna powierzchnia tonalna; błąd pozostaje przy zadaniu |
| Lista i wiersz | Nazwa, kontekst, stan i następny krok; duże kafle służą kategoriom, nie każdej instancji sprawy |
| Przełącznik / filtr | Widoczny wybór i `aria-pressed`; Sprawy: Wszystkie, Twój ruch, W toku, Zakończone |
| Grupa spraw | Twój ruch, Terminy, Czeka na urząd, Zakończone czynności; wiadomości i własne przypomnienia pozostają rozróżnione |
| Formularz / przegląd / wynik | Osobne etapy; szkic, zapis i błąd nie mogą być utożsamiane z wykonaniem czynności |
| Pole odczytane z umowy | Wartość poprawialna, cytat z numerem strony, wymagane sprawdzenie z oryginałem; poprawa wartości unieważnia jej wcześniejsze potwierdzenie |
| Potwierdzenie dwóch osób | Każda osoba ma osobny ekran i własny akt potwierdzenia; zgłoszenie szkody jest kolejną, osobną czynnością |
| Zdjęcia / kopia | Pliki lokalne w IndexedDB, podgląd, usunięcie i błąd odczytu; kopia do druku lub PDF jawnie bez pieczęci i skutku prawnego |
| Panel pomocy | Dolny panel zachowuje kontekst, ma zamknięcie, rozwinięcie i Escape; gest nie jest jedyną drogą |
| Ostrzeżenie | Miejsce, źródło, okres, faza, poziom i zalecenia; zapisane lub przygotowane nie oznacza bezpieczne ani odwołane |

## Ruch, głębia i dostępność

Rutynowe grupy odróżnia ton powierzchni. Cień unosi przede wszystkim kartę, dolną nawigację i panel; nie zastępuje statusu ani granicy danych.

Ogólne wejście zawartości głównego obszaru zostało usunięte. Główna kolekcja jest bezpośrednim wejściem do dokumentu; nie stosuje karuzeli. Historyczny selektor zachowuje przerywalne przejścia, lecz nie jest obecnym głównym widokiem. Reakcja na nacisk jest krótka i odwracalna. Systemowe i aplikacyjne ograniczenie ruchu wyłączają animacje.

Kontrolki mają widoczny fokus; modalny panel odcina tło od nawigacji przez `inert`. Preferencje większego tekstu i mocniejszego kontrastu zachowują rolę elementu. Ich obecność nie dowodzi pełnej zgodności WCAG, obsługi czytników ani braku problemów przy powiększeniu.

## Granice wiarygodnej prezentacji

- Odczyt umowy to PDFKit / Apple Vision i reguły lokalnie na serwerze Mac, z cytatami do kontroli; nie Bielik ani generatywny LLM.
- Podpis własnego PDF-u pozostaje podglądem. Dekoracyjny QR, animacja i lokalne potwierdzenie nie są kryptograficznym podpisem lub certyfikowanym przekazaniem e-ID.
- KRS zapisuje preferencję, MKA pokazuje dane scenariusza, a status sprawy pochodzi z lokalnego świata. Nie nazywamy tego natywnym PUSH lub bieżącym odczytem rejestru.
- Bielik jest podłączony do dwóch kontekstowych funkcji i został uruchomiony w testach. Pełny tor STT/TTS i ogólny agent narzędziowy nie są włączone; nie utożsamiamy ich ze szkicem pisma.
- Dwie rundy sześciu perspektyw AI i celowane r3 nie zatwierdzają automatycznie nowych modułów. Celowane r5, r6 i r7 obejmują konkretne zmiany; r8 zawiera dalsze testy źródeł, transportu i odczytu plików. Brak podstaw do „100/100” i certyfikacji dostępności.

Podstawa odczytu: aktywny łańcuch `index.html` → `life-ui.css` / `civic-ui.css`, moduły `documents-ui`, `vehicle-ui`, `cases-ui`, `collision-ui`, `local-files`, `public-service-ui`, `contract-ui`, `motion-ui` oraz `ocr.py` / `ocr.swift`. Opis zachowuje rozróżnienie między założeniem, kodem i zakresem wykonanych sprawdzeń.

## Aktualne wzorce kontekstowe R8

- Odpowiedź: ustalony odbiorca i temat jako kontekst, główna akcja AI nad treścią, jawne „Napisz samodzielnie”, pliki w panelu modalnym. W nowym piśmie dane adresata i tematu są edytowalne.
- Plik: własna widoczna kontrolka z ikoną i limitem formatu, natywny file input zachowany pod spodem dla klawiatury i systemowego wyboru. Natywny przycisk przeglądarki nie jest pokazywany jako druga kontrolka.
- Szkic: edytowalny tekst i źródła; kompaktowe zestawienie kwot nie utożsamia równości sum z prawem do ulgi. Kwoty liczy kod. Szczegóły wymagające sprawdzenia można rozwinąć.
- Autoryzacja: osobny dialog, ikona `auth-face` nie dziedziczy pozycjonowania wizualizacji dokumentu `.face`. To demonstracja, bez rzeczywistej biometrii.
- mStłuczka: pytanie bezpieczeństwa poza postępem; trzy nazwane fazy; warunki pokazane jako czytelna lista; opcje na pełną szerokość. Brak kwalifikacji nie daje alarmowego CTA 112.
- Kolory skrótów głównej kolekcji wynikają obecnie z `LIFE_COLORS`; pełny widok dokumentu wykorzystuje też odziedziczone grafiki. Ujednolicenie całej grafiki dokumentów i modelu ich ważności pozostaje osobnym zakresem, nie wynikiem celowanych testów R7.

## R9–R10: kontrolki i stany oczekiwania

Na głównym ekranie dokumentów pozostały lupa i koło zębate. Karty/Lista są preferencją w ustawieniach portfela. Na ekranie Spraw aktywny filtr zmienia zbiór, nie tylko kolor kontrolki. Wyszukiwanie nie miesza obecnych zadań z ofertą usług: grupy mają osobne nagłówki.

Skeleton odpowiada strukturze pisma, bez fikcyjnego procentu ukończenia. Przesuwana warstwa światła wykorzystuje transform; lokalne pojawienie się wyniku trwa 180 ms. Systemowe i wewnętrzne ograniczenie ruchu wyłączają te animacje. Główne zakładki nadal nie uruchamiają wejściowej animacji całej strony.

Natywne dialogi w top layer mają własne dolne promienie i maskę powiązaną z obrysem telefonu. Samo overflow:hidden rodzica nie wystarcza do przycięcia native dialog. W wąskim widoku bez ramki promień rodzica wynosi zero. Konkretne obserwacje i zrzuty są w QA R10; nie jest to dowód zachowania fizycznego urządzenia.

## Dane publiczne R12

CERT pokazuje wynik dopasowania do listy osobno od prostych reguł tekstowych. Brak wpisu ma neutralną powierzchnię i nie oznacza bezpieczeństwa. PSP stosuje te same listy i formularze co reszta aplikacji; dostęp źródłowy pozostaje odrębny od aktualnego otwarcia. Brakujące dane nie stają się nazwą miejscowości, a adres wymagający sprawdzenia otrzymuje tekstowe oznaczenie. Wyniki są porcjowane, pola zachowują wpisy, powrót respektuje miejsce wejścia. Nowe formularze mają komunikaty walidacji po polsku.

## Zakończenia i materiały portfela R20

Wynik odczytu ma zakończenie, a edycję wyłącznie dla rzeczywistych kryteriów. Potwierdzona czynność oferuje jeden sensowny następny krok i wejście do zapisanego potwierdzenia. Plan sytuacji jest przeliczany po powrocie. Po wyjaśnieniu pisma akcja odpowiedzi jest przed oryginałem pisma.

mDowód w kolekcji: gradient `#0b254a → #153f85 → #17468f`, sześć białych linii SVG o opacity .14. Pozostałe rodziny zachowują barwy. Nie ma powtarzanych wielkich kół. W mocniejszym kontraście i forced colors dekoracja jest wyłączona. Brak nowej animacji stron. [Szczegóły i testy](mobywatel_zakonczenia_i_paleta.md).


## Uzupełnienie R22 — rezultaty i pokaz

Zapisane przygotowanie, wysłanie, doręczenie i zapłata mają własne etykiety i następne kroki. Nie używamy samego zielonego stanu do zastępowania dowodu czynności. Księga jest otwieralnym obiektem; zamówienie zachowuje jej numer bez powtórnego pytania.

Strona pokazu używa tych samych barw i rodzin pisma co aplikacja. Po lewej krótka teza, persony i pionowa lista scen; po prawej rzeczywista aplikacja. Tekst nie zastępuje klikalnego produktu. Na węższych ekranach układ przechodzi w jedną kolumnę i udostępnia samą aplikację. Metryka integracji jest poza interfejsem obywatela. Wybór sceny i stan ładowania mają tekstowe potwierdzenia oraz fokus klawiatury. Nie animujemy wejścia całej strony.

Polska walidacja obejmuje wymagane pola, format, zakres oraz możliwość poprawienia wpisu. Sceny bez aparatu są wejściem prezenterskim, a nie dodatkowymi usługami w ustawieniach.


R23: celowany retest KW ujawnił wyzerowanie wyboru po „Popraw dane”. Formularz odtwarza teraz rodzaj dokumentu i wybrany dział, zachowując numer nieruchomości. Historia uwagi IA-R22-01 i ponowne sprawdzenie pozostają w QA.


R24: wyszukiwanie zapisanej odpowiedzi obejmuje także jej treść i kontekst pisma źródłowego. R23 zachowuje nieudany retest słowa „termomodern”; kolejny test ma osobny zapis. ServiceWorker używa nowej wersji cache po ostatnich poprawkach, aby offline nie przywracał starszego formularza KW.


R30: pokaz ma ramkę telefonu na desktopie, cztery przyciski wyboru osoby z semantyką pojedynczego wyboru i krótszą metrykę. Rozbieżność dotyczy danych wskazanych w prośbie; brak podstaw do nazywania jej rezerwacją. Karty mDowodu i prawa jazdy korzystają z własnych wygenerowanych teł, oddzielnych oznaczeń orła/PL i warstwy zapewniającej kontrast. Nie zmienia to procedur ani uprawnień dokumentów.

## R30 — rozpoznawalność dokumentów i dostęp do pomocy

32 znane typy dokumentów z urzędowego katalogu oraz legitymacja służbowa mają przypisany semantyczny znak. Rejestr w documents-ui.js mapuje jawny typ lub dokładną nazwę i jej aliasy; nie rozpoznaje uprawnień z fragmentu nazwy. Nieznany przyszły dokument otrzymuje neutralny znak dokumentu. Znaki są dekoracyjne, a nazwa pozostaje widoczna. Własne piktogramy zawodów nie są oficjalnymi logotypami ich wystawców.

Karty, lista, ustawienia ulubionych i aktualny katalog dodawania korzystają z jednego renderera znaku. Biblioteka 32 znaków nie oznacza integracji 32 wystawców ani dodania dokumentów do konta. Osobna plansza qa-document-marks.html pokazuje pełny zestaw bez przypisywania osobie fikcyjnych uprawnień.

Stały przycisk Asystent w górnym pasku zastępuje redundantny skrót awatara; dane konta i ustawienia pozostają w Więcej. Pomoc otwiera istniejący dolny panel i wraca do bieżącej powierzchni po zamknięciu. Formularze i listy nadal działają bez rozmowy. Wąski nagłówek portfela zawija akcje zamiast przycinać ustawienia; oba cele zachowują 44 px.

## R30 — historie, Ada i domknięcie pomocy

Pokaz ma 4 historie z 3 różnymi scenami oraz 2 warianty: rozbieżność Marty i zbiór PSP Kacpra. Role widoczne przy imieniu. Wspólny kontrakt showcase-scenes.js wiąże tekst, technologię, dalszy pilotaż i dozwolone wejście osoby. Ada to nazwa asystenta, nie modelu; Bielik pozostaje jawnie wskazanym lokalnym modelem dla pism. Reguły, OCR Apple i publiczne dane nie są nazywane polskim AI.

Przygotowanie SMS-a do CERT jest osobnym, jawnym przeglądem odbiorcy 8080 i niezmienionej treści. Brak wpisu na liście nie oznacza bezpieczeństwa. Przekazanie otwiera aplikację Wiadomości, bez automatycznego wysyłania i bez fikcyjnego potwierdzenia CERT. Krytyczna akcja jest widoczna, źródło pozostaje w natywnym details.

Ekrany zadania mają wspólny kompaktowy, przyklejony nagłówek. Nowa rozmowa w dolnym panelu oddziela nowy wątek, poprzednie są dostępne w Rozmowach w pamięci sesji. Zamykanie zachowuje rozmowę; przejście do zadania odłącza stary krok i anuluje jego żądanie agenta. Żądanie ma limit 35 sekund. Nie resetujemy liczników pracy na siłę ani szkiców w Sprawach.

## R30 — korekty E2E i scena bezpieczeństwa

Szkic kompozytora należy do rozmowy; zmiana historii zachowuje go oddzielnie. Nagłówek mStłuczki nie zawiera etapów i eyebrow w kolumnie powrotu. Wejście Ewy przekazuje edytowalny powód upływu ważności.

Pokaz używa hasła „Państwo, które pamięta za Ciebie.” Poza 12 scenami i2 wariantami ma osobne ostrzeżenie i alarm powietrzny. Komunikaty są scenariuszami koncepcji wskazanymi w metryce, nie aktywnymi alertami ani integracją RCB. Realistyczny ekran odbiorcy nie powtarza banera prototypu. Czerwony alarm pobiera rzeczywiste punkty PSP wokół przykładowego centrum miasta profilu; pokazuje mapę OSM i URL pieszej trasy Google Maps. Nie używa GPS ani nie nadaje statusu otwarcia lub gwarancji bezpieczeństwa trasy. Żółta gotowość prowadzi do lokalnego poradnika. Kolory są hierarchią UI, nie kodem stopni RCB. Nie ma przycisku „Jestem bezpieczny”, wysyłki do bliskich, służb, syren ani powiadomień systemowych.

## R30 — ostatnia warstwa alarmu

Trasa ma stały pasek akcji pod przewijaną treścią alarmu, z adresem i warunkiem dostępu. Mapa ładuje się bez odroczenia, ma polski locale i osobny link do pełnej mapy, gdy osadzenie zewnętrzne nie jest dostępne. Status odczytu punktu jest poprawnie ukryty wizualnie, zachowując ogłoszenie czytnika. Odległość i początek trasy odnoszą się do jawnego centrum miasta scenariusza.

## R30 — trzy zwięzłe stany alertu i prosty panel pomocy

Alert ma stały układ bez przewijania przy standardowej wielkości tekstu: komunikat, miejsce, mapa i jedna akcja. Dane techniczne, pochodzenie i warunki dostępu są pod Informacje na osobnym ekranie. Przy powiększeniu tekstu i wyjątkowo małej wysokości przewijanie pozostaje awaryjną drogą dostępności.

Żółty stan korzysta z historycznego komunikatu RCB z23.10.2026; źródło zostało wtedy odwołane. Nie jest to aktywny feed. Red/clear odtwarzają cykl koncepcji. Zamknięcie komunikatu zachowuje pasek, dopiero potwierdzenie odwołania usuwa go. Przełącznik Pokaż alerty na stronie pokazu ukrywa/odtwarza prezentację, bez ustawiania realnych powiadomień. Plecak nie jest krokiem alertu; krótka instrukcja prowadzi do pełnegoPDF, a ogólny poradnik usługi pozostaje dostępny.

Asystent nie ma imienia. Jeden nagłówek; plus rozpoczyna rozmowę, menu zawiera historię i zmianę rozmiaru, X zamyka. Usunięto wiersz powitania/marki i dodatkowy pasek narzędzi. Szkice pozostają per rozmowa.

## R31 — naprawa inicjalizacji panelu

Panel jest dołączony do dokumentu przed podpięciem obsługi jego przycisków. R30 zachowano jako wersję z wykrytą regresją P1; poprawkę weryfikuje ponowny test otwarcia, nowej rozmowy, menu, historii, rozwinięcia, Escape i szkiców.

## R32 — modalne menu i spójne krawędzie

Menu rozmowy jest dołączone po panelu, zgodnie z kolejnością wyboru aktywnego dialogu w syncModalIsolation. Nie jest już oznaczane jako inert podczas otwarcia. Nagłówek ma elastyczny tytuł i X po prawej; zawartość jest przycinana do zaokrągleń. R31 zachowuje osobny raport błędu P1, a R32 wymaga celowanego retestu rozmów i szkiców.

## R33 — niewysłany szkic w historii

Historia uwzględnia również rozmowę bez nadanego tytułu, jeśli zawiera niewysłany tekst. Taki wpis nazywa się Szkic z fragmentem treści; otwarcie przywraca tekst do pola. Plus nie pozbawia dostępu do wcześniejszego niewysłanego tekstu. Puste, nieużywane wątki nie zaśmiecają listy.

## R34 — narożniki małych dialogów

Maska ramki telefonu zachowuje własny promień kompaktowego menu i historii. Nie nadaje im zerowych dolnych narożników ekranu mobilnego; pełne panele nadal dopasowuje do ramki. Zmiana jest wizualna, bez ingerencji w cykl rozmów i szkice.


## Wydanie R35, 25.10.2026

Strona pokazu ma krótki tekst po lewej i stale dostępny telefon po prawej. Przyklejony nagłówek, natywny wybór osoby i sprawy oraz skalowanie całego urządzenia do wolnego miejsca. Przewijanie nie uruchamia scen. Osobny tryb prezentacji ma dziesięć plansz i ten sam mockup urządzenia.

Swobodny opis w asystencie trafia do ograniczonego katalogu intencji Bielika. Model proponuje znany ekran; nie wykonuje czynności. Kontekst obejmuje nazwę ekranu, tytuł i ostatnie wypowiedzi tej rozmowy, bez automatycznego odczytu dokumentów.

Transport Ollama/CloudFerro, trwała rezerwacja budżetu AI, oddzielne limity QR/AI/OCR. Odczyt plików na macOS oraz Linuxie z limitami czasu, stron i pikseli. Publiczny wariant działa bez logowania, wyłącza starego agenta i płatny głos.

Materiały: prezentacja 7 i 3 minuty, PDF, jednostronicowy pilotaż, przegląd rzeczywistych ekranów i przygotowany pakiet badania. Badania z ludźmi są planowane. Adapter CloudFerro wymaga konta i próby z rzeczywistym API. DNS należy do MyDevil, żadnego rekordu nie zmieniono.

## Wydanie R36 — opowieść i aplikacja

Strona otwiera się renderem 3D. Wypróbuj odsłania klikalny telefon, cztery osoby i sprawy tej osoby. Wróć do renderu ukrywa urządzenie bez przeładowania jego stanu. Od początku tworzy nowy identyfikator sesji i zaczyna od renderu. Zwykły adres zaczyna od renderu; link z osobą/sprawą lub view=app uruchamia aplikację. view=render ma pierwszeństwo. Wybór historii zmienia ilustrację; aplikacja zmienia się dopiero po jawnej akcji. Nie ma osobnego bloku sterowania alertami w treści strony; alert uruchamia odpowiedni scenariusz, a przy telefonie pojawia się Wyłącz alert.

Publiczne materiały zawierają jedną prezentację, osiem plansz, PDF i PPTX, oraz krótką metrykę. Arkusz badań, wdrożenie i instrukcje dla autora należą do oddzielnego pakietu. Ręczna odpowiedź na pismo otrzymuje tę samą deterministyczną kontrolę kwot co szkic modelu. Długie pliki są odrzucane jawnie; OCR nie ucina ich bez informacji.

## R37 — wspólna nawigacja

Górny pasek strony i dolna nawigacja aplikacji używają wspólnych tokenów z mockup/navigation.css: powierzchnia, tonalny stan wybrany, kolor etykiet, cień i ruch. Logo, Idea, Historie, Projekt, Od początku i Prezentacja tworzą jeden górny pasek. Na mobile sekcje pozostają widoczne w drugim wierszu. ResizeObserver wyznacza rzeczywistą wysokość paska i wolne miejsce dla telefonu. Od początku zachowuje poprzednią sesję pod poprzednim URL i otwiera nową.

## R38 — widoczna opowieść i krótki ekran

Trzy zwarte rozdziały pokazują pismo, kontrolę danych i bezpieczeństwo bez zakładek. Każdy ma własne jawne wejście do aplikacji; przewijanie nie uruchamia scenariusza. Przy powiększeniu aplikacji w krótkim oknie zachowujemy minimalną wysokość interfejsu i przewijanie obszaru, aby treść nie miała zerowej wysokości. Wrapper OCR przekazuje tylko znany własny komunikat z ostatniej linii stderr, a nie diagnostykę systemu.

## R39 — schemat, wyjście z powiększenia i pełne zdania

W alarmie i ilustracji historii lokalny schemat SVG zastępuje osadzoną mapę OSM. Punkt i adres nadal pochodzą z wykazu PSP; zewnętrzne prowadzenie otwiera Google Maps. Schemat nie przedstawia wyznaczonej trasy. Wyłączenie alertu jest przy telefonie po uruchomieniu sceny. Bezpośredni link do sceny alarmu włącza tę scenę.

Po powiększeniu interfejsu Wróć do strony pozostaje w przyklejonym nagłówku, niezależnie od przewijania. Zoom zachowuje proporcje urządzenia i pozwala przewinąć stronę/obszar prezentacji. Przy rzeczywistym Fullscreen etykieta zmienia się na Zakończ pełny ekran. Usunięto dodatkowy Od początku z navbaru: zwykły adres i logo tworzą nowy run; Wróć do renderu zachowuje pracę.

Schema Bielika nie obcina pól na granicy znaków. Kontrolowane pełne zdania mogą przejść drugą redakcję modelu; przy jej błędzie pozostaje pełny, sprawdzony tekst pierwszego wyniku. Terminy i źródła są odrębne. Actual corpus12/12intentów oraz osobne wyjaśnienie zapisane w audycie; nie jest to statystyczna walidacja skuteczności modelu.

## R40 — powrót z osobnego okna i ponowna prezentacja

Osobna aplikacja z demo_run ma teraz ten sam zewnętrzny pasek pokazu i Wróć do strony, kierujące do tej samej osoby i sesji. Pasek nie jest dodawany wewnątrz iframe ani w zwykłej aplikacji bez demo_run. W krótkim powiększonym presenterze początek telefonu jest wyrównany do początku przewijania. Powrót do planszy1 ładuje czysty widok, a nie ostatni modal. Przejście do niealarmowej sceny zamyka pełny alarm; w presenterze wyłącza też pasek. Główne CTA projektu prowadzi prosto do demo. Zamknij demo zastępuje techniczną nazwę powrotu do renderu i zachowuje pracę.

## R41 — skalowanie modalu i tekst po powrocie

Modal alarmu aktualizuje granice po zmianie rozmiaru aplikacji; jego adres i akcja nie pozostają poza pomniejszoną ramką. Powiększony presenter zachowuje proporcje1:2 także320/390px. Aktywny niewysłany tekst Asystenta jest przechowywany w sessionStorage osobno dla osoby/run; przy pełnym przejściu z osobnego okna wraca jako niewysłany szkic. Nie przywracamy wiadomości ani tokenów akcji i nie wysyłamy nic automatycznie.

## R42 — kontrola twierdzeń o decyzji i doręczeniu

Walidator tekstu odrzuca także sformułowania o przyznaniu, zaakceptowaniu, zatwierdzeniu i doręczeniu. Test kontrolny sprawdza pierwszy wynik i drugą redakcję; nie jest obserwacją zachowania rzeczywistego modelu. Kontrola słów, liczb i identyfikatorów źródeł nie jest pełną weryfikacją zgodności znaczenia ze źródłem. Oryginał i kontrola odbiorcy pozostają konieczne. Nie deklarujemy odporności na każdą możliwą parafrazę halucynacji.

## R43 — zgodność czystego eksportu

Kontrola pełnego manifestu ujawniła pomijanie czterech plików wiedzy JSONL przez exporter. Rozszerzenie zostało dołączone do dozwolonych typów; ponowny eksport jest porównywany bajt w bajt z pełnym manifestem. Nie zmienia to interfejsu ani walidatorów modelu z R41/R42.


## R44 — mapa niedostępna i zapis miejsc offline

Brak danych zastępuje wyśrodkowana informacja „Mapa jest teraz niedostępna” i krótka instrukcja wyboru centralnego pomieszczenia bez okien w solidnym budynku. Akcja główna otwiera poradę w aplikacji; ponowienie pobierania jest drugorzędne. Utrata sieci zmienia akcję prowadzenia na lokalną poradę.

Dla znanej okolicy profilu aplikacja zapisuje maksymalnie 20 najbliższych publicznych punktów PSP. Zapis obejmuje adresy, współrzędne, warunki ze zbioru i datę; bez historii GPS. Można go odświeżyć, obejrzeć i usunąć. Bez sieci pozostają adresy, lokalny schemat oraz poradnik. Schemat nie wyznacza trasy; nie powstaje pełna mapa nawigacyjna offline. Zapis publicznych danych okolicy jest niezależny od świeżej sesji pokazu.

## R45 — Start i spokojniejsza prezentacja

Pierwsza zakładka to Start, ponieważ zawiera sprawę wymagającą odpowiedzi i dokumenty. Moje pojazdy używa wspólnego grafitu #394a5e, białego tekstu i lokalnego akcentu pilnego OC. Na podstronach jest jeden zwarty pasek z powrotem, tytułem i asystentem. Tytuł może zawijać się bez nachodzenia na kontrolki.

CTA odpowiedzi pozostaje nad nawigacją. Asystent ma nieprzezroczystą powierzchnię, a tło modalnych paneli jest izolowane od klawiatury i drzewa dostępności, również poza makietą. Liczniki oczekiwania są wizualne, bez odczytu każdej sekundy.

Na stronie pozostaje jedno hasło otwierające. Pozostałe nagłówki nazywają sytuacje i działanie. Trzy rendery pokazują UI bez zewnętrznych haseł. Przewijanie zmienia jedynie ilustrację, nie stan uruchomionej aplikacji. Na małym ekranie klik renderu prowadzi do pełnej aplikacji. Prezentacja i opis projektu używają tej samej treści.

## Strona projektu R58 — wspólny system

Idea, Prezentacja, Technologia i Badania mają jedną warstwę stylów `mockup/site.css`: te same szerokości, odstępy, Instrument Sans dla nagłówków, Inter dla treści, granat `#081b35` i kobalt `#2458d9`. Górny pasek i stopkę zapisuje wspólny generator `deploy/sync_project_chrome.py`; `--check` wykrywa rozjazdy między stronami. `navigation.css` zachowuje tokeny dolnej nawigacji aplikacji i geometrię pokazu. Usunięto z niego oraz z `pokaz.css` zduplikowane reguły nagłówka, stopki i podstawowych działań.

Prezentacja jest galerią z wyborem planszy, przyciskami poprzednia/następna i pełnym ekranem. Publiczne działania obejmują obejrzenie oraz PDF. ZIP z PNG i PPTX pozostają plikami autorskimi, bez odnośników na stronie. Nie ma widocznego przepisu całej prezentacji. Aktualna plansza ma opis dla czytnika ekranu, także z danymi wykresu. Escape zamyka pełny ekran i przywraca fokus.

`materialy.html` zachowuje adres ze zgłoszenia i prezentuje badania: 10 rzeczywistych użytkowników, osobno 10 person syntetycznych, oceny sześciu zadań z wcześniejszej wersji i ilustracje trzech poprawek. Wykres oraz porównania są statycznym HTML-em, bez zależności od pobrania danych po otwarciu strony. Nie są wynikiem ponownego pomiaru po zmianach. Nie dodano fikcyjnych cytatów.


## Strona projektu R59 — jedna opowieść

- `pokaz.html` jest główną prezentacją: hero → trzy sytuacje w aplikacji → technologie i źródła → badania → pierwszy pilotaż.
- Nagłówek prowadzi do sekcji „Jak działa”, „Technologia”, „Badania”; główne CTA otwiera aplikację. To nawigacja po stronie, nie zakładki treści.
- Interaktywny telefon pozostaje przyklejony tylko przy historiach. Po wejściu do aplikacji dostępne są cztery osoby, ich sprawy, reset i powrót do renderu. Na telefonie wejście otwiera pełną aplikację.
- `landing-ui.js` zawiera wyłącznie obsługę aplikacji i jej widoku. Starszy silnik slajdów nie jest ładowany na stronie.
- `presentation.html` zachowuje dawny adres i przekierowuje na landing. PDF pozostaje w stopce; PPTX i ZIP nie są promowane.
- `technology.html` jest szczegółowym dodatkiem o przepływie danych i integracjach; `materialy.html` zawiera pełne wyniki badań i przed / po.
- `site.css` odpowiada za wspólną typografię i nawigację. `landing.css` zawiera układ sekcji, logo i dowodów na głównej stronie.
- Logotypy Bielika, CERT Polska, PSP i IMGW pochodzą z ich oficjalnych stron i są zapisane bez modyfikacji. Pochodzenie i sumy plików: `mockup/assets/technology/SOURCES.json`. Znaki identyfikują model i źródła danych; nie oznaczają partnerstwa.
- Dziesięciu rzeczywistych uczestników i dziesięć person syntetycznych to osobne etapy. Nie przedstawiamy wyników sprzed poprawek jako pomiaru skuteczności obecnej wersji.


## Język strony R60

Opisy technologii mają osobowe formy czasowników i jawnego wykonawcę: „Bielik wyjaśnia pisma”, „CERT wskazuje niebezpieczne domeny”. Nie stosujemy oderwanych bezokoliczników typu „Rozumieć pisma”. Krótkie nazwy kategorii, np. „Badania”, nadal są właściwe.

Przyciski mówią, co użytkownik zrobi: „Otwórz pismo Marty”, „Sprawdź prośbę o dane”, „Zacznij od nowa”. Unikamy technicznych metafor („odpowiedź zna adresata”, „dane zasilają ostrzeżenia”) i niejasnych etykiet. Oryginalne cytaty z pism, kwoty, oceny z badań oraz granice przetwarzania pozostają znaczeniowo niezmienione. Korekta obejmuje landing, opis techniczny, badania oraz kontrolki pokazu; nie obejmuje PDF-a ani pełnej treści wszystkich usług aplikacji.
