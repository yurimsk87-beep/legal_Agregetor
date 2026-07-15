import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeading, ToolCard } from "@/components/navigator/NavigatorBlocks";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { navigatorTools } from "@/data/tools";

export const metadata: Metadata = buildMetadata({
  title: "Юридические инструменты — калькуляторы, генераторы и проверки",
  description: "Инструменты правового навигатора: проверка сроков, рисков, судебного приказа, документа и генераторы претензий или жалоб.",
  path: "/tools/",
  isIndexable: true
});

export default function ToolsPage() {
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Инструменты", path: "/tools/" }
  ];
  const availableTools = navigatorTools.filter((tool) => tool.status === "available");

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-ink">Юридические инструменты</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-700">
          Калькуляторы, генераторы документов и проверки помогают быстро сориентироваться в ситуации: рассчитать процессуальные сроки, оценить риски, подготовить претензию или жалобу и понять, когда нужна помощь юриста.
        </p>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          Инструменты дают ориентир и не заменяют консультацию специалиста. Если после расчёта остаются вопросы по вашей ситуации, документы или сроки спорные — задайте вопрос юристу: после модерации на него смогут ответить проверенные специалисты.
        </p>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeading title="Доступные инструменты" description="Показываем только те инструменты, которыми уже можно воспользоваться." />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {availableTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-line bg-zinc-50 p-6">
          <h2 className="text-2xl font-semibold text-ink">Не нашли подходящий инструмент?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">
            Опишите ситуацию — юрист подскажет, какие сроки и документы важны именно в вашем случае. Вопрос проходит модерацию перед публикацией, личные контакты не раскрываются.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/questions/#question" className="inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink">
              Задать вопрос юристу
            </Link>
            <Link href="/problems/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
              Смотреть ситуации
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
