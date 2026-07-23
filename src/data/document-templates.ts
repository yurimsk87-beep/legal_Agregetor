import type { DocumentGeneratorTemplate } from "@/lib/types";

export const documentTemplates = [
{
  "slug": "zayavlenie-v-zags",
  "title": "Заявление в орган ЗАГС",
  "description": "Выбор официальной формы заявления в ЗАГС: заключение брака, перемена имени, повторное свидетельство или справка, исправление записи акта гражданского состояния.",
  "documentType": "application",
  "legalReferenceKeys": [
    "sk_11",
    "sk_12",
    "sk_13",
    "sk_14",
    "sk_32",
    "fz143_9",
    "fz143_11",
    "fz143_26",
    "fz143_27",
    "fz143_28",
    "fz143_58",
    "fz143_59",
    "fz143_60",
    "fz143_69",
    "fz143_71",
    "fz143_72",
    "nk_333_26",
    "nk_333_27",
    "nk_333_39",
    "minjust_201_forms",
    "passport_2267_8",
    "sfr_snils_update",
    "fns_inn_same"
  ],
  "baseTemplateNote": "Для обращений в ЗАГС применяются установленные формы. Если точный бланк нельзя безопасно воспроизвести, используйте официальный сервис, МФЦ или бланк органа ЗАГС.",
  "baseFields": [
    {
      "name": "zagsOffice",
      "label": "Орган ЗАГС",
      "type": "text",
      "placeholder": "Например: Отдел ЗАГС Тверского района г. Москвы"
    },
    {
      "name": "applicationDate",
      "label": "Дата заявления",
      "type": "date"
    },
    {
      "name": "applicantName",
      "label": "ФИО заявителя",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "applicantName",
      "label": "ФИО заявителя",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "applicantName",
      "label": "ФИО заявителя",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "applicantBirthDate",
      "label": "Дата рождения заявителя",
      "type": "date",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "applicantBirthDate",
      "label": "Дата рождения заявителя",
      "type": "date",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "applicantBirthDate",
      "label": "Дата рождения лица для справки об отсутствии брака",
      "type": "date",
      "showWhen": {
        "field": "requestedRepeatDocument",
        "equals": "no_marriage_record_reference"
      }
    },
    {
      "name": "applicantBirthPlace",
      "label": "Место рождения заявителя",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "applicantBirthPlace",
      "label": "Место рождения заявителя",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "applicantBirthPlace",
      "label": "Место рождения лица для справки об отсутствии брака",
      "type": "text",
      "showWhen": {
        "field": "requestedRepeatDocument",
        "equals": "no_marriage_record_reference"
      }
    },
    {
      "name": "applicantCitizenship",
      "label": "Гражданство заявителя",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "applicantNationality",
      "label": "Национальность заявителя (по желанию)",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "applicantAddress",
      "label": "Адрес места жительства заявителя",
      "type": "textarea",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "applicantAddress",
      "label": "Адрес места жительства заявителя",
      "type": "textarea",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "applicantAddress",
      "label": "Адрес места жительства заявителя",
      "type": "textarea",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "applicantPhone",
      "label": "Контактный телефон",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "applicantPhone",
      "label": "Контактный телефон",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "applicantPhone",
      "label": "Контактный телефон",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "applicantPhone",
      "label": "Контактный телефон заявителя по форме N 8",
      "type": "text",
      "showWhen": {
        "field": "marriageApplicationMode",
        "equals": "separate_absent"
      }
    },
    {
      "name": "applicantIdentityDocument",
      "label": "Документ, удостоверяющий личность",
      "type": "text",
      "placeholder": "Паспорт гражданина РФ",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "applicantIdentityDocument",
      "label": "Документ, удостоверяющий личность",
      "type": "text",
      "placeholder": "Паспорт гражданина РФ",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "applicantIdentityDocument",
      "label": "Документ, удостоверяющий личность",
      "type": "text",
      "placeholder": "Паспорт гражданина РФ",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "applicantIdentitySeriesNumber",
      "label": "Серия и номер документа",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "applicantIdentitySeriesNumber",
      "label": "Серия и номер документа",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "applicantIdentitySeriesNumber",
      "label": "Серия и номер документа",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "applicantIdentityIssuer",
      "label": "Кем выдан документ",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "applicantIdentityIssuer",
      "label": "Кем выдан документ",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "applicantIdentityIssuer",
      "label": "Кем выдан документ",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "applicantIdentityIssueDate",
      "label": "Дата выдачи документа",
      "type": "date",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "applicantIdentityIssueDate",
      "label": "Дата выдачи документа",
      "type": "date",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "applicantIdentityIssueDate",
      "label": "Дата выдачи документа",
      "type": "date",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "marriageApplicationMode",
      "label": "Тип заявления о браке",
      "type": "select",
      "required": true,
      "options": [
        {
          "value": "joint",
          "label": "Форма N 7 — совместное заявление"
        },
        {
          "value": "separate_absent",
          "label": "Форма N 8 — один заявитель не может лично подать заявление"
        }
      ],
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner1Name",
      "label": "Он: ФИО",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner1BirthDate",
      "label": "Он: дата рождения",
      "type": "date",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner1BirthPlace",
      "label": "Он: место рождения",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner1Citizenship",
      "label": "Он: гражданство",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner1Nationality",
      "label": "Он: национальность (по желанию)",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner1Residence",
      "label": "Он: место жительства",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner1IdentityDocument",
      "label": "Он: документ, удостоверяющий личность",
      "type": "text",
      "placeholder": "Паспорт гражданина РФ",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner1IdentityDetails",
      "label": "Он: серия, номер, кем и когда выдан",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner1MaritalStatus",
      "label": "Он: семейное положение до вступления в брак",
      "type": "select",
      "required": true,
      "options": [
        {
          "value": "never_married",
          "label": "В браке не состоял"
        },
        {
          "value": "divorced",
          "label": "Разведён"
        },
        {
          "value": "widowed",
          "label": "Вдовец"
        },
        {
          "value": "other",
          "label": "Иное"
        }
      ],
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner1PreviousMarriageDoc",
      "label": "Он: документ о прекращении предыдущего брака",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner1RequestedSurname",
      "label": "Фамилия мужа после заключения брака",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner2Name",
      "label": "Она: ФИО",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner2BirthDate",
      "label": "Она: дата рождения",
      "type": "date",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner2BirthPlace",
      "label": "Она: место рождения",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner2Citizenship",
      "label": "Она: гражданство",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner2Nationality",
      "label": "Она: национальность (по желанию)",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner2Residence",
      "label": "Она: место жительства",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner2IdentityDocument",
      "label": "Она: документ, удостоверяющий личность",
      "type": "text",
      "placeholder": "Паспорт гражданина РФ",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner2IdentityDetails",
      "label": "Она: серия, номер, кем и когда выдан",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner2MaritalStatus",
      "label": "Она: семейное положение до вступления в брак",
      "type": "select",
      "required": true,
      "options": [
        {
          "value": "never_married",
          "label": "В браке не состояла"
        },
        {
          "value": "divorced",
          "label": "Разведена"
        },
        {
          "value": "widowed",
          "label": "Вдова"
        },
        {
          "value": "other",
          "label": "Иное"
        }
      ],
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner2PreviousMarriageDoc",
      "label": "Она: документ о прекращении предыдущего брака",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "partner2RequestedSurname",
      "label": "Фамилия жены после заключения брака",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "commonMinorChildrenCount",
      "label": "Количество общих несовершеннолетних детей",
      "type": "number",
      "placeholder": "0",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "requestedRegistrationDate",
      "label": "Желаемая дата регистрации",
      "type": "date",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "requestEarlyRegistration",
      "label": "Нужно зарегистрировать брак раньше месяца или в день обращения",
      "type": "checkbox",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "earlyRegistrationReason",
      "label": "Основание для сокращения срока",
      "type": "select",
      "options": [
        {
          "value": "pregnancy",
          "label": "Беременность"
        },
        {
          "value": "child_birth",
          "label": "Рождение ребёнка"
        },
        {
          "value": "life_threat",
          "label": "Непосредственная угроза жизни одной из сторон"
        },
        {
          "value": "other",
          "label": "Другое особое или уважительное обстоятельство"
        }
      ],
      "showWhen": {
        "field": "requestEarlyRegistration",
        "equals": true
      }
    },
    {
      "name": "earlyRegistrationDocument",
      "label": "Документ, подтверждающий основание",
      "type": "textarea",
      "showWhen": {
        "field": "requestEarlyRegistration",
        "equals": true
      }
    },
    {
      "name": "newSurname",
      "label": "Новая фамилия",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "newName",
      "label": "Новое собственное имя",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "newPatronymic",
      "label": "Новое отчество",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "birthActNumber",
      "label": "Номер записи акта о рождении",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "birthActDate",
      "label": "Дата записи акта о рождении",
      "type": "date",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "birthActOffice",
      "label": "Орган ЗАГС, составивший запись о рождении",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "nameChangeFamilyStatus",
      "label": "Семейное положение",
      "type": "select",
      "required": true,
      "options": [
        {
          "value": "never_married",
          "label": "В браке не состоял(а)"
        },
        {
          "value": "married",
          "label": "Состою в браке"
        },
        {
          "value": "divorced",
          "label": "Разведён(а)"
        },
        {
          "value": "widowed",
          "label": "Вдовец (вдова)"
        },
        {
          "value": "other",
          "label": "Иное"
        }
      ],
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "familyStatusDocument",
      "label": "Документ, подтверждающий семейное положение",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "minorChildrenInfo",
      "label": "Сведения о несовершеннолетних детях",
      "type": "textarea",
      "placeholder": "ФИО, дата рождения, реквизиты записи акта о рождении",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "nameChangeReason",
      "label": "Причина перемены имени",
      "type": "textarea",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "recordsToChange",
      "label": "Какие записи ЗАГС нужно изменить",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "recordsNotToChange",
      "label": "Какие записи не нужно изменять",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "ageGroup",
      "label": "Возраст заявителя",
      "type": "select",
      "required": true,
      "options": [
        {
          "value": "adult",
          "label": "18 лет и старше"
        },
        {
          "value": "minor14to18",
          "label": "От 14 до 18 лет"
        }
      ],
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "minorConsentBasis",
      "label": "Основание для заявления 14-18 лет",
      "type": "select",
      "options": [
        {
          "value": "representatives_consent",
          "label": "Согласие родителей, усыновителей или попечителя"
        },
        {
          "value": "court_decision",
          "label": "Решение суда"
        },
        {
          "value": "full_capacity",
          "label": "Полная дееспособность до 18 лет"
        }
      ],
      "showWhen": {
        "field": "ageGroup",
        "equals": "minor14to18"
      }
    },
    {
      "name": "requestedRepeatDocument",
      "label": "Какой документ нужен",
      "type": "select",
      "required": true,
      "options": [
        {
          "value": "repeat_marriage_certificate",
          "label": "Повторное свидетельство о заключении брака"
        },
        {
          "value": "marriage_reference",
          "label": "Справка о заключении брака"
        },
        {
          "value": "no_marriage_record_reference",
          "label": "Справка об отсутствии факта регистрации заключения брака"
        }
      ],
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "marriageCurrentStatus",
      "label": "Статус брака",
      "type": "select",
      "required": true,
      "options": [
        {
          "value": "active",
          "label": "Брак не расторгнут и не признан недействительным"
        },
        {
          "value": "divorced",
          "label": "Брак расторгнут"
        },
        {
          "value": "invalidated",
          "label": "Брак признан недействительным"
        },
        {
          "value": "unknown",
          "label": "Не знаю / нужно уточнить"
        }
      ],
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "spouseMaleName",
      "label": "Он: ФИО на момент заключения брака",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "spouseFemaleName",
      "label": "Она: ФИО на момент заключения брака",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "marriageActOffice",
      "label": "Орган ЗАГС, зарегистрировавший брак",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "marriageActDate",
      "label": "Дата государственной регистрации",
      "type": "date",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "marriageActNumber",
      "label": "Номер записи акта",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "documentPurpose",
      "label": "Для какой цели нужен документ",
      "type": "textarea",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "absenceCheckPeriod",
      "label": "Период проверки для справки об отсутствии брака",
      "type": "text",
      "placeholder": "Например: с 01.01.2018 по 21.07.2026",
      "showWhen": {
        "field": "requestedRepeatDocument",
        "equals": "no_marriage_record_reference"
      }
    },
    {
      "name": "requestedOtherDetails",
      "label": "Иные сведения, которые нужно указать в справке",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "documentDeliveryOffice",
      "label": "Куда выслать документ",
      "type": "text",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "requesterRelation",
      "label": "Кто обращается",
      "type": "select",
      "options": [
        {
          "value": "self",
          "label": "За себя"
        },
        {
          "value": "deceased_relative",
          "label": "За умершего родственника"
        },
        {
          "value": "representative",
          "label": "По доверенности"
        },
        {
          "value": "other",
          "label": "Иное подтверждённое право"
        }
      ],
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "recordActType",
      "label": "Вид актовой записи",
      "type": "select",
      "required": true,
      "options": [
        {
          "value": "marriage",
          "label": "Заключение брака"
        },
        {
          "value": "divorce",
          "label": "Расторжение брака"
        },
        {
          "value": "birth",
          "label": "Рождение"
        },
        {
          "value": "death",
          "label": "Смерть"
        },
        {
          "value": "name_change",
          "label": "Перемена имени"
        },
        {
          "value": "other",
          "label": "Иная запись"
        }
      ],
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "recordActNumber",
      "label": "Номер записи акта",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "recordActDate",
      "label": "Дата записи акта",
      "type": "date",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "recordActOffice",
      "label": "Орган ЗАГС, составивший запись",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "recordPersonName",
      "label": "В отношении кого составлена запись",
      "type": "text",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "correctionFieldName",
      "label": "Какой реквизит нужно исправить",
      "type": "text",
      "required": true,
      "placeholder": "Например: фамилия, дата рождения, место рождения",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "currentRecordValue",
      "label": "Что указано сейчас",
      "type": "textarea",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "correctRecordValue",
      "label": "Как должно быть указано",
      "type": "textarea",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "correctionReason",
      "label": "Причина исправления или изменения",
      "type": "textarea",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "errorMadeByZags",
      "label": "Считаете, что ошибка допущена работником ЗАГС при регистрации",
      "type": "checkbox",
      "helpText": "Это влияет на возможную льготу по госпошлине. Не отмечайте автоматически, если точно не уверены.",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "affectsThirdPartyRights",
      "label": "Исправление может затронуть права других лиц",
      "type": "checkbox",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "hasWrittenRefusal",
      "label": "Уже есть письменный отказ ЗАГС",
      "type": "checkbox",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "refusalDetails",
      "label": "Реквизиты отказа ЗАГС",
      "type": "textarea",
      "showWhen": {
        "field": "hasWrittenRefusal",
        "equals": true
      }
    },
    {
      "name": "exchangeDocuments",
      "label": "Документы, подлежащие обмену",
      "type": "textarea",
      "placeholder": "Например: свидетельство о заключении брака",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "basisDocuments",
      "label": "Документы, подтверждающие правильные сведения",
      "type": "textarea",
      "required": true,
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    },
    {
      "name": "attachments",
      "label": "Свои приложения (по одному в строке)",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "marriage"
      }
    },
    {
      "name": "attachments",
      "label": "Свои приложения (по одному в строке)",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "name-change"
      }
    },
    {
      "name": "attachments",
      "label": "Свои приложения (по одному в строке)",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "repeat-document"
      }
    },
    {
      "name": "attachments",
      "label": "Свои приложения (по одному в строке)",
      "type": "textarea",
      "showWhen": {
        "field": "zagsProcedure",
        "equals": "record-correction"
      }
    }
  ],
  "variants": [
    {
      "key": "marriage",
      "title": "Заключить брак",
      "description": "Совместное заявление о заключении брака: форма N 7, а если один заявитель не может явиться для подачи — форма N 8.",
      "relatedCategorySlugs": [
        "semya"
      ],
      "relatedProblemSlugs": [
        "brak-zags-i-smena-familii"
      ],
      "legalReferenceKeys": [
        "sk_11",
        "sk_12",
        "sk_13",
        "sk_14",
        "fz143_26",
        "fz143_27",
        "nk_333_26",
        "nk_333_27",
        "minjust_201_forms"
      ],
      "generatedTextHints": [
        "Проверьте отсутствие препятствий к браку по статье 14 СК РФ.",
        "Документы для регистрации раньше месяца или в день подачи должны подтверждать уважительную причину или особые обстоятельства.",
        "Если один заявитель не может явиться для подачи, нужна отдельная форма N 8 с удостоверенной подписью."
      ]
    },
    {
      "key": "name-change",
      "title": "Сменить фамилию или имя",
      "description": "Заявление о перемене имени по форме N 20. Выбор фамилии при заключении брака — отдельная процедура и не требует формы N 20.",
      "relatedProblemSlugs": [
        "brak-zags-i-smena-familii"
      ],
      "legalReferenceKeys": [
        "sk_32",
        "fz143_58",
        "fz143_59",
        "fz143_60",
        "nk_333_26",
        "nk_333_27",
        "passport_2267_8",
        "sfr_snils_update",
        "fns_inn_same",
        "minjust_201_forms"
      ],
      "generatedTextHints": [
        "Для заявителя 14-18 лет требуется согласие родителей, усыновителей или попечителя либо решение суда, если нет полной дееспособности.",
        "После смены ФИО паспорт действует 90 дней.",
        "СНИЛС и ИНН заново не присваиваются: обновляются персональные данные."
      ]
    },
    {
      "key": "repeat-document",
      "title": "Получить свидетельство или справку",
      "description": "Заявление о повторном документе. Для заключения/расторжения брака применяется форма N 26, но свидетельство и справка — разные результаты.",
      "relatedProblemSlugs": [
        "brak-zags-i-smena-familii"
      ],
      "legalReferenceKeys": [
        "fz143_9",
        "nk_333_26",
        "nk_333_27",
        "nk_333_39",
        "minjust_201_forms"
      ],
      "generatedTextHints": [
        "Разведённому лицу не выдаётся повторное свидетельство о заключении брака: нужно просить справку или иной документ о факте регистрации.",
        "Повторное свидетельство стоит 500 руб., справка из архива ЗАГС — 350 руб.",
        "Право на получение документа нужно подтвердить паспортом, полномочиями или доверенностью."
      ]
    },
    {
      "key": "record-correction",
      "title": "Исправить запись ЗАГС",
      "description": "Заявление о внесении исправления или изменения в запись акта гражданского состояния по форме N 23.",
      "relatedProblemSlugs": [
        "brak-zags-i-smena-familii"
      ],
      "legalReferenceKeys": [
        "fz143_69",
        "fz143_71",
        "fz143_72",
        "fz143_11",
        "nk_333_26",
        "nk_333_27",
        "nk_333_39",
        "minjust_201_forms"
      ],
      "generatedTextHints": [
        "ЗАГС исправляет запись при наличии основания и отсутствии спора между заинтересованными лицами.",
        "К заявлению прикладывают свидетельство к обмену и документы, подтверждающие основание исправления.",
        "При отказе запросите письменные причины; при споре может потребоваться судебное решение."
      ]
    }
  ]
}
] as const satisfies DocumentGeneratorTemplate[];

export type DocumentTemplateSlug = (typeof documentTemplates)[number]["slug"];

export function getDocumentTemplate(slug: string) {
  return documentTemplates.find((template) => template.slug === slug) ?? null;
}

export function getDocumentTemplateVariant(template: DocumentGeneratorTemplate, variantKey?: string) {
  if (!variantKey) return null;
  return template.variants.find((variant) => variant.key === variantKey) ?? null;
}
