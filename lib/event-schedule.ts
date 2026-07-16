/**
 * Per-event order-of-play overrides — real schedules transcribed from the
 * event's registration page (pickleballtournaments.com) + the broadcast
 * sheet. Events without an entry fall back to the templated schedule.
 * Amateur day-by-day division assignments publish after each event's
 * registration deadline; sync from Wesley's PT.com API when it lands.
 */

export type ProDay = {
  date: string; // "Aug 31"
  dow: string;
  label: string;
  firstServe: string;
  gates: string;
  live?: string;
};

export type AmateurItem = {
  when: string;
  label: string;
  detail?: string;
};

export type EventSchedule = {
  proDays: ProDay[];
  amateur: AmateurItem[];
  amateurNote: string;
};

export const eventSchedules: Record<string, EventSchedule> = {
  // Source: pickleballtournaments.com/tournaments/
  // ppa-tour-veolia-ppa-national-championships (Pro Schedule block) +
  // PPA/MLP broadcast sheet windows. Pulled 7/16/26.
  "veolia-pickleball-national-championships": {
    proDays: [
      { date: "Aug 31", dow: "Mon", label: "Pro Qualifying — all pro events", firstServe: "TBD", gates: "8:00 AM" },
      { date: "Sep 1", dow: "Tue", label: "Main Draw — Round of 64", firstServe: "10:00 AM", gates: "9:00 AM", live: "PBTV" },
      { date: "Sep 2", dow: "Wed", label: "Main Draw — Round of 32", firstServe: "10:00 AM", gates: "9:00 AM", live: "PBTV" },
      { date: "Sep 3", dow: "Thu", label: "Main Draw — Round of 16", firstServe: "10:00 AM", gates: "9:00 AM", live: "PBTV" },
      { date: "Sep 4", dow: "Fri", label: "Quarterfinals", firstServe: "10:00 AM", gates: "9:00 AM", live: "PBTV" },
      { date: "Sep 5", dow: "Sat", label: "Semifinals", firstServe: "9:00 AM", gates: "8:00 AM", live: "PBTV" },
      { date: "Sep 6", dow: "Sun", label: "Championship Sunday — Gold & Bronze", firstServe: "10:00 AM", gates: "9:00 AM", live: "Tennis Channel · PBTV" },
    ],
    amateur: [
      {
        when: "Aug 31 – Sep 6",
        label: "Amateur skill & age brackets",
        detail: "All week, on the same courts as the pros — start times vary by division.",
      },
      {
        when: "Aug 31 & Sep 1",
        label: "PPA Tour Camp (3.0/4.0)",
        detail: "Two-day camp, 4:00–7:00 PM each day.",
      },
      {
        when: "During the week",
        label: "Junior PPA & Senior Open",
        detail: "Selections confirmed by email after the Aug 24 registration deadline.",
      },
      {
        when: "Event week",
        label: "MoneyBall",
        detail: "Open double-elimination side draw — limited to 16 teams.",
      },
    ],
    amateurNote:
      "Per-division day and time assignments publish after registration closes (Aug 24) — check your bracket on pickleballtournaments.com.",
  },
};

export function getEventSchedule(slug: string): EventSchedule | undefined {
  return eventSchedules[slug];
}
