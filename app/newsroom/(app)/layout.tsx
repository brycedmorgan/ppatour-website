import { requireEditor } from "@/lib/newsroom/auth";
import { Rail } from "../_components/Rail";

export const dynamic = "force-dynamic";

export default async function NewsroomAppLayout({ children }: { children: React.ReactNode }) {
  const { sub } = await requireEditor();
  return (
    <>
      <Rail editor={sub} />
      <div className="px-4 pb-24 pt-8 md:pb-12 md:pl-24 md:pr-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </>
  );
}
