import { kundenMock, kurseMock, trainerMock } from "./mockData.js";

/** Central mock DB (filled in later steps) */
export const db = {
  kunden: [...kundenMock], // customers
  kurse: [...kurseMock], // courses
  trainer: [...trainerMock], // trainers
};
