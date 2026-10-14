/**
 * Presentation-only categories. Keep canonical problem and document URLs intact.
 * Every registered route must appear in exactly one group (enforced by tests).
 */
export type LegalRouteGroup = {
  id: string;
  title: string;
  description: string;
  problemSlugs: readonly string[];
};

export const LEGAL_ROUTE_GROUPS: Record<"semya-i-deti" | "trudovoe-pravo", readonly LegalRouteGroup[]> = {
  "semya-i-deti": [
    {
      id: "family-registration",
      title: "Брак, ЗАГС и имущество супругов",
      description: "Заключение и расторжение брака, актовые записи, брачный договор и имущественные споры.",
      problemSlugs: [
        "brak-zags-i-smena-familii",
        "razvod-i-razdel-imushchestva",
        "brachnyy-dogovor",
        "priznanie-braka-nedeystvitelnym",
        "slozhnye-imushchestvennye-spory-suprugov",
        "dokumenty-o-rozhdenii-i-aktovaya-zapis"
      ]
    },
    {
      id: "parents-and-children",
      title: "Дети и родительские права",
      description: "Место жительства и общение с ребёнком, отцовство, воспитание и родительские права.",
      problemSlugs: [
        "roditeli-i-rebenok-posle-razvoda",
        "lishenie-roditelskih-prav",
        "ogranichenie-roditelskih-prav",
        "vosstanovlenie-v-roditelskih-pravah",
        "otmena-ogranicheniya-roditelskih-prav",
        "ustanovlenie-otcovstva",
        "osparivanie-otcovstva",
        "raznoglasiya-roditeley-po-vospitaniyu-i-obrazovaniyu",
        "imya-familiya-otchestvo-rebenka",
        "vyezd-rebenka-za-granitsu",
        "obshchenie-rodstvennikov-s-rebenkom",
        "surrogatnoe-materinstvo-i-proiskhozhdenie-rebenka"
      ]
    },
    {
      id: "family-support",
      title: "Алименты и содержание",
      description: "Взыскание и изменение алиментов, содержание членов семьи и дополнительные расходы.",
      problemSlugs: [
        "alimenty-na-rebenka",
        "alimenty-na-sovershennoletnego-rebenka",
        "prekrashchenie-i-osvobozhdenie-ot-alimentov",
        "alimenty-na-soderzhanie-roditeley",
        "dopolnitelnye-rashody-na-rebenka",
        "soderzhanie-supruga-i-byvshego-supruga"
      ]
    },
    {
      id: "guardianship-and-adoption",
      title: "Опека и усыновление",
      description: "Назначение опеки, усыновление и отмена усыновления — разные процедуры.",
      problemSlugs: [
        "opeka-i-popechitelstvo-nad-rebenkom",
        "usynovlenie-rebenka",
        "otmena-usynovleniya"
      ]
    },
    {
      id: "special-family",
      title: "Особые семейные процедуры",
      description: "Международные семейные споры и эмансипация несовершеннолетних.",
      problemSlugs: [
        "mezhdunarodnye-semeynye-spory",
        "emansipatsiya-nesovershennoletnego"
      ]
    }
  ],
  "trudovoe-pravo": [
    {
      id: "termination",
      title: "Увольнение и окончательный расчёт",
      description: "Основания увольнения, сроки предупреждения, выплаты и документы.",
      problemSlugs: [
        "uvolnenie-po-iniciative-rabotodatelya",
        "uvolnenie-po-sobstvennomu-zhelaniyu",
        "srok-preduprezhdeniya-pri-uvolnenii",
        "vyplaty-pri-uvolnenii"
      ]
    },
    {
      id: "wages",
      title: "Заработная плата",
      description: "Задержка зарплаты, неполная выплата, начисления и удержания.",
      problemSlugs: ["zarabotnaya-plata"]
    },
    {
      id: "employment",
      title: "Трудовой договор и условия работы",
      description: "Оформление, фактические трудовые отношения и изменение условий.",
      problemSlugs: [
        "trudovoy-dogovor",
        "neoformlennye-trudovye-otnosheniya",
        "perevod-i-izmenenie-usloviy-truda",
        "prava-i-obyazannosti-rabotodatelya"
      ]
    },
    {
      id: "leave-and-time",
      title: "Отпуск, больничный и рабочее время",
      description: "Ежегодные отпуска, уход за ребёнком, больничные и режим работы.",
      problemSlugs: [
        "ezhegodnyy-otpusk",
        "otpusk-po-uhodu-za-rebenkom",
        "bolnichnyy",
        "rabochee-vremya"
      ]
    },
    {
      id: "protection",
      title: "Защита прав работника",
      description: "Требование работодателю, инспекция, комиссия по трудовым спорам или суд.",
      problemSlugs: ["spory-s-rabotodatelem"]
    }
  ]
};

export function getLegalRouteGroups(categorySlug: string): readonly LegalRouteGroup[] {
  return LEGAL_ROUTE_GROUPS[categorySlug as keyof typeof LEGAL_ROUTE_GROUPS] ?? [];
}
