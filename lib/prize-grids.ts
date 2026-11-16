/**
 * Prize money grids by contract, for the unlinked /about/prize-money page.
 *
 * ⚠ SOURCE: "2026-2027 Updated: Prize Money Grids Per Contract", John Enger
 * (Pickleball Inc counsel), Google Doc 10S1HVSEANPQSZsy7a6iQPHsWnSOF5w9o-7-4fgiX_S8,
 * last edited 9/15/2026. Every figure below is copied from it. Change a number
 * only against a newer version of that doc. Gold here matches PRIZE_ROWS on
 * /about/how-it-works.
 *
 * ⚠ Copied as written, including one likely typo: Standard, PPA 125, Quarter
 * Finals, Women's Singles reads $28 (every other grid has $38). Flagged to
 * Bryce 11/16; fix it only when the doc changes.
 *
 * Why the page exists (Connor, 11/16): show all four grids, Gold most visible,
 * on a page nothing links to. Chris Patrick asked for it 10/30 because some
 * player agreements pay "whatever prize money is publicly posted", and only
 * Gold was posted. How It Works keeps its Gold-only rule.
 *
 * LEGACY is the original pre-summer-2025 grid. It is NOT in any doc we can
 * reach. `LEGACY_GRID` stays null until Chris sends it; the page then renders
 * it with no other change.
 */

export type PrizeTable = {
  title: string;
  /** Column heads after the row-label column. */
  head: string[];
  rows: { label: string; cells: string[] }[];
  note?: string;
};

export type PrizeGrid = {
  id: "gold" | "standard" | "futures" | "legacy";
  name: string;
  tables: PrizeTable[];
};

const DIV = [
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
  "Men's Singles",
  "Women's Singles",
];

function t(title: string, rows: [string, ...string[]][], head = DIV, note?: string): PrizeTable {
  return { title, head, rows: rows.map(([label, ...cells]) => ({ label, cells })), note };
}

const MLP_HEAD = ["1st Place", "2nd Place", "3rd Place", "4th Place", "Quarterfinal", "9-12"];
const APPEARANCE_HEAD = ["Season Long Payout (all regular season events)"];

const APPEARANCE_NOTE =
  "Appearance fees for MLP events are prorated by the days a player takes part in each event. For example, a player who plays 3 of 4 days receives 75% of the fee. Players are also eligible for an additional $500 purse ($250 per player) for winning each doubles match in the regular season.";
const MLP_PRIZE_NOTE =
  "MLP prize money is per player and prorated by the matches the player took part in for their team. For example, a player who plays 5 of 25 matches is eligible for 20% of the prize money.";

/** PPA 500 / 250 / 125 are the same on all three grids, except one cell. */
const PPA_500 = t("PPA 500 (USA Only)", [
  ["Winner", "$5,000", "$5,000", "$4,000", "$1,250", "$1,250"],
  ["Second Place", "$2,500", "$2,500", "$2,000", "$625", "$625"],
  ["Third Place", "$1,500", "$1,500", "$1,200", "$350", "$350"],
  ["Fourth Place", "$1,200", "$1,200", "$1,000", "$300", "$300"],
  ["Quarter Finals", "$600", "$600", "$500", "$150", "$150"],
]);
const PPA_250 = t("PPA 250 (USA Only)", [
  ["Winner", "$2,500", "$2,500", "$2,000", "$625", "$625"],
  ["Second Place", "$1,250", "$1,250", "$1,200", "$350", "$350"],
  ["Third Place", "$700", "$700", "$600", "$300", "$300"],
  ["Fourth Place", "$600", "$600", "$500", "$150", "$150"],
  ["Quarter Finals", "$300", "$300", "$250", "$75", "$75"],
]);
function ppa125(qfWomensSingles: string): PrizeTable {
  return t("PPA 125 (USA Only)", [
    ["Winner", "$1,250", "$1,250", "$1,000", "$313", "$313"],
    ["Second Place", "$625", "$625", "$500", "$156", "$156"],
    ["Third Place", "$375", "$375", "$300", "$88", "$88"],
    ["Fourth Place", "$300", "$300", "$250", "$75", "$75"],
    ["Quarter Finals", "$150", "$150", "$125", "$38", qfWomensSingles],
  ]);
}

export const GOLD_GRID: PrizeGrid = {
  id: "gold",
  name: "Gold Contract",
  tables: [
    t("PPA 2,000+ (Majors and Worlds) (USA Only)", [
      ["Winner", "$90,000", "$90,000", "$76,000", "$23,000", "$23,000"],
      ["Second Place", "$50,000", "$50,000", "$42,000", "$12,000", "$12,000"],
      ["Semi Finals", "$24,000", "$24,000", "$20,000", "$6,000", "$6,000"],
      ["Quarter Finals", "$12,000", "$12,000", "$10,000", "$3,000", "$3,000"],
      ["Round of 16", "$6,000", "$6,000", "$4,000", "$1,000", "$1,000"],
      ["Round of 32", "$1,500", "$1,500", "$1,000", "$325", "$325"],
    ]),
    t("PPA Finals (USA Only)", [
      ["Winner", "$70,000", "$70,000", "$60,000", "$17,000", "$17,000"],
      ["Second Place", "$34,000", "$34,000", "$32,000", "$9,000", "$9,000"],
      ["Semifinals", "$19,000", "$19,000", "$16,000", "$5,000", "$5,000"],
      ["5-8", "$10,000", "$10,000", "$8,000", "$2,500", "$2,500"],
    ]),
    t("PPA 1,500 (Cups) (USA Only)", [
      ["Winner", "$56,000", "$56,000", "$46,000", "$14,000", "$14,000"],
      ["Second Place", "$30,000", "$30,000", "$26,000", "$7,500", "$7,500"],
      ["Semi Finalist", "$15,000", "$15,000", "$12,600", "$3,800", "$3,800"],
      ["Quarter Finals", "$7,600", "$7,600", "$6,400", "$1,900", "$1,900"],
      ["Round of 16", "$3,800", "$3,800", "$3,200", "$1,000", "$1,000"],
      ["Round of 32", "$933", "$933", "$622", "$202", "$202"],
    ]),
    t("PPA 1,000 (Opens) (USA Only)", [
      ["Winner", "$38,000", "$38,000", "$30,000", "$9,000", "$9,000"],
      ["Second Place", "$20,000", "$20,000", "$17,000", "$5,000", "$5,000"],
      ["Semi Finalist", "$10,000", "$10,000", "$8,000", "$2,500", "$2,500"],
      ["Quarter Finals", "$5,000", "$5,000", "$4,000", "$1,500", "$1,500"],
      ["Round of 16", "$3,000", "$3,000", "$2,000", "$750", "$750"],
      ["Round of 32", "$627", "$627", "$418", "$136", "$136"],
    ]),
    PPA_500,
    PPA_250,
    ppa125("$38"),
    t(
      "MLP Regular Season Appearance Fee (by World Pickleball Ranking)",
      [
        ["1st", "$40,000"],
        ["2nd", "$35,000"],
        ["3rd", "$30,000"],
        ["4th", "$25,000"],
        ["5-8", "$20,000"],
        ["9-12", "$15,000"],
        ["13-20", "$10,000"],
        ["21+", "$5,000"],
      ],
      APPEARANCE_HEAD,
      APPEARANCE_NOTE,
    ),
    t(
      "MLP Prize Money (per player)",
      [
        ["MLP Midseason", "$50,000", "$35,000", "$25,000", "$15,000", "$10,000", "$5,000"],
        ["MLP Playoffs", "$250,000", "$100,000", "$75,000", "$50,000", "$25,000", "$10,000"],
      ],
      MLP_HEAD,
      MLP_PRIZE_NOTE,
    ),
  ],
};

export const STANDARD_GRID: PrizeGrid = {
  id: "standard",
  name: "Standard Contract",
  tables: [
    t("PPA 2,000+ (USA Only)", [
      ["Winner", "$24,000", "$24,000", "$20,000", "$6,000", "$6,000"],
      ["Second Place", "$18,000", "$18,000", "$15,000", "$4,500", "$4,500"],
      ["Semi Finalist", "$10,800", "$10,800", "$8,800", "$2,700", "$2,700"],
      ["Quarter Finals", "$7,200", "$7,200", "$6,200", "$1,800", "$1,800"],
      ["Round of 16", "$3,600", "$3,600", "$2,600", "$900", "$900"],
      ["Round of 32", "$750", "$750", "$500", "$163", "$163"],
    ]),
    t("PPA Finals (USA Only)", [
      ["Winner", "$35,000", "$35,000", "$30,000", "$8,500", "$8,500"],
      ["Second Place", "$17,000", "$17,000", "$16,000", "$4,500", "$4,500"],
      ["Semi Finalist", "$9,500", "$9,500", "$8,000", "$2,500", "$2,500"],
      ["5-8", "$5,000", "$5,000", "$4,000", "$1,250", "$1,250"],
    ]),
    t("PPA 1,500 (USA Only)", [
      ["Winner", "$19,200", "$19,200", "$15,360", "$4,800", "$4,800"],
      ["Second Place", "$14,400", "$14,400", "$11,520", "$3,600", "$3,600"],
      ["Semi Finalist", "$8,640", "$8,640", "$6,912", "$2,160", "$2,160"],
      ["Quarter Finals", "$5,760", "$5,760", "$4,608", "$1,440", "$1,440"],
      ["Round of 16", "$2,880", "$2,880", "$2,304", "$720", "$720"],
      ["Round of 32", "$467", "$467", "$373", "$101", "$101"],
    ]),
    t("PPA 1,000 (USA Only)", [
      ["Winner", "$16,000", "$16,000", "$12,800", "$4,000", "$4,000"],
      ["Second Place", "$12,000", "$12,000", "$9,600", "$3,000", "$3,000"],
      ["Semi Finalist", "$7,200", "$7,200", "$5,760", "$1,800", "$1,800"],
      ["Quarter Finals", "$4,800", "$4,800", "$3,840", "$1,200", "$1,200"],
      ["Round of 16", "$2,400", "$2,400", "$1,920", "$600", "$600"],
      ["Round of 32", "$313", "$313", "$251", "$68", "$68"],
    ]),
    PPA_500,
    PPA_250,
    ppa125("$28"),
    t(
      "MLP Regular Season Appearance Fee (by World Pickleball Ranking)",
      [
        ["1st", "$20,000"],
        ["2nd", "$17,500"],
        ["3rd", "$15,000"],
        ["4th", "$12,500"],
        ["5-8", "$10,000"],
        ["9-12", "$7,500"],
        ["13-20", "$5,000"],
        ["21+", "$2,500"],
      ],
      APPEARANCE_HEAD,
      APPEARANCE_NOTE,
    ),
    t(
      "MLP Prize Money (per player)",
      [
        ["MLP Midseason", "$20,000", "$14,000", "$10,000", "$6,000", "$4,000", "$2,000"],
        ["MLP Playoffs", "$125,000", "$50,000", "$37,500", "$25,000", "$12,500", "$5,000"],
      ],
      MLP_HEAD,
      MLP_PRIZE_NOTE,
    ),
  ],
};

export const FUTURES_GRID: PrizeGrid = {
  id: "futures",
  name: "Futures Contract",
  tables: [
    t("PPA 2,000+ (USA Only)", [
      ["Winner", "$12,000", "$12,000", "$10,000", "$3,000", "$3,000"],
      ["Second Place", "$9,000", "$9,000", "$7,500", "$2,250", "$2,250"],
      ["Semi Finalist", "$5,400", "$5,400", "$4,400", "$1,350", "$1,350"],
      ["Quarter Finals", "$3,600", "$3,600", "$3,100", "$900", "$900"],
      ["Round of 16", "$1,800", "$1,800", "$1,300", "$450", "$450"],
      ["Round of 32", "$375", "$375", "$250", "$81", "$81"],
    ]),
    t("PPA Finals (USA Only)", [
      ["Winner", "$17,500", "$17,500", "$15,000", "$4,250", "$4,250"],
      ["Second Place", "$8,500", "$8,500", "$8,000", "$2,250", "$2,250"],
      ["Semi Finalist", "$4,750", "$4,750", "$4,000", "$1,250", "$1,250"],
      ["5-8", "$2,500", "$2,500", "$2,000", "$625", "$625"],
    ]),
    t("PPA 1,500 (USA Only)", [
      ["Winner", "$9,600", "$9,600", "$7,680", "$2,400", "$2,400"],
      ["Second Place", "$7,200", "$7,200", "$5,760", "$1,800", "$1,800"],
      ["Semi Finalist", "$4,320", "$4,320", "$3,456", "$1,080", "$1,080"],
      ["Quarter Finals", "$2,880", "$2,880", "$2,304", "$720", "$720"],
      ["Round of 16", "$1,440", "$1,440", "$1,152", "$360", "$360"],
      ["Round of 32", "$233", "$233", "$187", "$51", "$51"],
    ]),
    t("PPA 1,000 (USA Only)", [
      ["Winner", "$8,000", "$8,000", "$6,400", "$2,000", "$2,000"],
      ["Second Place", "$6,000", "$6,000", "$4,800", "$1,500", "$1,500"],
      ["Semi Finalist", "$3,600", "$3,600", "$2,880", "$900", "$900"],
      ["Quarter Finals", "$2,400", "$2,400", "$1,920", "$600", "$600"],
      ["Round of 16", "$1,200", "$1,200", "$960", "$300", "$300"],
      ["Round of 32", "$157", "$157", "$125", "$34", "$34"],
    ]),
    PPA_500,
    PPA_250,
    ppa125("$38"),
    t(
      "MLP Regular Season Appearance Fee (by World Pickleball Ranking)",
      [
        ["1st", "$10,000"],
        ["2nd", "$8,750"],
        ["3rd", "$7,500"],
        ["4th", "$6,250"],
        ["5-8", "$5,000"],
        ["9-12", "$3,750"],
        ["13-20", "$2,500"],
        ["21+", "$1,250"],
      ],
      APPEARANCE_HEAD,
      APPEARANCE_NOTE,
    ),
    t(
      "MLP Prize Money (per player)",
      [
        ["MLP Midseason", "$10,000", "$7,000", "$5,000", "$3,000", "$2,000", "$1,000"],
        ["MLP Playoffs", "$62,500", "$25,000", "$18,750", "$12,500", "$6,250", "$2,500"],
      ],
      MLP_HEAD,
      MLP_PRIZE_NOTE,
    ),
  ],
};

/** The original grid. Null until Chris Patrick sends the figures. */
export const LEGACY_GRID: PrizeGrid | null = null;
