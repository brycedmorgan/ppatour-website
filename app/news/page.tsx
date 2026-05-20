import type { Metadata } from "next";
import { ComingSoon } from "@/components/global/ComingSoon";

export const metadata: Metadata = { title: "News" };

export default function NewsPage() {
  return (
    <ComingSoon
      title="The Newsroom"
      blurb="The full PPA Tour newsroom — recaps, analysis, features, and the race report — is part of the rebuild. Latest headlines live on the homepage."
    />
  );
}
