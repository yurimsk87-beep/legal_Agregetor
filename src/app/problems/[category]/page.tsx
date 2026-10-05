import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { ProblemCard } from "@/components/navigator/NavigatorBlocks";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getLegalCategory, legalCategories } from "@/data/legal-categories";
import { getProblemsByCategory } from "@/data/legal-problems";
import { LABOR_CATEGORY_SLUG, LABOR_POPULAR_ROUTE_SLUGS } from "@/data/labor-routes";

type PageProps = { params: Promise<{ category: string }> };

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return legalCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const legalCategory = getLegalCategory(category);
  if (!legalCategory) {
    return buildMetadata({
      title: "Категория не найдена",
      description: "Категория правового навигатора не найдена.",
      path: "/problems/" + category + "/",
      isIndexable: false
    });
  }

  return buildMetadata({
    title: legalCategory.title,
    description: legalCategory.description,
    path: `/problems/${legalCategory.slug}/`,
    isIndexable: true
  });
}

export default async function ProblemCategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params;
  const category = getLegalCategory(categorySlug);
  if (!category) notFound();

  const problems = getProblemsByCategory(categorySlug);
  const popularSlugs = new Set<string>(LABOR_POPULAR_ROUTE_SLUGS);
  const popularProblems = categorySlug === LABOR_CATEGORY_SLUG ? problems.filter((problem) => popularSlugs.has(problem.slug)) : [];
  const remainingProblems = categorySlug === LABOR_CATEGORY_SLUG ? problems.filter((problem) => !popularSlugs.has(problem.slug)) : problems;
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
          <h1 className="mt-2 text-4xl font-semibold text-ink">{category.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">
            {category.description} Выберите жизненную ситуацию, чтобы получить применимый порядок действий и безопасный результат.
          </p>
        </section>

        {popularProblems.length ? <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-ink">Популярные ситуации</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {popularProblems.map((problem) => <ProblemCard key={problem.slug} problem={problem} />)}
          </div>
        </section> : null}

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-ink">{popularProblems.length ? "Остальные трудовые ситуации" : "Жизненные ситуации"}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {remainingProblems.map((problem) => <ProblemCard key={problem.slug} problem={problem} />)}
          </div>
        </section>
      </main>
    </>
  );
}
