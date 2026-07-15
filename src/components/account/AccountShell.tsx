"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  FileCheck2,
  FileQuestion,
  FileText,
  FolderOpen,
  LogOut,
  Menu,
  SearchCheck,
  Settings,
  ShieldCheck,
  X
} from "lucide-react";

const accountNav = [
  { href: "/account/cases/", label: "Мои дела", icon: FolderOpen },
  { href: "/account/documents/", label: "Документы", icon: FileText },
  { href: "/account/questions/", label: "Вопросы юристам", icon: FileQuestion },
  { href: "/account/checks/", label: "Проверки", icon: FileCheck2 },
  { href: "/account/deadlines/", label: "Сроки", icon: CalendarClock },
  { href: "/account/settings/", label: "Настройки", icon: Settings }
];

export function AccountShell({ children, email }: { children: ReactNode; email: string }) {
  const [opened, setOpened] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7faf8] text-ink">
      <AccountSidebar opened={opened} onClose={() => setOpened(false)} />
      <div className="lg:pl-72">
        <AccountHeader email={email} onMenu={() => setOpened(true)} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}

function AccountHeader({ email, onMenu }: { email: string; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenu} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line lg:hidden" aria-label="Открыть меню">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Мои дела</p>
          <p className="truncate text-xs text-zinc-500">{email}</p>
        </div>
        <div className="hidden items-center gap-2 xl:flex">
          <Link href="/" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-trust px-4 py-2 text-sm font-semibold text-white hover:bg-ink">
            <SearchCheck className="h-4 w-4" aria-hidden="true" />
            Описать проблему
          </Link>
          <Link href="/questions/#question" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
            <FileQuestion className="h-4 w-4" aria-hidden="true" />
            Задать вопрос юристу
          </Link>
          <Link href="/document-check/" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-trust">
            <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            Проверить документ
          </Link>
        </div>
      </div>
    </header>
  );
}

function AccountSidebar({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className={opened ? "fixed inset-0 z-40 bg-ink/40 lg:hidden" : "hidden"} onClick={onClose} />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-emerald-100 bg-white transition-transform lg:translate-x-0",
          opened ? "translate-x-0" : "-translate-x-full"
        ].join(" ")}
      >
        <div className="flex min-h-16 items-center justify-between border-b border-emerald-100 px-5">
          <Link href="/account/cases/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-trust text-sm font-bold text-white">МД</span>
            <span>Мои дела</span>
          </Link>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line lg:hidden" aria-label="Закрыть меню">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="border-b border-emerald-100 p-4">
          <div className="rounded-lg bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ShieldCheck className="h-4 w-4 text-trust" aria-hidden="true" />
              Всё по ситуации в одном месте
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-600">Разбор, документы, вопросы юристу, проверки и сроки будут собираться вокруг ваших дел.</p>
          </div>
        </div>

        <nav className="grid gap-1 overflow-y-auto p-4">
          {accountNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/account/cases/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  "inline-flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                  active ? "bg-trust text-white" : "text-zinc-700 hover:bg-emerald-50 hover:text-ink"
                ].join(" ")}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <Link href="/logout/" className="mt-2 inline-flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Выйти
          </Link>
        </nav>
      </aside>
    </>
  );
}

export function AccountPageHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-trust">Личный раздел</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
      <p className="mt-3 text-base leading-7 text-zinc-600">{description}</p>
    </div>
  );
}

export function AccountEmptyState({
  actions,
  description,
  note,
  title
}: {
  actions: { href: string; label: string; primary?: boolean }[];
  description: string;
  note?: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50 text-trust">
            <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-ink">{title}</h2>
          <p className="mt-3 text-base leading-7 text-zinc-600">{description}</p>
          {note ? (
            <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{note}</p>
          ) : null}
        </div>
        <div className="grid min-w-0 gap-3 sm:min-w-64">
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={
                action.primary
                  ? "inline-flex min-h-11 items-center justify-center rounded-md bg-trust px-5 py-3 text-sm font-semibold text-white hover:bg-ink"
                  : "inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AccountFeatureGrid() {
  const items = [
    ["Дела", "Сохраняйте юридическую ситуацию, документы, сроки и следующие шаги."],
    ["Документы", "Возвращайтесь к сформированным заявлениям, жалобам и претензиям."],
    ["Проверки", "Держите под рукой документы, которые нужно показать юристу."],
    ["Сроки", "Не теряйте важные даты по суду, приставам, работодателю или договору."]
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map(([title, text]) => (
        <article key={title} className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <Bell className="h-5 w-5 text-trust" aria-hidden="true" />
          <h3 className="mt-3 font-semibold text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>
        </article>
      ))}
    </div>
  );
}
