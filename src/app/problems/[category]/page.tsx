import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { ProblemCard } from "@/components/navigator/NavigatorBlocks";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getLegalCategory } from "@/data/legal-categories";
import { getProblemsByCategory } from "@/data/legal-problems";
import { ZAGS_PROBLEM_ROUTE } from "@/data/zags-route";

type PageProps = { params: Promise<{ category: string }> };

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return [{ category: ZAGS_PROBLEM_ROUTE.categorySlug }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  if (category !== ZAGS_PROBLEM_ROUTE.categorySlug) {
    return buildMetadata({
      title: "Категория не найдена",
      description: "Категория правового навигатора не найдена.",
      path: "/problems/" + category + "/",
      isIndexable: false
    });
  }

  return buildMetadata({
    title: "Брак и ЗАГС — юридическая ситуация и порядок действий",
    description: "Заключение брака, перемена имени, повторные документы и исправление записей ЗАГС: порядок действий и официальные формы.",
    path: "/problems/semya-i-deti/",
    isIndexable: true
  });
}

export default async function ProblemCategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params;
  if (categorySlug !== ZAGS_PROBLEM_ROUTE.categorySlug) notFound();

  const category = getLegalCategory(categorySlug);
  if (!category) notFound();

  const problems = getProblemsByCategory(categorySlug);
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Правовой навигатор", path: "/problems/" },
    { name: category.title, path: "/problems/" + category.slug + "/" }
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />
      <main>
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Правовой навигатор</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">Семейные споры</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">
            Выберите маршрут по заключению брака или обращению в органы ЗАГС.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-ink">Жизненные ситуации</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {problems.map((problem) => <ProblemCard key={problem.slug} problem={problem} />)}
          </div>
        </section>
      </main>
    </>
  );
}
