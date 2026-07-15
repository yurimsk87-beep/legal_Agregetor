import type { Metadata } from "next";
import Link from "next/link";
import { AccountPageHeader } from "@/components/account/AccountShell";
import { requireUserSession } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Настройки",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AccountSettingsPage() {
  const user = await requireUserSession();

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AccountPageHeader
        title="Настройки"
        description="Основные данные профиля. Позже здесь появятся уведомления, изменение пароля, согласия и управление персональными данными."
      />

      <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">Профиль</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-zinc-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Email</dt>
            <dd className="mt-2 break-words text-sm font-semibold text-ink">{user.email}</dd>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Роль</dt>
            <dd className="mt-2 text-sm font-semibold text-ink">USER</dd>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Дата регистрации</dt>
            <dd className="mt-2 text-sm font-semibold text-ink">{formatAccountDate(user.createdAt)}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/logout/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
            Выйти
          </Link>
          <Link href="/legal/privacy/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-trust">
            Политика конфиденциальности
          </Link>
        </div>
      </section>
    </div>
  );
}

function formatAccountDate(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(value);
}
