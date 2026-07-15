import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaticInfoPage } from "@/components/StaticInfoPage";
import { getLegalPage, legalPages } from "@/data/legal-pages";
import { buildMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ legalSlug: string }>;
};

export function generateStaticParams() {
  return legalPages.map((page) => ({ legalSlug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { legalSlug } = await params;
  const page = getLegalPage(legalSlug);

  return buildMetadata({
    title: page?.metaTitle ?? "Правовой документ не найден",
    description: page?.metaDescription ?? "Правовой документ не найден.",
    path: `/legal/${legalSlug}/`,
    isIndexable: Boolean(page)
  });
}

export default async function LegalPage({ params }: PageProps) {
  const { legalSlug } = await params;
  const page = getLegalPage(legalSlug);
  if (!page) notFound();

  return <StaticInfoPage title={page.title} description={page.description} path={`/legal/${page.slug}/`} intro={page.intro} sections={page.sections} cta={page.cta} />;
}
