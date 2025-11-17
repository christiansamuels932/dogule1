import { kundenMock, kurseMock, trainerMock, hundeMock, finanzenMock } from "./mockData.js";

/** Central mock DB (filled in later steps) */
export const db = {
  kunden: [...kundenMock], // customers
  kurse: [...kurseMock], // courses
  hunde: [...hundeMock], // dogs
  finanzen: [...finanzenMock], // finance entries
  trainer: [...trainerMock], // trainers
};
