import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Мой профиль юриста",
  description: "Кабинет юриста: профиль, модерация и подтверждения.",
  path: "/lawyer/profile/",
  isIndexable: false
});

export default function LawyerProfileCabinetPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-ink">Мой профиль</h1>
      <p className="mt-4 text-zinc-700">Заполните профиль, специализации, город, опыт и подтверждения. Публичные контакты в профиле запрещены.</p>
    </section>
  );
}
