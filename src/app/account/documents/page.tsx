import type { Metadata } from "next";
import { AccountEmptyState, AccountPageHeader } from "@/components/account/AccountShell";
import { SavedGeneratedDocumentCard } from "@/components/account/SavedGeneratedDocumentCard";

export const metadata: Metadata = {
  title: "Мои документы",
  robots: {
    index: false,
    follow: false
  }
};

export default function AccountDocumentsPage() {
  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AccountPageHeader
        title="Мои документы"
        description="Здесь будут храниться сформированные и загруженные документы по вашим делам."
      />
      <SavedGeneratedDocumentCard />
      <AccountEmptyState
        title="Документы появятся после формирования или загрузки"
        description="Здесь будут храниться заявления, жалобы, претензии, возражения и другие файлы по вашим юридическим вопросам."
        actions={[
          { href: "/documents/", label: "Сформировать документ", primary: true },
          { href: "/document-check/", label: "Загрузить документ на проверку" }
        ]}
      />
    </div>
  );
}
