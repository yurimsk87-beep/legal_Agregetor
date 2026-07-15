"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, LogIn } from "lucide-react";

// Кнопка «Кабинет/Войти». Роль берём клиентски с /api/me, чтобы серверный хедер не
// читал куку и весь сайт мог рендериться статически (кэш + чистые 404). До ответа
// показываем дефолт «Войти» — для анонимов (и краулеров) это финальное состояние.
type Role = "ADMIN" | "LAWYER" | "USER" | null;

function cabinetFor(role: Role): { href: string; label: string } {
  if (role === "ADMIN") return { href: "/admin/", label: "Админка" };
  if (role === "LAWYER") return { href: "/lawyer-cabinet/", label: "Кабинет юриста" };
  if (role === "USER") return { href: "/account/cases/", label: "Мои дела" };
  return { href: "/login/", label: "Войти" };
}

export function HeaderCabinetButton() {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { role?: unknown } | null) => {
        if (active && data && (data.role === "ADMIN" || data.role === "LAWYER" || data.role === "USER")) {
          setRole(data.role);
        }
      })
      .catch(() => {
        // молча игнорируем — остаётся дефолт «Войти»
      });
    return () => {
      active = false;
    };
  }, []);

  const { href, label } = cabinetFor(role);
  const Icon = role ? BriefcaseBusiness : LogIn;

  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={label}
      className="relative z-10 inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink transition hover:border-trust hover:text-trust sm:gap-2 sm:px-4 sm:py-3"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </Link>
  );
}
