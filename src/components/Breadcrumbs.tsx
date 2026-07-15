import Link from "next/link";
import type { Breadcrumb } from "@/lib/types";

type BreadcrumbsProps = {
  items: Breadcrumb[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="mx-auto min-w-0 max-w-7xl px-4 pt-5 text-sm text-zinc-500 sm:px-6 lg:px-8" aria-label="Хлебные крошки">
      <ol className="flex min-w-0 flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.path} className="flex min-w-0 items-center gap-2">
            {index > 0 ? <span className="text-zinc-300">/</span> : null}
            {index === items.length - 1 ? (
              <span className="min-w-0 break-words font-medium text-zinc-700">{item.name}</span>
            ) : (
              <Link href={item.path} className="min-w-0 break-words hover:text-trust">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
