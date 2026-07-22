import assert from "node:assert/strict";
import type { DocumentGeneratorVariant } from "./types";
import { buildZagsApplicationText, getRepeatDocumentType, getZagsPaymentInfo } from "../components/documents/DocumentGeneratorForm";

type TestValues = Record<string, string | boolean>;

const marriageVariant: DocumentGeneratorVariant = { key: "marriage", title: "Брак", description: "" };
const nameChangeVariant: DocumentGeneratorVariant = { key: "name-change", title: "Перемена имени", description: "" };
const repeatDocumentVariant: DocumentGeneratorVariant = { key: "repeat-document", title: "Повторный документ", description: "" };
const correctionVariant: DocumentGeneratorVariant = { key: "record-correction", title: "Исправление записи", description: "" };

const baseApplicant: TestValues = {
  zagsOffice: "Отдел ЗАГС",
  applicantName: "Иванова Мария Петровна",
  applicantBirthDate: "1990-01-02",
  applicantBirthPlace: "Москва",
  applicantCitizenship: "Российская Федерация",
  applicantAddress: "г. Москва",
  applicantPhone: "+7 000 000-00-00",
  applicantIdentityDocument: "паспорт гражданина РФ",
  applicantIdentitySeriesNumber: "0000 000000",
  applicantIdentityIssuer: "ОВД",
  applicantIdentityIssueDate: "2020-01-02"
};

const marriageValues: TestValues = {
  ...baseApplicant,
  marriageApplicationMode: "joint",
  partner1Name: "Иванов Иван Иванович",
  partner1BirthDate: "1990-01-01",
  partner1BirthPlace: "Москва",
  partner1Citizenship: "Российская Федерация",
  partner1Residence: "г. Москва",
  partner1IdentityDocument: "паспорт гражданина РФ",
  partner1IdentityDetails: "0000 000000, выдан ОВД",
  partner1MaritalStatus: "never_married",
  partner1RequestedSurname: "Иванов",
  partner2Name: "Петрова Мария Петровна",
  partner2BirthDate: "1991-02-03",
  partner2BirthPlace: "Москва",
  partner2Citizenship: "Российская Федерация",
  partner2Residence: "г. Москва",
  partner2IdentityDocument: "паспорт гражданина РФ",
  partner2IdentityDetails: "1111 111111, выдан ОВД",
  partner2MaritalStatus: "never_married",
  partner2RequestedSurname: "Иванова"
};

{
  const text = buildZagsApplicationText(marriageVariant, marriageValues);
  assert.match(text, /Форма N 7/, "joint marriage application must use form 7");
  assert.deepEqual(getZagsPaymentInfo(marriageVariant, {}), ["350 руб. за государственную регистрацию заключения брака, включая выдачу свидетельства. Отдельная федеральная пошлина за сокращение срока не указана."]);
}

{
  const text = buildZagsApplicationText(marriageVariant, { ...marriageValues, marriageApplicationMode: "separate_absent" });
  assert.match(text, /Форма N 8/, "separate absent applicant must use form 8");
  assert.match(text, /форме N 7 и это отдельное заявление по форме N 8/i, "form 8 must mention paired form 7 submission");
}

{
  const text = buildZagsApplicationText(nameChangeVariant, {
    ...baseApplicant,
    newSurname: "Сидорова",
    newName: "Мария",
    newPatronymic: "Петровна",
    birthActNumber: "123",
    birthActDate: "1990-01-05",
    birthActOffice: "Отдел ЗАГС",
    nameChangeFamilyStatus: "divorced",
    nameChangeReason: "возвращение добрачной фамилии",
    ageGroup: "minor14to18",
    minorConsentBasis: "representatives_consent"
  });
  assert.match(text, /Форма N 20/, "name change must use form 20");
  assert.deepEqual(getZagsPaymentInfo(nameChangeVariant, {}), ["5000 руб. за государственную регистрацию перемены имени, включая выдачу свидетельства о перемене имени."]);
}

{
  assert.equal(
    getRepeatDocumentType({ requestedRepeatDocument: "repeat_marriage_certificate", marriageCurrentStatus: "divorced" }),
    "marriage_reference",
    "divorced applicant must not be routed to repeated marriage certificate"
  );
  const text = buildZagsApplicationText(repeatDocumentVariant, {
    ...baseApplicant,
    requestedRepeatDocument: "repeat_marriage_certificate",
    marriageCurrentStatus: "divorced",
    spouseMaleName: "Иванов Иван Иванович",
    spouseFemaleName: "Петрова Мария Петровна",
    documentPurpose: "для подтверждения факта регистрации брака"
  });
  assert.match(text, /Форма N 26/, "marriage reference must use form 26");
  assert.match(text, /\[x\] справку о заключении брака/, "terminated marriage must switch to reference");
}

{
  const text = buildZagsApplicationText(repeatDocumentVariant, {
    ...baseApplicant,
    requestedRepeatDocument: "no_marriage_record_reference",
    documentPurpose: "для подачи документов",
    absenceCheckPeriod: "с 01.01.2020 по 21.07.2026"
  });
  assert.match(text, /Форма N 24/, "absence of marriage registration reference must use form 24, not form 26");
}

{
  const text = buildZagsApplicationText(correctionVariant, {
    ...baseApplicant,
    recordActType: "marriage",
    recordActNumber: "456",
    recordActDate: "2020-05-06",
    recordActOffice: "Отдел ЗАГС",
    recordPersonName: "Иванова Мария Петровна",
    correctionFieldName: "фамилия",
    currentRecordValue: "Иванова",
    correctRecordValue: "Сидорова",
    correctionReason: "описка в актовой записи",
    basisDocuments: "паспорт"
  });
  assert.match(text, /Форма N 23/, "record correction must use form 23");
  assert.deepEqual(getZagsPaymentInfo(correctionVariant, { errorMadeByZags: true }), ["Госпошлина не уплачивается, если исправление связано с ошибкой, допущенной при государственной регистрации по вине работников ЗАГС."]);
}

console.log("zags-application-generator.test.ts: all assertions passed");
