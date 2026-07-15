import type { Metadata } from "next";
import { AccountEmptyState, AccountPageHeader } from "@/components/account/AccountShell";

export const metadata: Metadata = {
  title: "Вопросы юристам",
  robots: {
    index: false,
    follow: false
  }
};

export default function AccountQuestionsPage() {
  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AccountPageHeader
        title="Вопросы юристам"
        description="Здесь будут отображаться ваши вопросы юристам, ответы и уточнения по ситуациям."
      />
      <AccountEmptyState
        title="Вы ещё не задавали вопросы"
        description="Когда вы отправите вопрос юристу, здесь появится статус, ответ и дальнейшие шаги по ситуации."
        actions={[{ href: "/questions/#question", label: "Задать вопрос юристу", primary: true }]}
      />
    </div>
  );
}
