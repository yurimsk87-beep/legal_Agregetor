"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  FileQuestion,
  Lightbulb,
  LockKeyhole,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Newspaper,
  Scale,
  ShieldCheck,
  Star,
  UserRound,
  X
} from "lucide-react";

const nav = [
  { href: "/lawyer-cabinet/", label: "Обзор", icon: BarChart3 },
  { href: "/lawyer-cabinet/profile/", label: "Профиль юриста", icon: UserRound },
  { href: "/lawyer-cabinet/questions/", label: "Вопросы для ответа", icon: FileQuestion },
  { href: "/lawyer-cabinet/answers/", label: "Мои ответы", icon: MessageSquare },
  { href: "/lawyer-cabinet/reviews/", label: "Отзывы", icon: Star },
  { href: "/lawyer-cabinet/statistics/", label: "Статистика", icon: BarChart3 },
  { href: "/lawyer-cabinet/publications/", label: "Публикации", icon: Newspaper },
  { href: "/lawyer-cabinet/court-cases/", label: "Судебные дела", icon: Scale },
  { href: "/lawyer-cabinet/advertising/", label: "Реклама", icon: Megaphone },
  { href: "/lawyer-cabinet/security/", label: "Безопасность", icon: LockKeyhole },
  { href: "/lawyer-cabinet/feedback/", label: "Предложить идею", icon: Lightbulb }
];

export function LawyerCabinetShell({ email, children }: { email: string; children: ReactNode }) {
  const [opened, setOpened] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-ink">
      <LawyerCabinetSidebar opened={opened} onClose={() => setOpened(false)} />
      <div className="lg:pl-80">
        <LawyerCabinetHeader email={email} onMenu={() => setOpened(true)} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}

function LawyerCabinetHeader({ email, onMenu }: { email: string; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenu} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line lg:hidden" aria-label="Открыть меню">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <p className="text-sm font-semibold text-ink">Кабинет специалиста</p>
          <p className="text-xs text-zinc-500">Профиль, ответы и публичная экспертность без раскрытия контактов</p>
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

function LawyerCabinetSidebar({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className={opened ? "fixed inset-0 z-40 bg-ink/40 lg:hidden" : "hidden"} onClick={onClose} />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-emerald-100 bg-white transition-transform lg:translate-x-0",
          opened ? "translate-x-0" : "-translate-x-full"
        ].join(" ")}
      >
        <div className="flex min-h-16 items-center justify-between border-b border-emerald-100 px-5">
          <Link href="/lawyer-cabinet/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-trust text-sm font-bold text-white">ПП</span>
            <span>ПравоПоиск</span>
          </Link>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line lg:hidden" aria-label="Закрыть меню">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="border-b border-emerald-100 p-4">
          <div className="rounded-lg bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ShieldCheck className="h-4 w-4 text-trust" aria-hidden="true" />
              Профиль на модерации
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-600">Контакты не публикуются. Обращения идут через платформу.</p>
          </div>
        </div>
        <nav className="grid gap-1 overflow-y-auto p-4">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/lawyer-cabinet/" && pathname.startsWith(item.href));
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

export function LawyerEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-emerald-200 bg-white p-6 text-center">
      <BriefcaseBusiness className="mx-auto h-8 w-8 text-trust" aria-hidden="true" />
      <h2 className="mt-3 font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
    </div>
  );
}

export function ProfileStatusBadge({ status }: { status: string }) {
  return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{status}</span>;
}

export function ProfileCompletenessIndicator({ value }: { value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700">Заполненность</span>
        <span className="font-semibold text-ink">{value}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-zinc-200">
        <div className="h-2 rounded-full bg-trust" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ForbiddenContactsWarning({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
      В публичном профиле нельзя указывать прямые контакты. Обращения идут через платформу.
    </div>
  );
}

export function LawyerPlaceholderPage({
  eyebrow = "MVP-раздел кабинета",
  title,
  description,
  children
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-trust">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-600">{description}</p>
      </div>
      {children}
    </section>
  );
}
