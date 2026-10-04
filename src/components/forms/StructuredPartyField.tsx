"use client";

import { useEffect, useState } from "react";

type PartyParts = {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  birthPlace: string;
  address: string;
  phone: string;
  email: string;
  workplace: string;
  identifierType: string;
  identifierValue: string;
};

const emptyParts: PartyParts = {
  lastName: "", firstName: "", middleName: "", birthDate: "", birthPlace: "", address: "", phone: "", email: "", workplace: "", identifierType: "", identifierValue: ""
};

export function isStructuredPartyField(name: string) {
  return /^(?:applicantData|plaintiffData|defendantData|respondentData|otherParentData|otherSpouseData|payerData|recordedParentData|objectorData|caregiverData)$/.test(name);
}

export function StructuredPartyField({ id, label, fieldName, value, onChange, required }: { id: string; label: string; fieldName: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  const [parts, setParts] = useState<PartyParts>(emptyParts);
  const [unknown, setUnknown] = useState(value === "Сведения неизвестны");
  const defendant = /defendant|respondent|otherParent|otherSpouse|payer|recordedParent|objector|caregiver/i.test(fieldName);

  useEffect(() => {
    if (!value) {
      setParts(emptyParts);
      setUnknown(false);
    }
  }, [value]);

  function update(name: keyof PartyParts, nextValue: string) {
    const next = { ...parts, [name]: nextValue };
    setParts(next);
    onChange(serializeParty(next));
  }

  function setUnknownState(next: boolean) {
    setUnknown(next);
    if (next) onChange("Сведения неизвестны");
    else onChange(serializeParty(parts));
  }

  return (
    <fieldset className="grid gap-3 rounded-md border border-line p-4">
      <legend className="px-1 text-sm font-semibold text-ink">{label}{required ? <span className="sr-only"> (обязательно)</span> : null}</legend>
      {defendant ? (
        <label className="flex items-start gap-2 text-sm font-normal text-zinc-700">
          <input type="checkbox" checked={unknown} onChange={(event) => setUnknownState(event.target.checked)} className="mt-1 h-4 w-4" />
          <span>Сведения неизвестны. Суд может запросить предусмотренные законом сведения, но адрес для определения подсудности всё равно нужно проверить отдельно.</span>
        </label>
      ) : null}
      {!unknown ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <PartyInput id={`${id}-last-name`} label="Фамилия" value={parts.lastName} onChange={(value) => update("lastName", value)} required={required} />
          <PartyInput id={`${id}-first-name`} label="Имя" value={parts.firstName} onChange={(value) => update("firstName", value)} required={required} />
          <PartyInput id={`${id}-middle-name`} label="Отчество" value={parts.middleName} onChange={(value) => update("middleName", value)} />
          <PartyInput id={`${id}-birth-date`} label="Дата рождения" type="date" value={parts.birthDate} onChange={(value) => update("birthDate", value)} />
          <PartyInput id={`${id}-birth-place`} label="Место рождения" value={parts.birthPlace} onChange={(value) => update("birthPlace", value)} />
          <PartyInput id={`${id}-address`} label="Адрес" value={parts.address} onChange={(value) => update("address", value)} required={required} />
          <PartyInput id={`${id}-phone`} label="Телефон" type="tel" value={parts.phone} onChange={(value) => update("phone", value)} />
          <PartyInput id={`${id}-email`} label="Email" type="email" value={parts.email} onChange={(value) => update("email", value)} />
          {defendant ? <PartyInput id={`${id}-workplace`} label="Место работы, если известно" value={parts.workplace} onChange={(value) => update("workplace", value)} /> : null}
          <label className="grid gap-1 text-sm font-medium text-zinc-700">
            Тип идентификатора
            <select value={parts.identifierType} onChange={(event) => update("identifierType", event.target.value)} className="min-h-11 rounded-md border border-line bg-white px-3 py-2 text-base font-normal">
              <option value="">Не выбран</option>
              <option value="Паспорт">Паспорт</option>
              <option value="СНИЛС">СНИЛС</option>
              <option value="ИНН">ИНН</option>
              <option value="водительское удостоверение">Водительское удостоверение</option>
            </select>
          </label>
          <PartyInput id={`${id}-identifier`} label="Значение идентификатора" value={parts.identifierValue} onChange={(value) => update("identifierValue", value)} />
        </div>
      ) : null}
    </fieldset>
  );
}

function PartyInput({ id, label, type = "text", value, onChange, required }: { id: string; label: string; type?: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label htmlFor={id} className="grid gap-1 text-sm font-medium text-zinc-700">{label}<input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="min-h-11 rounded-md border border-line bg-white px-3 py-2 text-base font-normal" /></label>;
}

function serializeParty(parts: PartyParts) {
  return [
    ["Фамилия", parts.lastName], ["Имя", parts.firstName], ["Отчество", parts.middleName], ["Дата рождения", parts.birthDate], ["Место рождения", parts.birthPlace], ["Адрес", parts.address], ["Телефон", parts.phone], ["Email", parts.email], ["Место работы", parts.workplace], ["Тип идентификатора", parts.identifierType], ["Идентификатор", parts.identifierValue]
  ].filter(([, value]) => value.trim()).map(([label, value]) => `${label}: ${value.trim()}`).join("; ");
}
