import { permanentRedirect } from "next/navigation";

type PageProps = {
  params: Promise<{ lawyerSlug: string }>;
};

export default async function YuristyLawyerRedirectPage({ params }: PageProps) {
  const { lawyerSlug } = await params;
  permanentRedirect(`/lawyers/${lawyerSlug}/`);
}
