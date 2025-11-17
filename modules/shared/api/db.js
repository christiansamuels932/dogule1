import { kundenMock, kurseMock, trainerMock, hundeMock } from "./mockData.js";

/** Central mock DB (filled in later steps) */
export const db = {
  kunden: [...kundenMock], // customers
  kurse: [...kurseMock], // courses
  hunde: [...hundeMock], // dogs
  trainer: [...trainerMock], // trainers
};
