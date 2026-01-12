/* globals setTimeout */
/** Wait helper to mimic network latency */
export const wait = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
