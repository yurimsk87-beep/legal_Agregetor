const technicalMarkers = [
  "quality gate",
  "canonical",
  "noindex",
  "sitemap",
  "isindexable",
  "seopage",
  "primarykeyword",
  "ready_for_index",
  "seo-",
  "seo ",
  "индексац",
  "индексируем",
  "техническ",
  "фильтр",
  "дубли",
  "дубл",
  "пагинац",
  "краул",
  "mvp",
  "api"
];

export function cleanPublicCopy(text: string, subject = "юридическая помощь") {
  const source = text.trim();
  const paragraphs = source
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter((paragraph) => !hasTechnicalMarker(paragraph));
  const base = paragraphs.length ? paragraphs.join("\n\n") : "";

  return ensureHelpfulDepth(base, subject);
}

export function cleanPublicFaq(question: string, answer: string) {
  const joined = `${question} ${answer}`;
  if (!hasTechnicalMarker(joined)) return { question, answer };

  if (joined.toLowerCase().includes("адвокат")) {
    return {
      question: "Можно ли выбрать адвоката, а не юриста?",
      answer:
        "Да. Если для ситуации важен статус адвоката, например по уголовному делу или судебной защите, выбирайте профили со статусом адвоката и проверенными данными."
    };
  }

  if (joined.toLowerCase().includes("город")) {
    return {
      question: "Что делать, если в моем городе мало специалистов?",
      answer:
        "Задайте вопрос в публичном разделе: после модерации его увидят зарегистрированные юристы, включая специалистов из соседних регионов."
    };
  }

  if (joined.toLowerCase().includes("связки") || joined.toLowerCase().includes("страница")) {
    return {
      question: "Почему здесь показаны именно эти специалисты?",
      answer:
        "Мы учитываем город, услугу, опыт по теме, специализацию и подтвержденные данные профиля. Так пользователь видит юристов, которые ближе к его задаче."
    };
  }

  return {
    question: "Можно ли сузить подбор юристов под мою задачу?",
    answer:
      "Да. Вы можете выбрать город, специализацию, стаж, статус специалиста и изучить ответы юристов по похожим ситуациям."
  };
}

function ensureHelpfulDepth(text: string, subject: string) {
  const intro = text || `${subject} требует оценки фактов, документов, сроков и возможных рисков до выбора способа защиты.`;
  if (intro.length >= 900 && !hasTechnicalMarker(intro)) return intro;

  return `${intro}

На этой странице собрана практическая информация для человека, который хочет решить юридическую проблему без лишних шагов. Здесь можно понять, в каких случаях стоит обратиться к юристу, какие документы лучше подготовить заранее, какие сроки могут быть критичными и от чего зависит стоимость консультации или подготовки документов.

Мы показываем специалистов через платформу: пользователь выбирает город и тему, изучает профили, ответы, публикации и подтвержденный опыт юристов. Личные контакты специалистов не раскрываются публично.

Перед публикацией вопроса полезно кратко записать суть конфликта, даты ключевых событий, суммы требований и список имеющихся документов. Это помогает юристу точнее ответить в публичной ветке.

Если ситуация срочная, проверьте сроки и документы. Вопрос можно отправить на модерацию, чтобы после публикации зарегистрированные юристы смогли дать публичные ответы без раскрытия личных контактов.`;
}

function hasTechnicalMarker(value: string) {
  const lower = value.toLowerCase();
  return technicalMarkers.some((marker) => lower.includes(marker));
}
