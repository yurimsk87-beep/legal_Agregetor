import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Мои публикации",
  description: "Кабинет юриста: публикации и редакционная модерация.",
  path: "/lawyer/articles/",
  isIndexable: false
});

export default function LawyerArticlesPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-ink">Мои публикации</h1>
      <p className="mt-4 text-zinc-700">Публикации проходят редакционную проверку, а внешние контакты в тексте запрещены.</p>
    </section>
  );
}
