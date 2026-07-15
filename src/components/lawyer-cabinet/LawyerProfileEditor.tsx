"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Plus, Save, Send, Trash2, Upload } from "lucide-react";
import {
  emptyLawyerProfile,
  mockLawyerProfile,
  specializationOptions,
  workFormatOptions,
  type CourtCaseItem,
  type EducationItem,
  type LawyerProfileDraft,
  type ProfileServiceItem,
  type WorkExperienceItem
} from "@/lib/lawyer-cabinet-mock";
import { profileContainsForbiddenContacts } from "@/lib/lawyer-cabinet-profile";
import {
  ForbiddenContactsWarning,
  LawyerEmptyState,
  ProfileCompletenessIndicator,
  ProfileStatusBadge
} from "./LawyerCabinetShell";

const storageKey = "pravopoisk-lawyer-profile-draft";
const initialProfile = process.env.NODE_ENV === "production" ? emptyLawyerProfile : mockLawyerProfile;
const priceTypes = ["Бесплатно", "От", "Диапазон", "Фиксированная", "По договоренности"];
const legalStatuses = ["Юрист", "Адвокат", "Медиатор", "Арбитражный управляющий", "Налоговый консультант"];
type TextField = keyof Pick<
  LawyerProfileDraft,
  "fullName" | "slug" | "city" | "region" | "legalStatus" | "headline" | "cardDescription" | "about" | "helpWith" | "caseTypes" | "consultationProcess" | "advantages" | "clientPreparation"
>;

export function LawyerProfileEditor() {
  const [profile, setProfile] = useState<LawyerProfileDraft>(initialProfile);
  const [status, setStatus] = useState("Черновик");
  const [savedAt, setSavedAt] = useState("не сохранялся");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const response = await fetch("/api/lawyer-cabinet/profile", { cache: "no-store" }).catch(() => null);
      if (!response?.ok) {
        const saved = window.localStorage.getItem(storageKey);
        if (saved && !cancelled) {
          setProfile(JSON.parse(saved) as LawyerProfileDraft);
          setSavedAt("загружен из локального черновика");
        }
        return;
      }

      const data = (await response.json()) as { profile?: LawyerProfileDraft; status?: string; savedAt?: string };
      if (cancelled) return;
      if (data.profile) {
        setProfile(data.profile);
        window.localStorage.setItem(storageKey, JSON.stringify(data.profile));
      }
      setStatus(statusLabel(data.status));
      setSavedAt(data.savedAt ? new Date(data.savedAt).toLocaleString("ru-RU") : "загружен из базы");
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasContacts = useMemo(() => profileContainsForbiddenContacts(profile), [profile]);
  const completeness = useMemo(() => calculateCompleteness(profile), [profile]);

  function updateField(field: TextField, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function updateNumberField(value: string) {
    setProfile((current) => ({ ...current, experienceYears: Number(value) || 0 }));
  }

  async function saveDraft() {
    await saveProfile(false);
  }

  async function submitModeration() {
    if (hasContacts) return;
    await saveProfile(true);
  }

  async function saveProfile(submit: boolean) {
    setIsSaving(true);
    setMessage("");
    window.localStorage.setItem(storageKey, JSON.stringify(profile));

    const response = await fetch("/api/lawyer-cabinet/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, submit })
    }).catch(() => null);

    setIsSaving(false);

    if (!response?.ok) {
      const data = response ? ((await response.json().catch(() => ({}))) as { message?: string }) : {};
      setSavedAt(new Date().toLocaleString("ru-RU"));
      setMessage(data.message ?? "Не удалось сохранить в базе. Локальный черновик сохранен в браузере.");
      return;
    }

    const data = (await response.json()) as { profile?: LawyerProfileDraft; status?: string; message?: string };
    if (data.profile) {
      setProfile(data.profile);
      window.localStorage.setItem(storageKey, JSON.stringify(data.profile));
    }
    setStatus(statusLabel(data.status));
    setSavedAt(new Date().toLocaleString("ru-RU"));
    setMessage(data.message ?? (submit ? "Профиль отправлен на модерацию." : "Черновик профиля сохранен."));
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-trust">Редактор публичного профиля</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">Профиль юриста</h1>
            <p className="mt-3 max-w-3xl leading-7 text-zinc-600">
              Заполните профессиональную информацию. Телефон, email, Telegram, WhatsApp и внешние ссылки в публичном профиле не показываются.
            </p>
          </div>
          <div className="min-w-64 rounded-lg bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <ProfileStatusBadge status={status} />
              <span className="text-xs text-zinc-500">Сохранение: {savedAt}</span>
            </div>
            <div className="mt-4">
              <ProfileCompletenessIndicator value={completeness} />
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          <ForbiddenContactsWarning visible={hasContacts} />
          {message ? <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-900">{message}</p> : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={saveDraft} disabled={isSaving} className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold hover:border-trust disabled:cursor-not-allowed disabled:opacity-60">
            <Save className="h-4 w-4" aria-hidden="true" />
            {isSaving ? "Сохраняем" : "Сохранить черновик"}
          </button>
          <Link href="/lawyer-cabinet/profile/preview/" className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold hover:border-trust">
            <Eye className="h-4 w-4" aria-hidden="true" />
            Предпросмотр
          </Link>
          <button
            type="button"
            onClick={submitModeration}
            disabled={hasContacts || isSaving}
            className="inline-flex items-center gap-2 rounded-md bg-trust px-4 py-3 text-sm font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Отправить на модерацию
          </button>
        </div>
      </div>

      <ProfileSectionTabs />
      <ProfileMainInfoForm profile={profile} updateField={updateField} updateNumberField={updateNumberField} />
      <ProfilePhotoUploader profile={profile} setProfile={setProfile} />
      <ProfileSpecializationsForm profile={profile} setProfile={setProfile} />
      <ProfileWorkFormatsForm profile={profile} setProfile={setProfile} />
      <ProfileAboutForm profile={profile} updateField={updateField} />
      <ProfileExperienceManager items={profile.experience} setProfile={setProfile} />
      <ProfileEducationManager items={profile.education} setProfile={setProfile} />
      <ProfileServicesManager items={profile.services} setProfile={setProfile} />
      <ProfileCourtCasesManager items={profile.courtCases} setProfile={setProfile} />
      <ProfilePublicationsTeaser />
      <ProfileVisibilitySettings profile={profile} setProfile={setProfile} />
    </section>
  );
}

export function ProfileSectionTabs() {
  const items = [
    "Основная информация",
    "Фото",
    "Специализации",
    "Форматы работы",
    "Описание",
    "Опыт",
    "Образование",
    "Услуги",
    "Судебные дела",
    "Публичность"
  ];
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-lg border border-emerald-100 bg-white p-2 shadow-sm">
      {items.map((item) => (
        <a key={item} href={`#${slug(item)}`} className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-emerald-50">
          {item}
        </a>
      ))}
    </nav>
  );
}

export function ProfileMainInfoForm({
  profile,
  updateField,
  updateNumberField
}: {
  profile: LawyerProfileDraft;
  updateField: (field: TextField, value: string) => void;
  updateNumberField: (value: string) => void;
}) {
  return (
    <ProfilePanel id="основная-информация" title="Основная информация">
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="ФИО" value={profile.fullName} onChange={(value) => updateField("fullName", value)} />
        <TextInput label="Slug профиля" value={profile.slug} onChange={(value) => updateField("slug", value)} />
        <TextInput label="Город" value={profile.city} onChange={(value) => updateField("city", value)} />
        <TextInput label="Регион" value={profile.region} onChange={(value) => updateField("region", value)} />
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Юридический статус
          <select value={profile.legalStatus} onChange={(event) => updateField("legalStatus", event.target.value)} className="rounded-md border border-line px-3 py-2">
            {legalStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <TextInput label="Стаж" type="number" value={String(profile.experienceYears)} onChange={updateNumberField} />
        <TextInput label="Краткий заголовок профиля" value={profile.headline} onChange={(value) => updateField("headline", value)} className="md:col-span-2" />
        <TextArea label="Краткое описание для карточки" value={profile.cardDescription} onChange={(value) => updateField("cardDescription", value)} className="md:col-span-2" />
      </div>
    </ProfilePanel>
  );
}

export function ProfilePhotoUploader({ profile, setProfile }: ProfileStateProps) {
  const [uploading, setUploading] = useState<"photoUrl" | "coverUrl" | null>(null);
  const [uploadError, setUploadError] = useState("");

  async function upload(field: "photoUrl" | "coverUrl", file: File | undefined) {
    if (!file) return;
    setUploading(field);
    setUploadError("");

    const formData = new FormData();
    formData.set("file", file);
    formData.set("kind", "lawyer-photo");
    formData.set("prefix", field === "photoUrl" ? "profile" : "cover");

    const response = await fetch("/api/uploads", { method: "POST", body: formData }).catch(() => null);
    setUploading(null);

    if (!response?.ok) {
      const data = response ? ((await response.json().catch(() => ({}))) as { message?: string }) : {};
      setUploadError(data.message ?? "Не удалось загрузить файл.");
      return;
    }

    const data = (await response.json()) as { file?: { publicUrl?: string } };
    if (data.file?.publicUrl) {
      setProfile((current) => ({ ...current, [field]: data.file?.publicUrl ?? "" }));
    }
  }

  return (
    <ProfilePanel id="фото" title="Фото">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["photoUrl", "Фото профиля", profile.photoUrl],
          ["coverUrl", "Обложка профиля", profile.coverUrl]
        ].map(([field, title, currentUrl]) => (
          <div key={field} className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-trust" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">Загрузите фото профиля. После модерации оно будет отображаться на публичной странице.</p>
            {currentUrl ? <p className="mt-3 break-all text-xs text-zinc-500">{currentUrl}</p> : null}
            <label className="mt-4 inline-flex cursor-pointer rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-trust">
              {uploading === field ? "Загружаем" : "Выбрать файл"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="sr-only"
                disabled={Boolean(uploading)}
                onChange={(event) => upload(field as "photoUrl" | "coverUrl", event.target.files?.[0])}
              />
            </label>
          </div>
        ))}
      </div>
      {uploadError ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{uploadError}</p> : null}
    </ProfilePanel>
  );
}

export function ProfileSpecializationsForm({ profile, setProfile }: ProfileStateProps) {
  function toggle(kind: "primarySpecializations" | "additionalSpecializations", value: string) {
    setProfile((current) => {
      const exists = current[kind].includes(value);
      const next = exists ? current[kind].filter((item) => item !== value) : [...current[kind], value];
      if (kind === "primarySpecializations" && next.length > 5) return current;
      return { ...current, [kind]: next };
    });
  }

  return (
    <ProfilePanel id="специализации" title="Специализации">
      <p className="text-sm leading-6 text-zinc-600">Основных специализаций может быть не больше 5.</p>
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <CheckboxGrid title="Основные специализации" selected={profile.primarySpecializations} onToggle={(value) => toggle("primarySpecializations", value)} />
        <CheckboxGrid title="Дополнительные специализации" selected={profile.additionalSpecializations} onToggle={(value) => toggle("additionalSpecializations", value)} />
      </div>
    </ProfilePanel>
  );
}

export function ProfileWorkFormatsForm({ profile, setProfile }: ProfileStateProps) {
  return (
    <ProfilePanel id="форматы-работы" title="Форматы работы">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {workFormatOptions.map((item) => (
          <label key={item} className="flex items-start gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={profile.workFormats.includes(item)}
              onChange={() =>
                setProfile((current) => ({
                  ...current,
                  workFormats: current.workFormats.includes(item)
                    ? current.workFormats.filter((value) => value !== item)
                    : [...current.workFormats, item]
                }))
              }
              className="mt-1 h-4 w-4 rounded border-line text-trust"
            />
            {item}
          </label>
        ))}
      </div>
    </ProfilePanel>
  );
}

export function ProfileAboutForm({ profile, updateField }: { profile: LawyerProfileDraft; updateField: (field: TextField, value: string) => void }) {
  return (
    <ProfilePanel id="описание" title="Описание">
      <div className="grid gap-4 md:grid-cols-2">
        <TextArea label="О себе" hint="Опишите простыми словами, по каким вопросам вы помогаете клиентам." value={profile.about} onChange={(value) => updateField("about", value)} />
        <TextArea label="Чем помогаю" value={profile.helpWith} onChange={(value) => updateField("helpWith", value)} />
        <TextArea label="С какими делами работаю" value={profile.caseTypes} onChange={(value) => updateField("caseTypes", value)} />
        <TextArea label="Как проходит консультация" hint="Расскажите, как проходит консультация и какие документы лучше подготовить заранее." value={profile.consultationProcess} onChange={(value) => updateField("consultationProcess", value)} />
        <TextArea label="Преимущества работы со мной" value={profile.advantages} onChange={(value) => updateField("advantages", value)} />
        <TextArea label="Что подготовить клиенту" hint="Не указывайте телефон, email, Telegram, WhatsApp и внешние ссылки. Обращения идут через платформу." value={profile.clientPreparation} onChange={(value) => updateField("clientPreparation", value)} />
      </div>
    </ProfilePanel>
  );
}

export function ProfileExperienceManager({ items, setProfile }: { items: WorkExperienceItem[]; setProfile: ProfileSetter }) {
  return (
    <ProfilePanel id="опыт" title="Опыт работы" action={<AddButton onClick={() => setProfile((current) => ({ ...current, experience: [...current.experience, emptyExperience()] }))} label="Добавить место работы" />}>
      {items.length ? (
        <div className="grid gap-4">
          {items.map((item, index) => (
            <EditableCard key={item.id} onDelete={() => setProfile((current) => ({ ...current, experience: current.experience.filter((row) => row.id !== item.id) }))}>
              <div className="grid gap-3 md:grid-cols-2">
                <TextInput label="Дата начала" value={item.startDate} onChange={(value) => updateArray(setProfile, "experience", index, { startDate: value })} />
                <TextInput label="Дата окончания" value={item.endDate} onChange={(value) => updateArray(setProfile, "experience", index, { endDate: value })} />
                <TextInput label="Должность" value={item.position} onChange={(value) => updateArray(setProfile, "experience", index, { position: value })} />
                <TextInput label="Организация" value={item.organization} onChange={(value) => updateArray(setProfile, "experience", index, { organization: value })} />
                <TextInput label="Город" value={item.city} onChange={(value) => updateArray(setProfile, "experience", index, { city: value })} />
                <label className="flex items-center gap-2 pt-7 text-sm text-zinc-700">
                  <input type="checkbox" checked={item.current} onChange={(event) => updateArray(setProfile, "experience", index, { current: event.target.checked })} />
                  По настоящее время
                </label>
                <TextArea label="Описание" value={item.description} onChange={(value) => updateArray(setProfile, "experience", index, { description: value })} className="md:col-span-2" />
              </div>
            </EditableCard>
          ))}
        </div>
      ) : (
        <LawyerEmptyState title="Вы пока не добавили опыт работы." description="Добавьте места работы, чтобы пользователь понимал вашу практику." />
      )}
    </ProfilePanel>
  );
}

export function ProfileEducationManager({ items, setProfile }: { items: EducationItem[]; setProfile: ProfileSetter }) {
  return (
    <ProfilePanel id="образование" title="Образование" action={<AddButton onClick={() => setProfile((current) => ({ ...current, education: [...current.education, emptyEducation()] }))} label="Добавить образование" />}>
      {items.length ? (
        <div className="grid gap-4">
          {items.map((item, index) => (
            <EditableCard key={item.id} onDelete={() => setProfile((current) => ({ ...current, education: current.education.filter((row) => row.id !== item.id) }))}>
              <div className="grid gap-3 md:grid-cols-2">
                <TextInput label="Учебное заведение" value={item.institution} onChange={(value) => updateArray(setProfile, "education", index, { institution: value })} />
                <TextInput label="Факультет" value={item.faculty} onChange={(value) => updateArray(setProfile, "education", index, { faculty: value })} />
                <TextInput label="Специальность" value={item.specialty} onChange={(value) => updateArray(setProfile, "education", index, { specialty: value })} />
                <TextInput label="Квалификация" value={item.qualification} onChange={(value) => updateArray(setProfile, "education", index, { qualification: value })} />
                <TextInput label="Год окончания" value={item.graduationYear} onChange={(value) => updateArray(setProfile, "education", index, { graduationYear: value })} />
                <TextArea label="Описание" value={item.description} onChange={(value) => updateArray(setProfile, "education", index, { description: value })} />
              </div>
            </EditableCard>
          ))}
        </div>
      ) : (
        <LawyerEmptyState title="Вы пока не добавили образование." description="Добавьте вуз, квалификацию и год окончания." />
      )}
    </ProfilePanel>
  );
}

export function ProfileServicesManager({ items, setProfile }: { items: ProfileServiceItem[]; setProfile: ProfileSetter }) {
  return (
    <ProfilePanel id="услуги" title="Услуги и цены" action={<AddButton onClick={() => setProfile((current) => ({ ...current, services: [...current.services, emptyService()] }))} label="Добавить услугу" />}>
      {items.length ? (
        <div className="grid gap-4">
          {items.map((item, index) => (
            <EditableCard key={item.id} onDelete={() => setProfile((current) => ({ ...current, services: current.services.filter((row) => row.id !== item.id) }))}>
              <div className="grid gap-3 md:grid-cols-2">
                <TextInput label="Название услуги" value={item.title} onChange={(value) => updateArray(setProfile, "services", index, { title: value })} />
                <label className="grid gap-1 text-sm font-medium text-zinc-700">
                  Тип цены
                  <select value={item.priceType} onChange={(event) => updateArray(setProfile, "services", index, { priceType: event.target.value })} className="rounded-md border border-line px-3 py-2">
                    {priceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <TextInput label="Цена от" value={item.priceFrom} onChange={(value) => updateArray(setProfile, "services", index, { priceFrom: value })} />
                <TextInput label="Цена до" value={item.priceTo} onChange={(value) => updateArray(setProfile, "services", index, { priceTo: value })} />
                <TextInput label="Фиксированная цена" value={item.fixedPrice} onChange={(value) => updateArray(setProfile, "services", index, { fixedPrice: value })} />
                <TextArea label="Описание" value={item.description} onChange={(value) => updateArray(setProfile, "services", index, { description: value })} className="md:col-span-2" />
              </div>
            </EditableCard>
          ))}
        </div>
      ) : (
        <LawyerEmptyState title="Вы пока не добавили услуги." description="Добавьте консультации, документы и сопровождение." />
      )}
    </ProfilePanel>
  );
}

export function ProfileCourtCasesManager({ items, setProfile }: { items: CourtCaseItem[]; setProfile: ProfileSetter }) {
  return (
    <ProfilePanel id="судебные-дела" title="Судебные дела" action={<AddButton onClick={() => setProfile((current) => ({ ...current, courtCases: [...current.courtCases, emptyCourtCase()] }))} label="Добавить судебное дело" />}>
      {items.length ? (
        <div className="grid gap-4">
          {items.map((item, index) => (
            <EditableCard key={item.id} onDelete={() => setProfile((current) => ({ ...current, courtCases: current.courtCases.filter((row) => row.id !== item.id) }))}>
              <div className="grid gap-3 md:grid-cols-2">
                <TextInput label="Название дела" value={item.title} onChange={(value) => updateArray(setProfile, "courtCases", index, { title: value })} />
                <TextInput label="Номер дела" value={item.caseNumber} onChange={(value) => updateArray(setProfile, "courtCases", index, { caseNumber: value })} />
                <TextInput label="Суд" value={item.court} onChange={(value) => updateArray(setProfile, "courtCases", index, { court: value })} />
                <TextInput label="Категория" value={item.category} onChange={(value) => updateArray(setProfile, "courtCases", index, { category: value })} />
                <TextInput label="Год" value={item.year} onChange={(value) => updateArray(setProfile, "courtCases", index, { year: value })} />
                <TextInput label="Результат" value={item.result} onChange={(value) => updateArray(setProfile, "courtCases", index, { result: value })} />
                <TextInput label="Ссылка на источник" value={item.sourceUrl} onChange={(value) => updateArray(setProfile, "courtCases", index, { sourceUrl: value })} />
                <TextArea label="Краткое описание" value={item.description} onChange={(value) => updateArray(setProfile, "courtCases", index, { description: value })} className="md:col-span-2" />
              </div>
            </EditableCard>
          ))}
        </div>
      ) : (
        <LawyerEmptyState title="Вы пока не добавили судебные дела." description="Добавьте обезличенные дела, которые подтверждают опыт." />
      )}
    </ProfilePanel>
  );
}

export function ProfileVisibilitySettings({ profile, setProfile }: ProfileStateProps) {
  const items = [
    ["experience", "Показывать опыт работы"],
    ["education", "Показывать образование"],
    ["services", "Показывать услуги"],
    ["courtCases", "Показывать судебные дела"],
    ["publications", "Показывать публикации"],
    ["reviews", "Показывать отзывы"],
    ["consultations", "Показывать консультации"]
  ];

  return (
    <ProfilePanel id="публичность" title="Настройки публичности">
      <div className="rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
        Прямые контакты юриста публично не показываются. Обращения идут через платформенную кнопку обращения.
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={profile.visibility[key]}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  visibility: { ...current.visibility, [key]: event.target.checked }
                }))
              }
              className="h-4 w-4 rounded border-line text-trust"
            />
            {label}
          </label>
        ))}
      </div>
    </ProfilePanel>
  );
}

function ProfilePublicationsTeaser() {
  return (
    <ProfilePanel id="публикации" title="Публикации">
      <LawyerEmptyState title="Публикации будут управляться в отдельном разделе кабинета." description="Пока нет публикаций." />
      <Link href="/lawyer-cabinet/publications/" className="mt-4 inline-flex rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-trust">
        Перейти к публикациям
      </Link>
    </ProfilePanel>
  );
}

function ProfilePanel({ id, title, action, children }: { id: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-ink">{title}</h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TextInput({ label, value, onChange, type = "text", className = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string }) {
  return (
    <label className={`grid gap-1 text-sm font-medium text-zinc-700 ${className}`}>
      {label}
      <input value={value} type={type} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
    </label>
  );
}

function TextArea({ label, value, onChange, hint, className = "" }: { label: string; value: string; onChange: (value: string) => void; hint?: string; className?: string }) {
  return (
    <label className={`grid gap-1 text-sm font-medium text-zinc-700 ${className}`}>
      {label}
      {hint ? <span className="text-xs font-normal leading-5 text-zinc-500">{hint}</span> : null}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="rounded-md border border-line px-3 py-2 outline-none focus:border-trust" />
    </label>
  );
}

function CheckboxGrid({ title, selected, onToggle }: { title: string; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <h3 className="font-semibold text-ink">{title}</h3>
      <div className="mt-3 grid gap-2">
        {specializationOptions.map((item) => (
          <label key={item} className="flex items-start gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm">
            <input type="checkbox" checked={selected.includes(item)} onChange={() => onToggle(item)} className="mt-1 h-4 w-4 rounded border-line text-trust" />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

function EditableCard({ children, onDelete }: { children: ReactNode; onDelete: () => void }) {
  return (
    <div className="rounded-lg border border-line bg-zinc-50 p-4">
      <div className="flex justify-end">
        <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-red-300">
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Удалить
        </button>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-trust">
      <Plus className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

type ProfileSetter = Dispatch<SetStateAction<LawyerProfileDraft>>;
type ProfileStateProps = { profile: LawyerProfileDraft; setProfile: ProfileSetter };

function updateArray<K extends "experience" | "education" | "services" | "courtCases">(
  setProfile: ProfileSetter,
  key: K,
  index: number,
  patch: Partial<LawyerProfileDraft[K][number]>
) {
  setProfile((current) => ({
    ...current,
    [key]: current[key].map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
  }));
}

function calculateCompleteness(profile: LawyerProfileDraft) {
  const checks = [
    profile.fullName,
    profile.slug,
    profile.city,
    profile.legalStatus,
    profile.experienceYears > 0,
    profile.headline,
    profile.cardDescription,
    profile.primarySpecializations.length > 0,
    profile.workFormats.length > 0,
    profile.about,
    profile.helpWith,
    profile.experience.length > 0,
    profile.education.length > 0,
    profile.services.length > 0,
    profile.courtCases.length > 0
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function emptyExperience(): WorkExperienceItem {
  return { id: crypto.randomUUID(), startDate: "", endDate: "", current: false, position: "", organization: "", city: "", description: "" };
}

function emptyEducation(): EducationItem {
  return { id: crypto.randomUUID(), institution: "", faculty: "", specialty: "", qualification: "", graduationYear: "", description: "" };
}

function emptyService(): ProfileServiceItem {
  return { id: crypto.randomUUID(), title: "", description: "", priceType: "От", priceFrom: "", priceTo: "", fixedPrice: "" };
}

function emptyCourtCase(): CourtCaseItem {
  return { id: crypto.randomUUID(), title: "", caseNumber: "", court: "", category: "", year: "", result: "", description: "", sourceUrl: "" };
}

function slug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function statusLabel(value?: string) {
  if (value === "APPROVED") return "Опубликован";
  if (value === "REJECTED") return "Отклонен";
  if (value === "BLOCKED") return "Заблокирован";
  if (value === "PENDING") return "На модерации";
  return "Черновик";
}
