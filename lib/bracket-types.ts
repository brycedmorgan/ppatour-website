/**
 * Internal bracket model — the shape our bracket UI renders, decoupled from any
 * source feed. An adapter maps the real apps/brackets payload (or the Partner
 * API draw endpoint, once access lands) into this; the renderer never changes.
 * Aligned in spirit to `brackets-model` (participants → rounds → matches with
 * two opponents), trimmed to what a pro single-elim draw needs for v1.
 */

export type BracketMedal = "gold" | "silver" | "bronze";

export type BracketParticipant = {
  id: string;
  /** Display name — "Tardio / B. Johns" for doubles, "Ben Johns" for singles. */
  name: string;
  seed?: number;
  medal?: BracketMedal;
};

export type BracketSide = {
  /** null = TBD (match not yet fed) or a bye. */
  participant: BracketParticipant | null;
  /** Per-game scores (up to 3); null for games not played. */
  games: (number | null)[];
  winner: boolean;
};

export type BracketMatchStatus = "scheduled" | "live" | "final";

export type BracketMatch = {
  id: string;
  /** Sequential match number shown on the card's left rail (e.g. 17). */
  number?: number;
  roundIndex: number;
  status: BracketMatchStatus;
  sides: [BracketSide, BracketSide];
  court?: string;
  time?: string;
  /** The match this winner advances to — drives the connector line to the
   *  exact next-round card (not a positional guess). */
  nextMatchId?: string;
};

export type BracketRound = {
  name: string;
  matches: BracketMatch[];
};

export type BracketFormat = "single-elim" | "double-elim" | "round-robin";

/**
 * Map the PB API's BracketFormatID (from API_v2_Tourney_GetEvents, per division)
 * to a bracket type, so we can pick the right view before fetching the draw:
 *   1 = Single Elim · 5 = Double Elim · 4 = Round-Robin
 */
export function bracketTypeFromFormatId(id: number | string | undefined): BracketFormat {
  switch (Number(id)) {
    case 5:
      return "double-elim";
    case 4:
      return "round-robin";
    case 1:
    default:
      return "single-elim";
  }
}

export type Bracket = {
  eventId: string;
  divisionId: string;
  divisionName: string;
  format: BracketFormat;
  rounds: BracketRound[];
};

/** One selectable division in the picker. */
export type BracketDivision = {
  id: string;
  name: string;
  /** Human format label, e.g. "Single Elim". */
  format: string;
  /** Normalized bracket type (drives which renderer to use). */
  type: BracketFormat;
  gold?: string;
  silver?: string;
  bronze?: string;
};

export type BracketDivisionsResponse = { eventId: string; divisions: BracketDivision[] };
export type BracketResponse = { division: BracketDivision; bracket: Bracket };
