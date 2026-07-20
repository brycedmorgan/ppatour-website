/**
 * Bracket data for the demo, sourced from the REAL 5 pro main draws
 * (single-elim) of the 2026 Veolia Atlanta Championships, pulled from the
 * public brackets site.
 *
 * Each division's ActivityID comes from the Partner API `GetEvents`; the match
 * data is a captured fixture. Everything flows through the same `adaptElimination`
 * adapter, so the live-feed swap (fetch instead of fixture) is a one-liner.
 */
import type { Bracket, BracketDivision } from "@/lib/bracket-types";
import { bracketTypeFromFormatId } from "@/lib/bracket-types";
import { adaptElimination, type PbMatch } from "@/lib/bracket-adapter";
import mensDoubles from "@/lib/bracket-fixtures/atlanta-mens-doubles-pro.json";
import mensSingles from "@/lib/bracket-fixtures/atlanta-mens-singles-pro.json";
import mixedDoubles from "@/lib/bracket-fixtures/atlanta-mixed-doubles-pro.json";
import womensDoubles from "@/lib/bracket-fixtures/atlanta-womens-doubles-pro.json";
import womensSingles from "@/lib/bracket-fixtures/atlanta-womens-singles-pro.json";

/** 2026 Veolia Atlanta Pickleball Championships (our Partner API test event). */
export const ATLANTA_EVENT_ID = "92d37566-5850-40a3-8aad-7217276dc586";

type RealDivision = {
  id: string; // ActivityID (from GetEvents)
  name: string;
  formatId: number; // PB BracketFormatID: 1 single · 5 double · 4 round-robin
  matches: PbMatch[];
};

/** Atlanta pro main draws — all single-elim (BracketFormatID 1). */
const ATLANTA_PRO: RealDivision[] = [
  { id: "926F9336-BE76-472A-BF0F-496D2C16054B", name: "Men's Doubles", formatId: 1, matches: mensDoubles as unknown as PbMatch[] },
  { id: "28E9ECEE-233E-4A42-A15A-DAE1B7CE1D52", name: "Men's Singles", formatId: 1, matches: mensSingles as unknown as PbMatch[] },
  { id: "6CF9E41F-C56C-4BAE-897A-F91E5867E007", name: "Mixed Doubles", formatId: 1, matches: mixedDoubles as unknown as PbMatch[] },
  { id: "20A9A38F-A9DA-41A1-AAC0-DF54154B1A4F", name: "Women's Doubles", formatId: 1, matches: womensDoubles as unknown as PbMatch[] },
  { id: "C79C7618-A4E6-4431-A905-8C0C2A9A61CB", name: "Women's Singles", formatId: 1, matches: womensSingles as unknown as PbMatch[] },
];

export function getSampleDivisions(): BracketDivision[] {
  return ATLANTA_PRO.map((d) => ({
    id: d.id,
    name: d.name,
    format: "Single Elim",
    type: bracketTypeFromFormatId(d.formatId),
  }));
}

/**
 * A division's draw: the winners bracket, plus the losers bracket for
 * double-elim divisions (null otherwise). Both go through the real adapter.
 */
export function getSampleDraw(
  divisionId: string,
): { winners: Bracket; losers: Bracket | null } | null {
  const pro = ATLANTA_PRO.find((d) => d.id === divisionId);
  if (pro) {
    return {
      winners: adaptElimination(pro.matches, {
        eventId: ATLANTA_EVENT_ID,
        divisionId: pro.id,
        divisionName: pro.name,
        format: "single-elim",
      }),
      losers: null,
    };
  }

  return null;
}
