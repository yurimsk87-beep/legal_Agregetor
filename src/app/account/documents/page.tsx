import type { Metadata } from "next";
import { AccountPageHeader } from "@/components/account/AccountShell";
import { SavedLegalDocumentsCabinet } from "@/components/account/SavedLegalDocumentsCabinet";

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
        description="Зашифрованный архив сформированных версий: открыть, скачать копию, удалить."
      />
      <SavedLegalDocumentsCabinet />
    </div>
  );
}
