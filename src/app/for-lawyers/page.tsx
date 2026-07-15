import type { Metadata } from "next";
import { StaticInfoPage } from "@/components/StaticInfoPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Юристам",
  description: "Как юристу развивать профиль в ПравоПоиск через ответы, публикации, подтвержденный опыт и соблюдение правил модерации.",
  path: "/for-lawyers/",
  isIndexable: true
});

export default function ForLawyersPage() {
  return (
    <StaticInfoPage
      title="Юристам"
      description="Профиль развивается через экспертные ответы, публикации и подтвержденный опыт. В публичных ответах запрещены личные контакты."
      path="/for-lawyers/"
      sections={[
        {
          title: "Как начать",
          items: [
            "Зарегистрируйтесь, заполните профиль, город, статус и специализации.",
            "Профиль проходит модерацию и проверку публичных данных.",
            "После одобрения можно отвечать на опубликованные вопросы и готовить статьи."
          ]
        },
        {
          title: "Правила публичных ответов",
          items: [
            "Ответы проходят модерацию.",
            "В ответах запрещены телефон, email, Telegram, WhatsApp, сайт и другие внешние контакты.",
            "Статус «Профиль проверен» зависит от подтвержденных данных, качества материалов и соблюдения правил."
          ]
        }
      ]}
    />
  );
}
