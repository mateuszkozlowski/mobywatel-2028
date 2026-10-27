# Zakres weryfikacji

Wydanie publiczne R55 miało 65 zaliczonych testów backendu i próby przeglądarkowe. Nie jest to certyfikacja dostępności, test penetracyjny ani potwierdzenie wszystkich urządzeń mobilnych. Szczegółowe asercje znajdują się w katalogu tests/.

W aktualnej lokalnej iteracji R56 zmieniono materiały i wejścia ze strony projektu, bez zmiany modelu, reguł podatkowych lub funkcji urzędowych. Prezentacja ma 11 PNG i pełną treść w HTML. PNG są ilustracjami, a rendery nie są dowodem wykonania API.

10 użytkowników i 10 person syntetycznych nie tworzy jednej próby. Dostępna tabela pochodzi z opracowania notatek i dotyczy wcześniejszej wersji. Nie podano dat sesji, surowych pomiarów ani cytatów. Nie publikujemy nagrań ani danych uczestników.

Należy osobno potwierdzać: działanie UI, wynik kodu, odpowiedź modelu, jakość merytoryczną i efekt u ludzi. Zgodne liczby oraz wystąpienie nazw dokumentów nie dowodzą poprawności znaczenia wyjaśnienia.


## Wydanie strony i repozytorium R61

27.10.2026 przed publikacją lokalnie ponownie przeszło 65 testów backendu. Sprawdzono składnię 58 plików JavaScript oraz zgodność nagłówków i stopek z generatorem. Korekta języka obejmuje stronę główną, technologię, badania oraz kontrolki pokazu. Układ tych trzech stron sprawdzono przy 320, 390 i 1440 px.

Pakiet do pierwszej publikacji GitHub jest osobnym, oczyszczonym drzewem kodu. Historia tego repozytorium nie zawiera lokalnych archiwów, plików PPTX, danych administratora ani sekretów. Starszy lokalny pakiet i jego historia pozostają zachowane. Wynik GitHub Actions należy sprawdzić osobno po pierwszym pushu.


## Analityka i korekty układu R62

Rozbudowano prywatny panel, agregaty działań i eksport CSV. Dodano opcję pomijania własnej przeglądarki. Testy sprawdzają migrację sum, granice okresów, walidację danych, prywatność i ochronę CSV. Pełen zestaw ma 78 testów. Definicje: docs/ANALYTICS.md.

W kopii testowej potwierdzono zliczenie uruchomienia pokazu, wyboru Jana i jego scenariusza, działanie filtra dat oraz brak nowej odsłony po włączeniu pomijania przeglądarki. Nie dodawano syntetycznych zdarzeń do publicznych statystyk.

Przy 320 / 390 / 1440 px sprawdzono stronę, technologię i badania: bez poziomego przepełnienia. Liczby 10 w badaniach wyrównano. Dwa nagłówki technologii skrócono, a tytuł strony technicznej mieści się w dwóch wierszach na małych ekranach. Panel sprawdzono przy 320 / 390 / 1360 px; wykres godzin może przewijać się w swojej sekcji na telefonie.
