# Prywatne statystyki

Panel `/admin` i eksport `/admin/export.csv` wymagają istniejącej sesji właściciela. Konto i hasło są poza repozytorium. Nie ma publicznego API odczytu statystyk.

## Definicje

- Odsłona: sygnał JavaScript po otwarciu strony głównej, pełnej aplikacji, badań lub technologii. Odświeżenie to nowa odsłona. Osadzony telefon nie jest dodatkową odsłoną.
- Przeglądarki: dzienna liczba różnych losowych cookie po zgodzie. Cookie wygasa po 24 h. Suma dni nie jest liczbą różnych osób.
- Uruchomienie: pierwsze otwarcie gotowego telefonu w odsłonie albo wejście do pełnej aplikacji. Nie jest ukończeniem sprawy.
- Scenariusz: potwierdzone otwarcie ekranu z jawnego katalogu fikcyjnych spraw.
- Aktywność: suma szacowanych sekund, gdy dokument jest widoczny, a od działania nie minęła minuta. Nie jest średnią długością wizyty ani dokładnym czasem czytania.
- Przewijanie: progi 25, 50, 75, 100%, najwyżej raz na próg w odsłonie. Nie dowodzi przeczytania tekstu.
- Inne działania: asystent, PDF, GitHub, Google Maps, pełne okno, wybór fikcyjnej osoby. To sumy działań, nie konwersja tej samej grupy ludzi.
- Źródła: zamknięte kategorie, np. Challenge, GitHub, Google, brak źródła. Brak widocznego źródła nie dowodzi bezpośredniego wejścia.
- Ekrany: szerokość okna do 760 px, 761–1100 px i ponad 1100 px. Nie rozpoznajemy modelu urządzenia.

## Prywatność i migracja

Istniejące tabele counts i browsers zostają zachowane. Nowe measurements zawiera tylko dzień, godzinę, stronę, miarę, kategorię i sumę. Nie ma identyfikatora osoby ani powiązania działań z cookie. Licznik przeglądarek działa osobno. API działań nie otrzymuje cookie ani nagłówka Referer od klienta. Statystyki nie zawierają IP, pełnych adresów URL, treści rozmów, plików ani współrzędnych.

Panel pokazuje szczegóły z ostatnich 90 dni, również po bezczynnym okresie. Starsze szczegóły są usuwane przy kolejnym zapisie. Dzienne sumy pozostają zachowane. Nowych wymiarów nie da się odtworzyć dla starych wejść.

Blokery, brak JavaScript, odświeżenia, ruch automatyczny i awarie sieci wpływają na wynik. qa=1 pomija pomiar. Testy przeglądarkowe korzystały z odizolowanego stanu z wyraźnie oznaczonymi danymi przykładowymi.

## Ochrona

API odrzuca dodatkowe pola, dowolny tekst i nieznane kategorie. Jedna próbka aktywności ma 1–30 sekund. Limity korzystają z zaufanej konfiguracji proxy; identyfikatory limitu są haszowane wyłącznie w pamięci. CSV wymaga admina, ma no-store i jawne jednostki. Nie eksportuje sygnatur cookie.

Testy obejmują zachowanie starych sum, okresy dat, jednostki, bezczynność 100 dni, odrzucanie dowolnego tekstu, brak cookie w działaniach i ochronę CSV. To sprawdzenie wskazanych reguł, nie pełny audyt bezpieczeństwa.

Właściciel może zaznaczyć „Pomijaj tę przeglądarkę” w panelu. Ustawienie jest lokalne, zatrzymuje nowe sygnały i nie zmienia historycznych sum. Po ponownym włączeniu zliczania otwartą stronę projektu trzeba odświeżyć.
