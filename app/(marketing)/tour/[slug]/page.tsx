import type { Metadata } from "next";
import { ComingSoon } from "@/components/global/ComingSoon";

type Params = { params: Promise<{ slug: string }> };

function titleFromSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return { title: titleFromSlug(slug) };
}

export default async function TourSubpage({ params }: Params) {
  const { slug } = await params;
  return (
    <ComingSoon
      title={titleFromSlug(slug)}
      blurb="Coming soon — this page is part of the rebuild."
    />
  );
}
