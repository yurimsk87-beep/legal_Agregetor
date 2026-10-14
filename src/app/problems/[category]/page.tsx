import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { ProblemCard } from "@/components/navigator/NavigatorBlocks";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getLegalCategory, legalCategories } from "@/data/legal-categories";
import { getProblemsByCategory } from "@/data/legal-problems";
import { getLegalRouteGroups } from "@/data/legal-route-groups";
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
  const routeGroups = getLegalRouteGroups(categorySlug);
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
          <div className="mt-5 flex flex-wrap gap-3">
            {popularProblems.map((problem) => (
              <Link key={problem.slug} href={`#situation-${problem.slug}`} className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-trust hover:border-trust focus:ring-2 focus:ring-trust/30">
                {problem.title}
              </Link>
            ))}
          </div>
        </section> : null}

        {routeGroups.map((group) => {
          const visibleProblems = problems.filter((problem) =>
            group.problemSlugs.includes(problem.slug)
          );
          if (!visibleProblems.length) return null;
          return (
            <section key={group.id} id={group.id} className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-semibold text-ink">{group.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">{group.description}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {visibleProblems.map((problem) => <div id={`situation-${problem.slug}`} key={problem.slug} className="scroll-mt-24"><ProblemCard problem={problem} /></div>)}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
