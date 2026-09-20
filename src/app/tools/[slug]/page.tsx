import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FamilyLegalTool } from "@/components/tools/FamilyLegalTool";
import { familyTools, getFamilyTool } from "@/data/family-tools";
import { buildMetadata } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() { return familyTools.map((tool) => ({ slug: tool.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const tool = getFamilyTool(slug); return tool ? buildMetadata({ title: tool.title, description: tool.description, path: `/tools/${tool.slug}/`, isIndexable: true }) : {}; }
export default async function FamilyToolPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const tool = getFamilyTool(slug); if (!tool) notFound(); return <><Breadcrumbs items={[{ name: "Главная", path: "/" }, { name: "Инструменты", path: "/tools/" }, { name: tool.title, path: `/tools/${tool.slug}/` }]} /><main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8"><h1 className="text-3xl font-semibold text-ink sm:text-4xl">{tool.title}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">{tool.description}</p><p className="mt-3 text-sm leading-6 text-zinc-600">Результат носит предварительный характер и не заменяет проверку документов, льгот, подсудности и обстоятельств конкретного дела.</p><FamilyLegalTool tool={tool} /></main></>; }
