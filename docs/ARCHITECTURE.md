# Architektura i przepływ danych

## Główne ścieżki

| Wejście | Przetwarzanie | Wynik | Granica |
| --- | --- | --- | --- |
| Fikcyjne pismo z profilu | Python → Bielik przez Public AI → ograniczenia formatu i wybrane reguły | Wyjaśnienie oraz źródła do porównania | Reguły nie potwierdzają pełnej zgodności semantycznej |
| Przykładowe załączniki | Dane scenariusza → obliczenia Decimal; model proponuje wybrane fragmenty szkicu | Porównanie kwot i przegląd odpowiedzi | Nie jest to ocena prawa do ulgi |
| Własny załącznik | Przesłanie na serwer → OCR/odczyt → reguły i szablon | Tekst i porównanie | W konfiguracji Public AI treść pliku omija model |
| Rozmowa | Wiadomość, kontekst ekranu i część historii → API → dozwolona intencja | Znany ekran lub wyjaśnienie | Rozmowa może opuścić urządzenie |
| Podejrzany adres | Serwer porównuje domenę z listą CERT | Wynik i źródło | Nie otwieramy podejrzanej strony; brak wpisu nie oznacza bezpieczeństwa |
| Miejsce schronienia | Wykaz PSP, obliczenia odległości i mapa | Punkt i prowadzenie | Brak potwierdzenia bieżącej dostępności |

## Gdzie jest implementacja

- `serwer/polish_ai.py`: wywołania modelu, kontrola wybranych danych i cache.
- `serwer/assistant_router.py`: mapowanie potrzeby i kontekstu na dozwolone funkcje.
- `serwer/resource_policy.py`: limit, rezerwacja kosztu i ograniczanie liczby żądań.
- `serwer/cert_feed.py`, `alerts.py`, `shelters.py`: publiczne źródła i stan odświeżenia.
- `mockup/reply-ui.js`, `local-files.js`, `life-ui.js`: szkic, wybór i lokalny zapis pracy.
- `serwer/scenario_clock.py`, `mockup/scenario-clock.js`: wspólny kalendarz fikcyjnych dat scenariusza.

## Koszt i awarie

Publiczny pokaz ma trwały limit aplikacji 1 USD/miesiąc UTC i rezerwuje koszt przed wywołaniem. Cache wybranych wyników działa maksymalnie 7 dni. Zmiana źródła, modelu albo wersji promptu zmienia klucz. Szybkość odczytu z cache nie jest czasem nowej generacji. Limit nie jest gwarancją ceny operatora ani wyceną wdrożenia krajowego.

Przy błędzie modelu oryginał pisma i formularze pozostają dostępne. Metoda przygotowania szkicu jest rozróżniana w danych odpowiedzi. Publiczne źródła mogą być nieaktualne po nieudanym odświeżeniu.

## Do rzeczywistego wdrożenia

Potrzebne są umowy i uprawnienia do dostępu do rejestrów, podpisu i doręczeń, bezpieczny obieg załączników oraz ocena jakości na konkretnym typie pisma. Proponowany pierwszy pilotaż obejmuje jeden urząd i jeden typ pisma przez trzy miesiące. Miary należy uzgodnić przed próbą: zrozumienie wymagań, kompletność odpowiedzi, przeoczone błędy wyjaśnienia.

## Źródła

- [Karta Bielika](https://huggingface.co/speakleash/Bielik-11B-v3.0-Instruct)
- [Public AI](https://platform.publicai.co/models)
- [CERT Polska](https://cert.pl/lista-ostrzezen/)
- [IMGW](https://danepubliczne.imgw.pl/)
- [PSP — dataset](https://dane.gov.pl/pl/dataset/28058,punkty-schronienia-w-polsce)
- [PSP — używany CSV](https://gdziesieukryc.pl/PS_XML/punkty_schronienia.csv)
