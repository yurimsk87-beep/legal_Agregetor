import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Мои ответы",
  description: "Кабинет юриста: ответы и статусы модерации.",
  path: "/lawyer/answers/",
  isIndexable: false
});

export default function LawyerAnswersPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-ink">Мои ответы</h1>
      <p className="mt-4 text-zinc-700">Ответы проходят проверку качества и контактов перед публикацией.</p>
    </section>
  );
}
