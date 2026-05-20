import type { Metadata } from "next";
import { ComingSoon } from "@/components/global/ComingSoon";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <ComingSoon
      title="Search"
      blurb="A unified site search is part of the rebuild. For now, use the nav to jump to Watch, Play, Athletes, or Events."
    />
  );
}
