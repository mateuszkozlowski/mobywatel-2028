/* Schematy fikcyjnych usług, generowane z serwer/narzedzia.py. Przypomnienia mają własny lokalny interfejs. */
const CIVIC_TOOL_SCHEMAS={
  "gdzie_zalatwic": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "sprawa": {
          "type": "string"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "sprawa"
      ]
    }
  },
  "karta_uslugi": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "zapytanie": {
          "type": "string",
          "description": "nazwa sprawy po polsku, np. wniosek o dowód osobisty, zameldowanie, rejestracja pojazdu używanego"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "zapytanie"
      ]
    }
  },
  "do_zalatwienia": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "moje_dane": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "moje_dokumenty": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "status_pesel": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "z_historia": {
          "type": "boolean",
          "description": "domyślnie true: z historią zmian i weryfikacji"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "sprawdz_pesel_osoby": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pesel": {
          "type": "string"
        },
        "numer_dokumentu": {
          "type": "string",
          "description": "seria i numer ostatniego dowodu osobistego lub paszportu tej osoby"
        },
        "cel": {
          "type": "string",
          "description": "np. zawarcie umowy najmu"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "pesel",
        "numer_dokumentu",
        "cel"
      ]
    }
  },
  "sprawdz_dowod": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "numer": {
          "type": "string"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "numer"
      ]
    }
  },
  "twoje_sprawy": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "skrzynka": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "moje_pliki": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "szukaj": {
          "type": "string",
          "description": "słowa kluczowe"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "naleznosci": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "emerytura": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "wiek_przejscia": {
          "type": "integer"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "terminy_zus": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "temat": {
          "type": "string",
          "description": "np. zasiłek macierzyński, emerytura, 800+"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "temat"
      ]
    }
  },
  "moje_pojazdy": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "historia_wlasnego_pojazdu": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "nr_rejestracyjny": {
          "type": "string"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "nr_rejestracyjny"
      ]
    }
  },
  "punkty_karne": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "historia_pojazdu": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "nr_rejestracyjny": {
          "type": "string"
        },
        "vin": {
          "type": "string"
        },
        "data_pierwszej_rejestracji": {
          "type": "string",
          "description": "DD.MM.RRRR"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "nr_rejestracyjny",
        "vin",
        "data_pierwszej_rejestracji"
      ]
    }
  },
  "sprawdz_oc": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "nr_rejestracyjny": {
          "type": "string"
        },
        "vin": {
          "type": "string"
        },
        "numer_polisy": {
          "type": "string"
        },
        "data_zdarzenia": {
          "type": "string",
          "description": "DD.MM.RRRR lub RRRR-MM-DD; domyślnie dziś"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "uprawnienia_kierowcy": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "imie": {
          "type": "string"
        },
        "nazwisko": {
          "type": "string"
        },
        "numer_blankietu": {
          "type": "string"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "imie",
        "nazwisko",
        "numer_blankietu"
      ]
    }
  },
  "bezpieczny_autobus": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "nr_rejestracyjny": {
          "type": "string"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "nr_rejestracyjny"
      ]
    }
  },
  "recepty": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "osoba": {
          "type": "string",
          "description": "np. Zofia; puste = wszystkie"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "jakosc_powietrza": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "miejscowosc": {
          "type": "string"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "szkolenia_obronne": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "rodzaj": {
          "type": "string",
          "enum": [
            "podstawowy",
            "przetrwania",
            "medyczny",
            "cyberhigiena"
          ]
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "poradnik": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "temat": {
          "type": "string"
        },
        "liczba_osob": {
          "type": "integer"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "informacje_o_kraju": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "kraj": {
          "type": "string"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "kraj"
      ]
    }
  },
  "wybory": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "firma": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "szukaj_pkd": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "opis": {
          "type": "string"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "opis"
      ]
    }
  },
  "ksiegi_wieczyste": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "partnerzy_kdr": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "kategoria": {
          "type": "string"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "analizuj_wiadomosc": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "tresc": {
          "type": "string"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "tresc"
      ]
    }
  },
  "bilety": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "odbior_dowodu": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "numer_wniosku": {
          "type": "string"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "numer_wniosku"
      ]
    }
  },
  "odbior_paszportu": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "numer_wniosku": {
          "type": "string"
        },
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": [
        "numer_wniosku"
      ]
    }
  },
  "dane_krs": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "mka": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "mandaty": {
    "type": "read",
    "schema": {
      "type": "object",
      "properties": {
        "pokaz_karte": {
          "type": "boolean",
          "description": "domyślnie true: pokazuje kartę z danymi; false, gdy dane są potrzebne tylko Tobie"
        }
      },
      "required": []
    }
  },
  "zastrzez_dokumenty": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "dokumenty": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "dowod",
              "paszport",
              "prawo_jazdy"
            ]
          }
        },
        "uniewaznij": {
          "type": "boolean",
          "description": "true tylko, gdy użytkowniczka wie, że dokument przepadł lub został skradziony"
        }
      },
      "required": [
        "dokumenty"
      ]
    }
  },
  "zawies_dowod": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  "odwies_dowod": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  "cofnij_zastrzezenie_dokumentu": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "dokument": {
          "type": "string",
          "enum": [
            "dowod",
            "paszport",
            "prawo_jazdy"
          ]
        }
      },
      "required": [
        "dokument"
      ]
    }
  },
  "zastrzez_pesel": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  "cofnij_zastrzezenie_pesel": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "do_kiedy": {
          "type": "string",
          "description": "DD.MM.RRRR, GG:MM; puste = na stałe"
        }
      },
      "required": []
    }
  },
  "wniosek_dowod": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "powod": {
          "type": "string",
          "enum": [
            "uplyw_waznosci",
            "utrata",
            "zmiana_danych",
            "uszkodzenie"
          ]
        },
        "osoba": {
          "type": "string",
          "description": "puste = ja; imię dziecka"
        },
        "miejsce_odbioru": {
          "type": "string",
          "description": "urząd do odcisków i odbioru; domyślnie najbliżej miejsca zamieszkania"
        }
      },
      "required": [
        "powod"
      ]
    }
  },
  "wniosek_paszport": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "osoba": {
          "type": "string",
          "description": "imię dziecka"
        },
        "miejsce_odbioru": {
          "type": "string"
        }
      },
      "required": [
        "osoba"
      ]
    }
  },
  "zglos_urodzenie": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "imie": {
          "type": "string",
          "description": "pełna forma, nie zdrobnienie"
        },
        "drugie_imie": {
          "type": "string"
        },
        "plec": {
          "type": "string",
          "enum": [
            "K",
            "M"
          ]
        },
        "miejsce_urodzenia": {
          "type": "string"
        },
        "odpis": {
          "type": "string",
          "enum": [
            "elektronicznie",
            "osobiście",
            "pocztą"
          ]
        }
      },
      "required": [
        "imie",
        "plec"
      ]
    }
  },
  "wniosek_800plus": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "dziecko": {
          "type": "string"
        },
        "pesel_dziecka": {
          "type": "string"
        },
        "data_urodzenia": {
          "type": "string"
        },
        "sprawa_urodzenia": {
          "type": "string"
        }
      },
      "required": [
        "dziecko"
      ]
    }
  },
  "wyslij_pismo": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "adresat": {
          "type": "string"
        },
        "temat": {
          "type": "string"
        },
        "tresc": {
          "type": "string",
          "description": "pełna treść pisma"
        },
        "zalaczniki": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "required": [
        "adresat",
        "temat",
        "tresc"
      ]
    }
  },
  "podpisz_dokument": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "dokument": {
          "type": "string"
        },
        "rodzaj": {
          "type": "string",
          "enum": [
            "osobisty",
            "kwalifikowany"
          ]
        }
      },
      "required": [
        "dokument"
      ]
    }
  },
  "zamow_odpis_kw": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "ksiega": {
          "type": "string"
        },
        "rodzaj": {
          "type": "string",
          "enum": [
            "odpis_zwykly",
            "odpis_zupelny",
            "wyciag",
            "zaswiadczenie_o_zamknieciu"
          ]
        },
        "dzial": {
          "type": "string",
          "enum": [
            "I",
            "II",
            "III",
            "IV"
          ]
        }
      },
      "required": [
        "ksiega",
        "rodzaj"
      ]
    }
  },
  "zaplac": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "pozycje": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "metoda": {
          "type": "string",
          "enum": [
            "BLIK",
            "karta",
            "Apple Pay",
            "Google Pay"
          ]
        }
      },
      "required": [
        "pozycje"
      ]
    }
  },
  "umow_ewizyte_zus": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "temat": {
          "type": "string"
        },
        "termin": {
          "type": "string"
        }
      },
      "required": [
        "temat",
        "termin"
      ]
    }
  },
  "zglos_zbycie_pojazdu": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "nabywca": {
          "type": "string"
        },
        "data": {
          "type": "string",
          "description": "data umowy, DD.MM.RRRR"
        },
        "nr_rejestracyjny": {
          "type": "string"
        }
      },
      "required": [
        "nabywca"
      ]
    }
  },
  "umowa_kupna_pojazdu": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "pojazd": {
          "type": "string"
        },
        "sprzedajacy": {
          "type": "string"
        },
        "cena": {
          "type": "string"
        }
      },
      "required": [
        "pojazd",
        "cena"
      ]
    }
  },
  "oswiadczenie_kolizji": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "sprawca": {
          "type": "string",
          "enum": [
            "ja",
            "druga_strona"
          ]
        },
        "okolicznosci": {
          "type": "string"
        },
        "miejsce": {
          "type": "string"
        }
      },
      "required": [
        "sprawca",
        "okolicznosci"
      ]
    }
  },
  "zglos_szkode": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "ubezpieczyciel": {
          "type": "string"
        },
        "oswiadczenie": {
          "type": "string"
        },
        "opis": {
          "type": "string"
        },
        "zdjecia": {
          "type": "string"
        }
      },
      "required": [
        "ubezpieczyciel"
      ]
    }
  },
  "zloz_pcc3": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "pojazd": {
          "type": "string"
        },
        "cena": {
          "type": "number",
          "description": "wartość rynkowa pojazdu ustalona przez użytkownika"
        },
        "cena_umowna": {
          "type": "number"
        },
        "data_umowy": {
          "type": "string"
        },
        "sprzedajacy": {
          "type": "string"
        },
        "nabywca": {
          "type": "string"
        }
      },
      "required": [
        "pojazd",
        "cena"
      ]
    }
  },
  "zglos_incydent_cert": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "kategoria": {
          "type": "string",
          "enum": [
            "Złośliwa strona internetowa",
            "Podejrzana wiadomość SMS",
            "Podejrzana wiadomość e-mail",
            "Oszustwo",
            "Inne"
          ]
        },
        "adres": {
          "type": "string",
          "description": "adres strony, jeśli jest"
        },
        "skad": {
          "type": "string",
          "description": "np. link z SMS-a"
        },
        "opis": {
          "type": "string"
        }
      },
      "required": [
        "kategoria",
        "opis"
      ]
    }
  },
  "zgloszenie": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "instytucja": {
          "type": "string",
          "enum": [
            "sanepid",
            "gios",
            "internet"
          ]
        },
        "kategoria": {
          "type": "string"
        },
        "miejsce": {
          "type": "string",
          "description": "z jej słów; GPS tylko, gdy mówi o miejscu, w którym jest teraz"
        },
        "opis": {
          "type": "string"
        }
      },
      "required": [
        "instytucja",
        "opis"
      ]
    }
  },
  "zapisz_na_szkolenie": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "kurs_id": {
          "type": "string"
        }
      },
      "required": [
        "kurs_id"
      ]
    }
  },
  "zglos_podroz": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "kraj": {
          "type": "string"
        },
        "od": {
          "type": "string"
        },
        "do": {
          "type": "string"
        },
        "osoby": {
          "type": "array",
          "description": "dzieci jadące z Tobą; dorośli zgłaszają się sami",
          "items": {
            "type": "string"
          }
        }
      },
      "required": [
        "kraj"
      ]
    }
  },
  "zmien_miejsce_glosowania": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "rodzaj": {
          "type": "string",
          "enum": [
            "staly",
            "jednorazowy"
          ]
        },
        "miejscowosc": {
          "type": "string"
        },
        "adres": {
          "type": "string",
          "description": "adres zamieszkania, przy rodzaj=staly"
        }
      },
      "required": [
        "rodzaj",
        "miejscowosc"
      ]
    }
  },
  "zaloz_firme": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "nazwa": {
          "type": "string",
          "description": "nazwa podana przez użytkowniczkę, z jej imieniem i nazwiskiem"
        },
        "pkd": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "data_rozpoczecia": {
          "type": "string",
          "description": "DD.MM.RRRR"
        },
        "forma_opodatkowania": {
          "type": "string",
          "enum": [
            "skala",
            "liniowy",
            "ryczałt"
          ]
        }
      },
      "required": [
        "nazwa",
        "pkd",
        "data_rozpoczecia",
        "forma_opodatkowania"
      ]
    }
  },
  "aktualizuj_dane_kontaktowe": {
    "type": "action",
    "schema": {
      "type": "object",
      "properties": {
        "telefon": {
          "type": "string"
        },
        "email": {
          "type": "string"
        },
        "kod": {
          "type": "string",
          "description": "kod z SMS-a lub e-maila, gdy już go dostała"
        }
      },
      "required": []
    }
  }
};
