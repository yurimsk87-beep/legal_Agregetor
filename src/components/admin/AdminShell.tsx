"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileQuestion, Inbox, LayoutDashboard, Menu, MessageSquare, Scale, Settings, Sparkles, X } from "lucide-react";

const adminNav = [
  { href: "/admin/", label: "Обзор", icon: LayoutDashboard },
  { href: "/admin/lawyers/", label: "Юристы", icon: Scale },
  { href: "/admin/questions/", label: "Вопросы", icon: FileQuestion },
  { href: "/admin/answers/", label: "Ответы", icon: MessageSquare },
  { href: "/admin/ai-navigator/", label: "ИИ-консультант", icon: Sparkles },
  { href: "/admin/leads/", label: "Заявки", icon: Inbox },
  { href: "/admin/settings/", label: "Настройки", icon: Settings }
];

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const [opened, setOpened] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-100 text-ink">
      <AdminSidebar opened={opened} onClose={() => setOpened(false)} />
      <div className="lg:pl-72">
        <AdminHeader email={email} onMenu={() => setOpened(true)} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}

function AdminHeader({ email, onMenu }: { email: string; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenu} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line lg:hidden" aria-label="Открыть меню">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <p className="text-sm font-semibold text-ink">Админка ПравоПоиск</p>
          <p className="text-xs text-zinc-500">Управление платформой, модерацией и заявками</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-zinc-600 sm:inline">{email}</span>
          <Link href="/logout/" className="rounded-md border border-line px-3 py-2 font-semibold hover:border-trust">
            Выйти
          </Link>
        </div>
      </div>
    </header>
  );
}

function AdminSidebar({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className={opened ? "fixed inset-0 z-40 bg-ink/40 lg:hidden" : "hidden"} onClick={onClose} />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-white transition-transform lg:translate-x-0",
          opened ? "translate-x-0" : "-translate-x-full"
        ].join(" ")}
      >
        <div className="flex min-h-16 items-center justify-between border-b border-line px-5">
          <Link href="/admin/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-sm font-bold text-white">АП</span>
            <span>Админка</span>
          </Link>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line lg:hidden" aria-label="Закрыть меню">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <nav className="grid gap-1 p-4">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/admin/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  "inline-flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                  active ? "bg-ink text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-ink"
                ].join(" ")}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export function AdminDashboardCards() {
  const cards = [
    ["Юристы", "Профили и модерация специалистов"],
    ["Вопросы", "Публикация и качество UGC"],
    ["Ответы", "Проверка ответов юристов"],
    ["Заявки", "Обращения пользователей только для ADMIN"]
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([title, description]) => (
        <article key={title} className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">{description}</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">{title}</h2>
        </article>
      ))}
    </div>
  );
}

export function AdminPlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-trust">MVP-раздел админки</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">{title}</h1>
      <p className="mt-3 max-w-2xl leading-7 text-zinc-600">{description}</p>
    </section>
  );
}
