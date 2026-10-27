# Publikacja mObywatela 2028

Adres: https://mobywatel.mateuszkozlowski.xyz. Aplikacja jest opublikowana na istniejącym MyDevil MD1 (FreeBSD, Python 3.12, Poppler, Tesseract pol+eng). Model Bielik jest udostępniany przez API Public AI. Przy uruchamianiu własnej kopii trzeba skonfigurować własny klucz po stronie serwera. Nie wymaga to dodatkowego serwera GPU.

## Public AI i koszt

Model: speakleash/Bielik-11B-v3.0-Instruct. API: https://api.publicai.co/v1. Dane uwierzytelniające są wyłącznie na backendzie. Dostawca wymaga nagłówka User-Agent, uwzględnionego w adapterze. Dokumentacja: https://platform.publicai.co/docs.

Cennik sprawdzony 26.10.2026: 0,40 USD / milion tokenów wejściowych i 0,40 USD / milion wyjściowych. Nowe konta otrzymują jednorazowo 2 USD kredytu. Plan Free określa limit żądań, nie bezpłatne tokeny bez końca. Źródła: https://platform.publicai.co/models i https://platform.publicai.co/plans.

Domyślne ustawienia są w .env.example: CIVIC_AI_CURRENCY=USD, CIVIC_AI_MONTHLY_LIMIT=1.00, CIVIC_AI_INPUT_PER_M=0.40 i CIVIC_AI_OUTPUT_PER_M=0.40. Rezerwacje kosztów w SQLite są atomowe i trwałe po restarcie. Nieznane zużycie po błędzie lub timeout nie zwalnia rezerwacji. Waluta USD ma oddzielny rejestr od wcześniejszego EUR. Nie kasuj ani nie przywracaj starszej kopii licznika przy aktualizacji. Limit obejmuje wyłącznie wywołania tej aplikacji według wpisanego cennika; nie jest limitem całego konta dostawcy i nie uwzględnia zmian taryfy ani podatków. Nie skonfigurowano automatycznych doładowań.

Wyjaśnienia stałych fikcyjnych pism i zweryfikowane frazy szkiców z załączników przykładowych są pamiętane przez 7 dni. Zmiana treści, modelu, operatora, adresu API lub wersji promptu unieważnia zapis. Równoległe żądania tego samego wariantu współdzielą jedno generowanie. Treści własnych plików nie są zapisywane w tej pamięci.

## Zakres danych

Public AI to zagraniczna usługa badawcza; polskie pochodzenie modelu nie oznacza polskiej infrastruktury. W tym wariancie model wyjaśnia stałe fikcyjne pisma i redaguje z dokumentów przykładowych. Własny plik może być odczytany na MyDevil i porównany przez kod, ale jego tekst nie trafia do Public AI. Odpowiedź z takim plikiem jest składana z danych i pozostaje do edycji. W asystencie opisuj sytuacje bez prawdziwych danych osobowych. Warunki operatora: https://publicai.co/tc.

## MyDevil

Katalog konta: ~/apps/mobywatel2028. releases/r61 zawiera pliki wydania, current wskazuje aktywne wydanie, shared przechowuje runtime.env (600), stan, pamięć i logi. control.sh zarządza supervisorem daemon. Proxy WWW łączy HTTPS z localhost:18790; port aplikacji nie jest publiczny. DNS i pozostałe strony konta pozostają bez zmian.

Przy aktualizacji sprawdź sumy plików i testy przed atomową zmianą dowiązania current. Cofnięcie wydania nie może usuwać shared ani licznika wydatków. Przed cofnięciem do wersji sprzed obsługi Public AI zmień również CIVIC_AI_PROVIDER na operatora obsługiwanego przez poprzednią wersję.

## Inne środowisko

Dockerfile i compose.yml są wariantem Linux. W katalogu deploy skopiuj .env.example do prywatnego .env, ustaw 600, wpisz klucz poza repozytorium i uruchom docker compose -p mobywatel2028 up -d --build. Zachowuj ten sam wolumin app_state przy kolejnych wydaniach. MyDevil nie wymaga Dockera.

Sprawdzenie bez używania modelu: python3 deploy/doctor.py https://mobywatel.mateuszkozlowski.xyz. Nie potwierdza ono generowania. Osobno sprawdź rzeczywistą odpowiedź API na fikcyjnym piśmie i szkicu oraz źródła wyświetlone w interfejsie.

## Pozostali operatorzy

Ollama pozostaje domyślna przy lokalnym uruchomieniu bez ustawionego CIVIC_AI_PROVIDER. CloudFerro wymaga CIVIC_AI_PROVIDER=cloudferro, klucza SHERLOCK_API_KEY, adresu SHERLOCK_BASE_URL i prawidłowych limitów w EUR. Nie stosuj stawek i limitu USD do rozliczeń CloudFerro. Nie kopiuj kluczy między zmiennymi operatorów.
