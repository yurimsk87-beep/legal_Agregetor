"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Eye, MessageCircle, Scale } from "lucide-react";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { QuestionModal } from "@/components/QuestionModal";
import type { Lawyer, Question } from "@/lib/types";
import { formatQuestionAuthorName, formatQuestionDate, formatQuestionNumber, getQuestionCategory } from "@/lib/question-display";

const allCategoriesLabel = "Все категории";
const allCategoriesId = "all";
const defaultPageSize = 24;

type QuestionCategoryOption = {
  id: string;
  name: string;
  slug?: string;
  questionCount?: number;
  serviceIds?: string[];
};

export function QuestionsList({
  questions,
  categories: databaseCategories = [],
  initialCategorySlug,
  onlineLawyers = [],
  pageSize = defaultPageSize
}: {
  questions: Question[];
  categories?: QuestionCategoryOption[];
  initialCategorySlug?: string;
  onlineLawyers?: Lawyer[];
  pageSize?: number;
}) {
  const [activeCategoryId, setActiveCategoryId] = useState(allCategoriesId);
  const [loadedQuestions, setLoadedQuestions] = useState(questions);
  const [hasMore, setHasMore] = useState(questions.length >= pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [loadError, setLoadError] = useState("");

  const initialCategoryId = useMemo(() => {
    if (!initialCategorySlug) return allCategoriesId;
    return databaseCategories.find((category) => category.slug === initialCategorySlug || category.id === initialCategorySlug)?.id ?? allCategoriesId;
  }, [databaseCategories, initialCategorySlug]);

  useEffect(() => {
    setLoadedQuestions(questions);
    setHasMore(questions.length >= pageSize);
    setLoadError("");
    if (initialCategoryId === allCategoriesId) {
      setActiveCategoryId(allCategoriesId);
      return;
    }

    const category = databaseCategories.find((item) => item.id === initialCategoryId);
    let isCancelled = false;
    setActiveCategoryId(initialCategoryId);
    setIsLoadingCategory(true);

    fetchQuestions({ offset: 0, limit: pageSize, serviceId: initialCategoryId, serviceIds: category?.serviceIds })
      .then((data) => {
        if (isCancelled) return;
        setLoadedQuestions(data.questions);
        setHasMore(data.hasMore);
      })
      .catch(() => {
        if (isCancelled) return;
        setLoadedQuestions([]);
        setHasMore(false);
        setLoadError("Не удалось загрузить вопросы категории. Попробуйте еще раз.");
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingCategory(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [databaseCategories, initialCategoryId, pageSize, questions]);

  const publicQuestions = useMemo(
    () =>
      loadedQuestions.filter((question) => {
        const status = question.status;
        const moderationStatus = question.qualityStatus ?? question.moderationStatus;
        return status === "PUBLISHED" && moderationStatus === "APPROVED";
      }),
    [loadedQuestions]
  );
  const categories: QuestionCategoryOption[] = useMemo(
    () =>
      databaseCategories.length > 0
        ? [{ id: allCategoriesId, name: allCategoriesLabel }, ...databaseCategories]
        : buildQuestionCategories(publicQuestions),
    [databaseCategories, publicQuestions]
  );
  useEffect(() => {
    if (!categories.some((category) => category.id === activeCategoryId)) setActiveCategoryId(allCategoriesId);
  }, [activeCategoryId, categories]);

  const visibleQuestions = useMemo(
    () => (activeCategoryId.startsWith("local:") ? publicQuestions.filter((question) => getQuestionCategory(question) === activeCategoryId.slice(6)) : publicQuestions),
    [activeCategoryId, publicQuestions]
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-trust">Q&A</p>
        <h2 className="mt-2 text-3xl font-semibold text-ink">Популярные вопросы и ответы юристов</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Посмотрите похожие ситуации перед отправкой вопроса. Карточки показывают тему, краткую суть, статус ответа и ссылку на полный разбор.
        </p>
      </div>
      <div className="mt-6 grid gap-5">
        {isLoadingCategory ? (
          <div className="rounded-lg border border-line bg-white p-8 text-center text-sm font-medium text-zinc-600">Загружаем вопросы категории...</div>
        ) : visibleQuestions.length > 0 ? (
          visibleQuestions.map((question, index) => (
            <Fragment key={question.id}>
              <QuestionCard question={question} />
              {shouldShowOnlineLawyersBanner(index, visibleQuestions.length) ? <OnlineLawyersInlineBanner lawyers={onlineLawyers} /> : null}
            </Fragment>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center">
            <Scale className="mx-auto h-8 w-8 text-zinc-400" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold text-ink">Пока нет опубликованных вопросов по этой теме</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Вы можете задать свой вопрос или начать с диагностики ситуации. Вопрос появится в публичном разделе только после модерации и проверки качества.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/questions/#question" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-4 py-2 text-sm font-semibold text-white hover:bg-ink">
                Задать вопрос юристу
              </Link>
              <Link href="/problems/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
                Смотреть ситуации
              </Link>
            </div>
          </div>
        )}
      </div>
      {(hasMore || loadError) && (
        <div className="mt-8 flex flex-col items-center gap-3">
          {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
          {hasMore ? (
            <button
              type="button"
              onClick={() => void loadMoreQuestions()}
              disabled={isLoadingMore}
              className="inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isLoadingMore ? "Загружаем..." : "Показать еще вопросы"}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );

  async function loadMoreQuestions() {
    setIsLoadingMore(true);
    setLoadError("");

    try {
      const category = categories.find((item) => item.id === activeCategoryId);
      const serviceId = activeCategoryId !== allCategoriesId && !activeCategoryId.startsWith("local:") ? activeCategoryId : undefined;
      const data = await fetchQuestions({ offset: publicQuestions.length, limit: pageSize, serviceId, serviceIds: category?.serviceIds });
      setLoadedQuestions((current) => {
        const seen = new Set(current.map((question) => question.id));
        return [...current, ...data.questions.filter((question) => !seen.has(question.id))];
      });
      setHasMore(data.hasMore);
    } catch {
      setLoadError("Не удалось загрузить вопросы. Попробуйте еще раз.");
    } finally {
      setIsLoadingMore(false);
    }
  }
}

export function QuestionFilters({
  categories,
  activeCategoryId,
  onChange,
  disabled = false
}: {
  categories: QuestionCategoryOption[];
  activeCategoryId: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Фильтр вопросов по категориям">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.id)}
          disabled={disabled}
          className={
            category.id === activeCategoryId
              ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              : "rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust disabled:opacity-60"
          }
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

function buildQuestionCategories(questions: Question[]) {
  const counts = new Map<string, number>();
  for (const question of questions) {
    const category = getQuestionCategory(question);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const sortedCategories = Array.from(counts.entries())
    .sort(([nameA, countA], [nameB, countB]) => countB - countA || nameA.localeCompare(nameB, "ru"))
    .map(([name, questionCount]) => ({ id: `local:${name}`, name, questionCount }));

  return [{ id: allCategoriesId, name: allCategoriesLabel }, ...sortedCategories];
}

async function fetchQuestions({ offset, limit, serviceId, serviceIds }: { offset: number; limit: number; serviceId?: string; serviceIds?: string[] }) {
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  if (serviceIds?.length) {
    params.set("serviceIds", serviceIds.join(","));
  } else if (serviceId) {
    params.set("serviceId", serviceId);
  }
  const response = await fetch(`/api/questions/?${params.toString()}`, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error("Request failed");
  const data = (await response.json()) as { questions?: Question[]; hasMore?: boolean };
  return {
    questions: Array.isArray(data.questions) ? data.questions : [],
    hasMore: Boolean(data.hasMore)
  };
}

export function QuestionCard({ question }: { question: Question }) {
  const answersCount = question.answersCount ?? question.answers.filter((answer) => answer.status === "PUBLISHED").length;
  const preview = truncatePreview(question.shortPreview ?? question.summary ?? question.text, 260);
  const firstAnswer = question.answers.find((answer) => answer.status === "PUBLISHED");
  const answerPreview = firstAnswer?.text ? truncatePreview(firstAnswer.text, 220) : "";
  const questionActionLabel = answersCount > 0 ? "Читать ответ" : "Открыть вопрос";
  const questionHref = `/questions/${question.slug}/`;

  return (
    <MaterialCard
      typeLabel={getQuestionCategory(question)}
      title={question.title}
      description={preview}
      href={questionHref}
      trustLabels={getQuestionTagLabels(question)}
      disclaimer="Ответ носит справочный характер и помогает подготовиться к решению юридического вопроса. Ответ сформирован на основании действующего законодательства Российской Федерации."
      actions={[{ href: questionHref, label: questionActionLabel, variant: "secondary" }]}
    >
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
        <span>{formatQuestionNumber(question.publicNumber)}</span>
        <span>{formatQuestionAuthorName(question.userName)}</span>
        <span>{formatQuestionDate(question.publishedAt ?? question.createdAt)}</span>
      </div>
      {firstAnswer && answerPreview ? (
        <div className="mt-4 rounded-lg border border-line bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={`/lawyers/${firstAnswer.lawyerSlug}/`} className="shrink-0" aria-label={`Профиль юриста ${firstAnswer.lawyerName}`}>
              {firstAnswer.lawyerPhotoUrl ? (
                <Image
                  src={firstAnswer.lawyerPhotoUrl}
                  alt={`Фото юриста ${firstAnswer.lawyerName}`}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full border border-line object-cover shadow-sm"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold text-trust">
                  {getLawyerInitials(firstAnswer.lawyerName)}
                </span>
              )}
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-trust">Ответ юриста</p>
              <Link href={`/lawyers/${firstAnswer.lawyerSlug}/`} className="block truncate font-semibold text-ink hover:text-trust">
                {firstAnswer.lawyerName}
              </Link>
              <p className="truncate text-xs text-zinc-500">{formatAnswerAuthorMeta(firstAnswer)}</p>
            </div>
          </div>
          <p className="mt-3">{answerPreview}</p>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-line bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
          <p className="font-semibold text-ink">Статус ответа</p>
          <p className="mt-2">Вопрос опубликован после модерации. Полный ответ появится на странице вопроса, если он пройдет проверку качества.</p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600">
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {answersCount} ответ
          </span>
          {/* Show views only when a real tracked value exists — never a fabricated default. */}
          {typeof question.viewsCount === "number" && question.viewsCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" aria-hidden="true" />
              {question.viewsCount} просмотров
            </span>
          ) : null}
        </div>
      </div>
    </MaterialCard>
  );
}

// Extra chips on the question card: the question's tags, distinct from the
// category (which is shown as the main type chip). MaterialCard renders up to 3.
function getQuestionTagLabels(question: Question) {
  const primary = getQuestionCategory(question);
  return (question.tags ?? [])
    .map((tag) => tag?.trim())
    .filter((tag): tag is string => Boolean(tag) && tag !== primary);
}

function OnlineLawyersInlineBanner({ lawyers }: { lawyers: Lawyer[] }) {
  const visibleLawyers = lawyers.slice(0, 10);
  if (visibleLawyers.length === 0) return null;

  return (
    <aside className="rounded-lg border border-trust/20 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Юристы онлайн</p>
          <h3 className="mt-1 text-2xl font-semibold text-ink">Получите ответ юриста в течение 5 минут</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Выберите специалиста из списка или отправьте вопрос всем доступным юристам.</p>
        </div>
        <div className="shrink-0">
          <QuestionModal sourcePage="/questions/" label="Задать вопрос юристу" />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {visibleLawyers.map((lawyer) => {
          const fullName = formatLawyerName(lawyer);

          return (
            <Link key={lawyer.id} href={`/lawyers/${lawyer.slug}/`} className="group flex min-w-0 items-center gap-3 rounded-lg border border-line bg-zinc-50 p-3 hover:border-trust">
              {lawyer.photoUrl ? (
                <span className="relative shrink-0">
                  <Image
                    src={lawyer.photoUrl}
                    alt={`Фото юриста ${fullName}`}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <span className="online-status-dot absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />
                </span>
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-trust">{getLawyerInitials(fullName)}</span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink group-hover:text-trust">{fullName}</span>
                <span className="block text-xs text-zinc-500">онлайн</span>
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

function truncatePreview(text: string, maxLength: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;
}

function getLawyerInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatAnswerAuthorMeta(answer: Question["answers"][number]) {
  return [answer.lawyerSpecialization, answer.lawyerExperienceYears ? `Стаж ${answer.lawyerExperienceYears} лет` : null].filter(Boolean).join(" · ");
}

function shouldShowOnlineLawyersBanner(index: number, total: number) {
  const questionsBeforeBanner = 6;
  const isLastCard = index >= total - 1;
  return !isLastCard && (index + 1) % questionsBeforeBanner === 0;
}

function formatLawyerName(lawyer: Lawyer) {
  return [lawyer.lastName, lawyer.firstName, lawyer.middleName].filter(Boolean).join(" ");
}

// Related-questions list with a "Показать ещё" toggle: shows `initialCount`
// cards, then reveals `step` more per click until all are visible.
export function RelatedQuestionsExpandable({
  questions,
  initialCount = 3,
  step = 3
}: {
  questions: Question[];
  initialCount?: number;
  step?: number;
}) {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  if (!questions.length) return null;

  const visible = questions.slice(0, visibleCount);
  const remaining = questions.length - visible.length;

  return (
    <div>
      <div className="grid gap-4">
        {visible.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>
      {remaining > 0 ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + step, questions.length))}
            className="rounded-full border border-line bg-white px-6 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:border-trust hover:text-trust"
          >
            Показать ещё {Math.min(step, remaining)}
          </button>
        </div>
      ) : null}
    </div>
  );
}
