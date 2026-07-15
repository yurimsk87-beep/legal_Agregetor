import Link from "next/link";
import { Mail } from "lucide-react";
import { TrackableLink } from "@/components/TrackableLink";
import { platformContacts, platformSocialLinks } from "@/lib/platform";

const mainLinks = [
  ["/problems/", "Ситуации"],
  ["/documents/", "Документы"],
  ["/tools/", "Инструменты"],
  ["/lawyers/", "Юристы"],
  ["/questions/", "Вопросы юристам"],
  ["/document-check/", "Проверка документа"],
  ["/about/", "О проекте"],
  ["/contacts/", "Контакты"],
  ["/for-lawyers/", "Юристам"]
];

const legalLinks = [
  ["/legal/privacy/", "Политика конфиденциальности"],
  ["/legal/terms/", "Пользовательское соглашение"],
  ["/legal/personal-data-consent/", "Согласие на обработку ПДн"],
  ["/legal/qna-rules/", "Правила вопросов и ответов"]
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <p className="text-lg font-semibold text-ink">ПравоПоиск</p>
            <p className="mt-3 max-w-md text-sm leading-6 text-zinc-600">
              Юридический навигатор для граждан: помогаем определить ситуацию, проверить сроки и риски, подготовить документы и подключить юриста, если без него нельзя.
            </p>
            {platformContacts.email ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <TrackableLink
                  href={platformContacts.emailHref}
                  external
                  eventType="PLATFORM_EMAIL_CLICKED"
                  targetType="PLATFORM"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-trust"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {platformContacts.email}
                </TrackableLink>
              </div>
            ) : null}
            {platformSocialLinks.length ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Мы в соцсетях</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {platformSocialLinks.map((social) => (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-trust hover:text-trust"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
            ) : null}
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 lg:justify-end" aria-label="Разделы сайта">
            {mainLinks.map(([href, label]) => (
              <Link key={href} href={href} className="text-sm font-semibold text-ink transition hover:text-trust">
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-4 border-t border-line pt-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-2">
            <p>© {new Date().getFullYear()} ПравоПоиск</p>
            <p>
              ООО «ПравоПоиск» · ИНН {platformContacts.inn} · ОГРН {platformContacts.ogrn} ·{" "}
              <a href={platformContacts.emailHref} className="font-medium text-ink hover:text-trust">
                {platformContacts.email}
              </a>
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Правовая информация">
            {legalLinks.map(([href, label]) => (
              <Link key={href} href={href} className="transition hover:text-trust">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
