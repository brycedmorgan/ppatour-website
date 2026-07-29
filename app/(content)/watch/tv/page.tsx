import type { Metadata } from "next";
import { TvScheduleList } from "./tv-client";

export const metadata: Metadata = {
  title: "TV Schedule",
  description:
    "The full PPA Tour & MLP broadcast schedule — every Championship Court window on PickleballTV and Tennis Channel, all times ET.",
};

export default function TvSchedulePage() {
  return (
    <>
      <section className="bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              Broadcast
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            The TV Schedule
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/65">
            There are two ways to watch the world&apos;s best pickleball:{" "}
            <span className="font-bold text-white">PickleballTV</span> streams
            every round of every event, while select tournaments are broadcast
            nationwide on marquee windows. Find the latest broadcast and
            streaming schedule below. All times Eastern Standard Time.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <a
              href="https://www.pickleballtv.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 items-center bg-ppa-blue px-5 text-[11px] font-bold uppercase tracking-[0.12em] transition hover:bg-ppa-blue-deep active:scale-[0.98]"
            >
              Stream on PickleballTV ↗
            </a>
            <a
              href="https://www.tennischannel.com/find-tennis-channel"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 items-center border border-white/25 px-5 text-[11px] font-bold uppercase tracking-[0.12em] transition hover:border-white hover:bg-white hover:text-ppa-navy active:scale-[0.98]"
            >
              Find Tennis Channel ↗
            </a>
          </div>
        </div>
      </section>

      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <TvScheduleList />
          <p className="mt-6 text-[11px] uppercase tracking-[0.08em] text-ppa-navy/40">
            Source: PPA/MLP Championship Court broadcast schedule · windows
            subject to change — check your local listings for Tennis Channel.
          </p>
        </div>
      </section>
    </>
  );
}
