import assert from "node:assert/strict";
import { hasForbiddenContact, redactForbiddenContacts } from "./contact-safety";

const forbiddenCases = [
  "+7 999 123-45-67",
  "8 999 123 45 67",
  "8.999.123.45.67",
  "test@example.com",
  "example.ru",
  "https://example.ru",
  "@username",
  "t.me/username",
  "whatsapp",
  "ватсап",
  "вотсап",
  "напишите мне",
  "мой номер",
  "мой сайт",
  "свяжитесь напрямую"
];

for (const value of forbiddenCases) {
  assert.equal(hasForbiddenContact(value), true, `Expected contact filter to catch: ${value}`);
}

const safeLegalText =
  "Работодатель задержал расчет при увольнении. Нужно понять, какие документы подготовить и в какой срок можно обратиться в суд.";

assert.equal(hasForbiddenContact(safeLegalText), false, "Safe legal text should not be marked as a contact attempt.");

const redactionCases = [
  "Позвоните по номеру +7 999 123-45-67",
  "Ответьте на test@example.com",
  "Посмотрите https://example.ru",
  "Напишите мне в t.me/username",
  "Свяжитесь напрямую"
];

for (const value of redactionCases) {
  const redacted = redactForbiddenContacts(value);
  assert.notEqual(redacted, value, `Expected redaction to change: ${value}`);
  assert.match(redacted, /\[.+\]/, `Expected replacement marker in: ${redacted}`);
}
