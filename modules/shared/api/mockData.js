export const kundenMock = [
  {
    id: "k1",
    vorname: "Andrea",
    nachname: "Müller",
    email: "andrea.mueller@hundeschule.ch",
    telefon: "+41 44 123 45 67",
    adresse: "Bahnhofstrasse 12, 8001 Zürich",
    notizen: "Bringt Labrador Bello in den Kurs Anfänger 1 mit.",
    createdAt: "2025-01-10T08:30:00.000Z",
    updatedAt: "2025-02-05T17:45:00.000Z",
  },
  {
    id: "k2",
    vorname: "Thomas",
    nachname: "Keller",
    email: "thomas.keller@example.com",
    telefon: "+41 79 555 98 22",
    adresse: "Kirchweg 7, 8400 Winterthur",
    notizen: "Hund Rex reagiert sensibel auf laute Trainingsplätze.",
    createdAt: "2024-12-22T14:15:00.000Z",
    updatedAt: "2025-01-30T09:10:00.000Z",
  },
  {
    id: "k3",
    vorname: "Lea",
    nachname: "Sommer",
    email: "lea.sommer@posteo.de",
    telefon: "+49 30 321 09 87",
    adresse: "Am Viktoriapark 3, 10965 Berlin",
    notizen: "Einzelcoaching mit Hündin Nala, arbeitet an Rückruf.",
    createdAt: "2025-02-01T10:00:00.000Z",
    updatedAt: "2025-02-12T16:20:00.000Z",
  },
];

export const kurseMock = [
  { id: "c1", titel: "Anfänger 1", trainer: "Martina Frei", datum: "2025-12-05" },
  { id: "c2", titel: "Fortgeschrittene", trainer: "Jonas Graf", datum: "2025-12-12" },
  { id: "c3", titel: "Agility Basics", trainer: "Lena Vogt", datum: "2026-01-09" },
];

export const trainerMock = [
  { id: "t1", name: "Martina Frei", spezialisierung: "Welpentraining" },
  { id: "t2", name: "Jonas Graf", spezialisierung: "Agility" },
  { id: "t3", name: "Lena Vogt", spezialisierung: "Alltag + Leine" },
];
