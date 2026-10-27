/* Katalog i zadania obywatela. */
const CIVIC_SERVICES=[
  {
    "id": "usluga-1",
    "name": "Bezpiecznie w sieci",
    "group": "ochrona",
    "action": "flow",
    "value": "sms",
    "aliases": "sms oszustwo oszustwa link cert phishing wiadomosc wiadomość podejrzana bank policja podszywanie",
    "source": "https://info.mobywatel.gov.pl/uslugi/bezpiecznie-w-sieci"
  },
  {
    "id": "usluga-2",
    "name": "Sprawdź dowód",
    "group": "ochrona",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/sprawdz-dowod"
  },
  {
    "id": "usluga-3",
    "name": "Sprawdź PESEL",
    "group": "ochrona",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/sprawdz-pesel"
  },
  {
    "id": "usluga-4",
    "name": "Zastrzeż dokument",
    "group": "ochrona",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/zastrzez-dokument"
  },
  {
    "id": "usluga-5",
    "name": "Zastrzeż PESEL",
    "group": "ochrona",
    "action": "pesel",
    "value": null,
    "aliases": "kredyt pożyczka pesel zastrzezenie ochrona tozsamosci",
    "source": "https://info.mobywatel.gov.pl/uslugi/zastrzez-pesel"
  },
  {
    "id": "usluga-6",
    "name": "Poradnik bezpieczeństwa",
    "group": "ochrona",
    "action": "safety",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/poradnik-bezpieczenstwa"
  },
  {
    "id": "usluga-7",
    "name": "Szkolenia obronne",
    "group": "ochrona",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/szkolenia-obronne-2"
  },
  {
    "id": "usluga-8",
    "name": "Recepty",
    "group": "zdrowie",
    "action": "model",
    "value": null,
    "aliases": "zdrowie leki apteka kod e recepta e-recepta e-recepty e recepta e recepty recepta",
    "source": "https://info.mobywatel.gov.pl/uslugi/erecepta"
  },
  {
    "id": "usluga-9",
    "name": "Zagrożenia zdrowia publicznego",
    "group": "zdrowie",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/zagrozenia-zdrowia-publicznego"
  },
  {
    "id": "usluga-10",
    "name": "E-wizyta w ZUS",
    "group": "urzad",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/e-wizyta"
  },
  {
    "id": "usluga-11",
    "name": "Księgi wieczyste",
    "group": "urzad",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/ksiegi-wieczyste"
  },
  {
    "id": "usluga-12",
    "name": "Podpis kwalifikowany",
    "group": "urzad",
    "action": "sign",
    "value": "qualified",
    "aliases": "pdf dokument podpisz umowa",
    "source": "https://info.mobywatel.gov.pl/uslugi/podpis-kwalifikowany"
  },
  {
    "id": "usluga-13",
    "name": "Odbiór dowodu",
    "group": "urzad",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/odbior-dowodu"
  },
  {
    "id": "usluga-14",
    "name": "Odbiór paszportu",
    "group": "urzad",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/odbior-paszportu"
  },
  {
    "id": "usluga-15",
    "name": "Podpis osobisty",
    "group": "urzad",
    "action": "sign",
    "value": "personal",
    "aliases": "pdf dokument podpisz nfc edowod",
    "source": "https://info.mobywatel.gov.pl/uslugi/podpisz-dokument"
  },
  {
    "id": "usluga-16",
    "name": "Twoje sprawy",
    "group": "urzad",
    "action": "cases",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/twoje-sprawy"
  },
  {
    "id": "usluga-17",
    "name": "Wybory",
    "group": "urzad",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/wybory"
  },
  {
    "id": "usluga-18",
    "name": "Załatw sprawę",
    "group": "urzad",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/zalatw-sprawe"
  },
  {
    "id": "usluga-19",
    "name": "Historia pojazdu",
    "group": "droga",
    "action": "flow",
    "value": "auto",
    "aliases": "kupuję auto samochód vin przebieg",
    "source": "https://info.mobywatel.gov.pl/uslugi/historia-pojazdu"
  },
  {
    "id": "usluga-20",
    "name": "mStłuczka",
    "group": "droga",
    "action": "flow",
    "value": "stluczka",
    "aliases": "stłuczka kolizja wypadek szkoda oswiadczenie",
    "source": "https://info.mobywatel.gov.pl/uslugi/mstluczka"
  },
  {
    "id": "usluga-21",
    "name": "Punkty karne",
    "group": "droga",
    "action": "doc",
    "value": "pj",
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/punkty-karne"
  },
  {
    "id": "usluga-22",
    "name": "Sprawdź OC",
    "group": "droga",
    "action": "doc",
    "value": "auto",
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/sprawdz-oc"
  },
  {
    "id": "usluga-23",
    "name": "Uprawnienia kierowcy",
    "group": "droga",
    "action": "doc",
    "value": "pj",
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/uprawnienia-kierowcy"
  },
  {
    "id": "usluga-24",
    "name": "ePłatności",
    "group": "oplaty",
    "action": "flow",
    "value": "pay",
    "aliases": "podatek zapłać opłata należności",
    "source": "https://info.mobywatel.gov.pl/uslugi/eplatnosci"
  },
  {
    "id": "usluga-25",
    "name": "Mandaty",
    "group": "oplaty",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/mandaty"
  },
  {
    "id": "usluga-26",
    "name": "Dane w KRS",
    "group": "firma",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/dane-w-krs"
  },
  {
    "id": "usluga-27",
    "name": "Firma",
    "group": "firma",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/firma"
  },
  {
    "id": "usluga-28",
    "name": "Alert powodziowy",
    "group": "otoczenie",
    "action": "safety",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/alert-powodziowy"
  },
  {
    "id": "usluga-29",
    "name": "Jakość powietrza",
    "group": "otoczenie",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/jakosc-powietrza"
  },
  {
    "id": "usluga-30",
    "name": "Naruszenie środowiskowe",
    "group": "otoczenie",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/naruszenie-srodowiskowe"
  },
  {
    "id": "usluga-31",
    "name": "Bezpieczny autobus",
    "group": "droga",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/bezpieczny-autobus"
  },
  {
    "id": "usluga-32",
    "name": "Bilkom",
    "group": "droga",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/bilkom"
  },
  {
    "id": "usluga-33",
    "name": "Małopolska Karta Aglomeracyjna",
    "group": "droga",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/malopolska-karta-aglomeracyjna"
  },
  {
    "id": "usluga-34",
    "name": "Odyseusz",
    "group": "droga",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/odyseusz"
  },
  {
    "id": "usluga-35",
    "name": "Dostęp do internetu",
    "group": "urzad",
    "action": "model",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/dostep-do-internetu"
  },
  {
    "id": "usluga-36",
    "name": "Skrzynka osobista (e-Doręczenia, ePUAP)",
    "group": "urzad",
    "action": "flow",
    "value": "letter",
    "aliases": "pismo urząd list skrzynka doręczenia wiadomosci epuap",
    "source": "https://info.mobywatel.gov.pl/uslugi/skrzynka-osobista"
  },
  {
    "id": "usluga-37",
    "name": "Wirtualny asystent",
    "group": "urzad",
    "action": "assistant",
    "value": null,
    "aliases": "",
    "source": "https://info.mobywatel.gov.pl/uslugi/wirtualny-asystent"
  },
  {
    "id": "utrata",
    "name": "Utrata portfela",
    "group": "ochrona",
    "action": "flow",
    "value": "portfel",
    "aliases": "zgubiłam zgubiłem dokumenty kradzież ukradziono",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "znaleziony",
    "name": "Odnaleziony dokument",
    "group": "ochrona",
    "action": "flow",
    "value": "znaleziony",
    "aliases": "znalazłem znalazłam portfel odblokuj",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "narodziny",
    "name": "Narodziny dziecka",
    "group": "rodzina",
    "action": "flow",
    "value": "dziecko",
    "aliases": "urodzenie noworodek akt usc 800 plus",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "dowod-wniosek",
    "name": "Nowy dowód osobisty",
    "group": "urzad",
    "action": "flow",
    "value": "renew",
    "aliases": "wymiana dowodu kończy ważność wniosek",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "moje-pojazdy",
    "name": "Moje pojazdy",
    "group": "droga",
    "action": "doc",
    "value": "auto",
    "aliases": "samochód auto badanie przegląd",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "kdr",
    "name": "Karta Dużej Rodziny",
    "group": "rodzina",
    "action": "doc",
    "value": "kdr",
    "aliases": "dzieci zniżki rodzic",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "paszport-wniosek",
    "name": "Wniosek o paszport",
    "group": "urzad",
    "action": "model",
    "value": null,
    "aliases": "wyjazd dziecko paszport",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "pcc",
    "name": "Podatek po zakupie auta",
    "group": "oplaty",
    "action": "model",
    "value": null,
    "aliases": "pcc pcc3 kupno samochodu",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "kontakt",
    "name": "Zmiana danych kontaktowych",
    "group": "urzad",
    "action": "model",
    "value": null,
    "aliases": "telefon email adres kontakt",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "emerytura",
    "name": "Informacje emerytalne",
    "group": "urzad",
    "action": "native",
    "tools": [
      "emerytura"
    ],
    "aliases": "emerytura",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "pliki",
    "name": "Moje pliki",
    "group": "urzad",
    "action": "native",
    "tools": [
      "moje_pliki"
    ],
    "aliases": "moje pliki",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "dane",
    "name": "Moje dane",
    "group": "urzad",
    "action": "native",
    "tools": [
      "moje_dane"
    ],
    "aliases": "moje dane",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "sprzedaz",
    "name": "Sprzedaż pojazdu",
    "group": "droga",
    "action": "native",
    "tools": [
      "zglos_zbycie_pojazdu",
      "umowa_kupna_pojazdu"
    ],
    "aliases": "zglos zbycie pojazdu umowa kupna pojazdu",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "szkoda",
    "name": "Zgłoszenie szkody",
    "group": "droga",
    "action": "native",
    "tools": [
      "zglos_szkode"
    ],
    "aliases": "zglos szkode",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "800plus",
    "name": "Świadczenie 800+",
    "group": "rodzina",
    "action": "native",
    "tools": [
      "wniosek_800plus"
    ],
    "aliases": "wniosek 800plus",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "partnerzy",
    "name": "Partnerzy Karty Dużej Rodziny",
    "group": "rodzina",
    "action": "native",
    "tools": [
      "partnerzy_kdr"
    ],
    "aliases": "partnerzy kdr",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "pismo",
    "name": "Napisz pismo",
    "group": "urzad",
    "action": "native",
    "tools": [
      "wyslij_pismo"
    ],
    "aliases": "wyslij pismo",
    "source": "https://mobywatel.ai/prototyp"
  },
  {
    "id": "przypomnienia",
    "name": "Przypomnienia",
    "group": "urzad",
    "action": "reminder",
    "aliases": "przypomnij termin zadanie pamiętać ustaw przypomnienie",
    "source": "https://mobywatel.ai/prototyp"
  }
];
