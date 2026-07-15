const contactPatterns = [
  /\+?\d[\d\s().-]{8,}\d/g,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
  /https?:\/\/[^\s)]+/gi,
  /\b(?:t\.me|wa\.me|telegram\.me|vk\.com|ok\.ru|instagram\.com|facebook\.com|linkedin\.com)\/[^\s)]+/gi,
  /\b[a-z0-9-]+\.(?:ru|рф|com|net|org|io|me|pro|site|online|law|legal)\b/gi,
  /@[a-z0-9_]{4,}/gi,
  /(?:пишите\s+мне|напишите\s+мне|звоните|мой\s+номер|мой\s+сайт|мой\s+телефон|мой\s+telegram|мой\s+телеграм|мой\s+whatsapp|мой\s+ватсап|мой\s+вотсап|свяжитесь\s+напрямую|tg|wapp|whatsapp|telegram|телеграм|ватсап|вотсап)/giu,
  /\b(?:\u043f\u0438\u0448\u0438\u0442\u0435\s+\u043c\u043d\u0435|\u0437\u0432\u043e\u043d\u0438\u0442\u0435|\u043c\u043e\u0439\s+\u043d\u043e\u043c\u0435\u0440|\u043c\u043e\u0439\s+\u0441\u0430\u0439\u0442|\u043c\u043e\u0439\s+telegram|\u043c\u043e\u0439\s+\u0442\u0435\u043b\u0435\u0433\u0440\u0430\u043c|\u043c\u043e\u0439\s+whatsapp)\b/gi,
  /\b(?:пишите\s+мне|звоните|мой\s+номер|мой\s+сайт|мой\s+телефон|мой\s+telegram|мой\s+телеграм|мой\s+whatsapp|мой\s+ватсап|свяжитесь\s+напрямую|контакты\s+в\s+профиле|tg|wapp|whatsapp|telegram|телеграм|ватсап)\b/gi
];

export function hasForbiddenContact(value?: string | null) {
  if (!value) return false;
  return contactPatterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}

export function redactForbiddenContacts(value?: string | null) {
  if (!value) return "";
  return contactPatterns.reduce((text, pattern) => text.replace(pattern, "[контакт скрыт платформой]"), value);
}
