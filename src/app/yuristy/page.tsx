import { permanentRedirect } from "next/navigation";

export default function YuristyRedirectPage() {
  permanentRedirect("/lawyers/");
}
