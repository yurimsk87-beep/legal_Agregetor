import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { QuestionCtaLink } from "@/components/QuestionCtaLink";
import { breadcrumbJsonLd } from "@/lib/jsonld";

type StaticInfoPageProps = {
  title: string;
  description: string;
  path: string;
  intro?: string[];
  sections: Array<{ title: string; items: string[] }>;
  cta?: {
    title?: string;
    description?: string;
    label?: string;
  } | null;
};

const internalMarkdownLinkPattern = /\[([^\]]+)\]\((\/[^)\s]+)\)/g;
const internalBareLinkPattern = /\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]*\/?/g;

function linkClassName() {
  return "font-semibold text-trust underline-offset-4 hover:underline";
}

function renderPlainTextSegmentWithLinks(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(internalBareLinkPattern)) {
    const source = match[0];
    const index = match.index ?? 0;
    const href = source.replace(/[.,;:!?]+$/g, "");
    const trailing = source.slice(href.length);

    if (href.length <= 1) continue;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    nodes.push(
      <Link key={`${keyPrefix}-${href}-${index}`} href={href} className={linkClassName()}>
        {href}
      </Link>
    );

    if (trailing) {
      nodes.push(trailing);
    }

    lastIndex = index + source.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderTextWithLinks(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(internalMarkdownLinkPattern)) {
    const [source, label, href] = match;
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(...renderPlainTextSegmentWithLinks(text.slice(lastIndex, index), `plain-${index}`));
    }

    nodes.push(
      <Link key={`${href}-${index}`} href={href} className={linkClassName()}>
        {label}
      </Link>
    );

    lastIndex = index + source.length;
  }

  if (!nodes.length) {
    const plainNodes = renderPlainTextSegmentWithLinks(text, "plain");
    return plainNodes.length === 1 && plainNodes[0] === text ? text : plainNodes;
  }

  if (lastIndex < text.length) {
    nodes.push(...renderPlainTextSegmentWithLinks(text.slice(lastIndex), `plain-${lastIndex}`));
  }

  return nodes;
}

export function StaticInfoPage({ title, description, path, intro, sections, cta }: StaticInfoPageProps) {
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: title, path }
  ];
  const ctaConfig =
    cta === null
      ? null
      : {
          title: cta?.title ?? "Остались вопросы по вашей ситуации?",
          description:
            cta?.description ??
            "Опишите ситуацию — после модерации на вопрос смогут ответить проверенные юристы. Личные контакты специалистов не раскрываются.",
          label: cta?.label ?? "Задать вопрос юристу"
        };

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs)]} />
      <Breadcrumbs items={breadcrumbs} />
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="break-words text-4xl font-semibold text-ink">{title}</h1>
        <p className="mt-4 break-words text-lg leading-8 text-zinc-700">{renderTextWithLinks(description)}</p>
        {intro?.length ? (
          <div className="mt-6 space-y-4 break-words text-base leading-7 text-zinc-700">
            {intro.map((paragraph) => (
              <p key={paragraph}>{renderTextWithLinks(paragraph)}</p>
            ))}
          </div>
        ) : null}
        <div className="mt-8 grid gap-6">
          {sections.map((section) => (
            <section key={section.title} className="min-w-0 rounded-lg border border-line bg-white p-5">
              <h2 className="break-words text-2xl font-semibold text-ink">{section.title}</h2>
              <ul className="mt-4 grid gap-3 break-words text-sm leading-6 text-zinc-700">
                {section.items.map((item) => (
                  <li key={item} className="min-w-0">
                    {renderTextWithLinks(item)}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        {ctaConfig ? (
          <div className="mt-8 rounded-lg border border-line bg-zinc-50 p-6">
            <h2 className="text-2xl font-semibold text-ink">{ctaConfig.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">{renderTextWithLinks(ctaConfig.description)}</p>
            <div className="mt-5">
              <QuestionCtaLink sourcePage={path} label={ctaConfig.label} />
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
