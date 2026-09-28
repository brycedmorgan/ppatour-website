/**
 * The 2025 PPA Tournament Handbook, transcribed from the PDF Wesley supplied
 * (9/25). This is the source of /about/player-handbook.
 *
 * ⚠ THE PAGE ALSO LINKS THE PDF ITSELF — public/ppa/handbook/
 * ppa-tournament-handbook.pdf (HANDBOOK_PDF) — so the two must say the same
 * thing. That file is the 46-page Google Docs export of 9/25, which added
 * 2(C)(ii) "Player Eligibility; MLP Injured Reserve Status"; word-diffed
 * against the earlier 45-page copy, that clause was the only change. A new
 * edition means replacing the PDF and this file in the same commit.
 *
 * ⚠ VERBATIM. The page this replaced was invented placeholder copy (round-robin
 * stages, best-of-five finals, visa rules, replay review — none of it is in the
 * handbook). These are the tour's own rules; a paraphrase is a different rule.
 * Edits made on the way in, and only these:
 *   - PDF line-break artefacts rejoined ("twentyone", "nonPickleball",
 *     "nonpublic", a doubled full stop) and "price money" → "prize money".
 *   - Numbering is GENERATED from the tree (A) → i) → (1) → (a) → (i) → 1.), so
 *     the PDF's skipped numbers (5(F) jumps iii → vi) close up.
 *   - Two cross-references were corrected: 5(F)(ii) and (iii) point at
 *     "Section 5(E)(x)" and "5(E)(xi)", which are Coaching and Best Efforts.
 *     Sexual Conduct is 5(E)(xii) and Criminal Conduct 5(E)(xiii).
 *   - The seeding / qualifying diagram on p. 8 is not reproduced; the text
 *     under it states the same process.
 *
 * ⚠ It is the 2025 edition, and it disagrees with pages built later — the
 * points table carries a 3rd-place row (Connor, 7/23: no third-place match)
 * and a 1,500-point "WPC" tier (Worlds is 3,000 on /about/how-it-works), and it
 * names the USAP rulebook where /europe names UPA-A. Replace this file whole
 * when a new edition lands; don't reconcile it by hand.
 */

export type HandbookTable = {
  caption: string;
  head: string[];
  rows: string[][];
};

export type HandbookNode = {
  /** Bold heading for this clause, when the PDF gives it one. */
  t?: string;
  /** Clause text. */
  p?: string;
  table?: HandbookTable;
  c?: HandbookNode[];
};

export type HandbookSection = {
  id: string;
  title: string;
  /** Unlabelled paragraphs before the first lettered clause. */
  intro?: string[];
  c: HandbookNode[];
};

export const HANDBOOK_EDITION = "2025 PPA Tournament Handbook";

/** Self-hosted, so the link can't rot with someone's Drive permissions. */
export const HANDBOOK_PDF = "/ppa/handbook/ppa-tournament-handbook.pdf";

const p = (text: string, ...c: HandbookNode[]): HandbookNode => (c.length ? { p: text, c } : { p: text });
const h = (title: string, ...c: HandbookNode[]): HandbookNode => ({ t: title, c });
const hp = (title: string, text: string, ...c: HandbookNode[]): HandbookNode =>
  c.length ? { t: title, p: text, c } : { t: title, p: text };

const POINTS_TABLE: HandbookTable = {
  caption: "PPA Points awarded by round, including Qualifying, for singles and doubles",
  head: ["", "1st", "2nd", "3rd", "4th", "Quarters", "Round 16", "Round 32", "Backdraw 5th", "Backdraw 6th", "Points Draw 1st", "Points Draw 2nd", "Points Draw Entry"],
  rows: [
    ["Majors", "2000", "1600", "1200", "800", "400", "200", "100", "+200", "+100", "50", "25", "10"],
    ["WPC", "1500", "1200", "900", "600", "300", "150", "75", "+150", "+75", "40", "20", "7.5"],
    ["PPA", "1000", "800", "600", "400", "200", "100", "50", "+100", "+50", "30", "15", "5"],
    ["Futures", "150", "100", "50", "10", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a", "n/a"],
  ],
};

const PENALTY_TABLE: HandbookTable = {
  caption: "Penalty schedule for Code of Conduct violations",
  head: ["Offense", "Penalty"],
  rows: [
    ["1st Offense", "Warning"],
    ["2nd Offense", "Point Penalty"],
    ["3rd and Subsequent Offenses", "Game Penalty"],
  ],
};

const FINE_TABLE: HandbookTable = {
  caption: "Fine schedule for Code of Conduct violations",
  head: ["Category", "Fines"],
  rows: [
    ["Visible Obscenity", "Up to $2,500"],
    ["Audible Obscenity", "Up to $2,500"],
    ["Verbal Abuse", "Up to $5,000"],
    ["Physical Abuse", "Up to $5,000"],
    ["Ball Abuse", "Up to $1,000"],
    ["Paddle/Equipment Abuse", "Up to $2,500"],
    ["Coaching & Coaches", "Up to $2,500"],
    ["Unsportsmanlike Conduct", "Up to $5,000"],
    ["Best Efforts", "Up to $5,000"],
    ["Unacceptable Attire", "Up to $500"],
    ["Dishonorable or Unprofessional Conduct", "Up to $5,000"],
    ["Aggravated Behavior", "Up to $10,000"],
  ],
};

const PENALTY_REFERRAL =
  "Violation of this subsection shall subject a player to be penalized in accordance with the Penalty System. In circumstances that are flagrant and particularly injurious to the success of a tournament, or are singularly egregious, the Tournament Director or Head Referee may refer the matter to the PPA Commissioner who shall conduct an investigation to determine whether the player committed a Major Offense of Aggravated Behavior or Conduct Contrary to the Integrity of the Game. Prize money earned at that event shall be held by the PPA until the Commissioner has concluded his investigation and made a determination.";

const PENALTY_REFERRAL_TD =
  "Violation of this subsection shall subject a player to be penalized in accordance with the Penalty System. In circumstances that are flagrant and particularly injurious to the success of a tournament, or are singularly egregious, the Tournament Director may refer the matter to the Commissioner who shall conduct an investigation to determine whether the player committed a Major Offense of Aggravated Behavior or Conduct Contrary to the Integrity of the Game. Prize money earned at that event shall be held by the PPA until the Commissioner has concluded his investigation and made a determination.";

const PENALTY_ONLY = "Violation of this subsection shall subject a player to be penalized in accordance with the Penalty System.";

const OBSCENITY_AGGRAVATED =
  "Violation of this subsection shall subject a player to be penalized in accordance with the Penalty System. In circumstances that are flagrant and particularly injurious to the success of a tournament, or are singularly egregious, a single violation of this section shall also constitute the player as having committed a Major Offense of Aggravated Behavior.";

export const HANDBOOK: HandbookSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    c: [
      h(
        "Purpose",
        p(
          "The 2025 PPA Handbook is a guide for players, referees and line judges at all levels of officiated PPA Tour pickleball events, covering both singles and doubles play. This handbook includes best practices for officiating, match-play scenarios, player development and affairs. This Handbook focuses on standardizing processes and techniques so that best practices are implemented by the league. This will help ensure that referees interpret the rules uniformly, apply them consistently, and standardize how pickleball tournaments are officiated creating a positive and enjoyable experience for players as well as game officials.",
        ),
      ),
    ],
  },
  {
    id: "official-competitions",
    title: "Official Competitions",
    c: [
      h(
        "Rules",
        p("In accordance with the rules (“Rules”) set forth in this PPA Official Tournament Handbook (“Handbook”), as amended from time to time and updated online at www.PPATour.com, the PPA Tour selects and schedules PPA Tournaments and is responsible for the resolution of any matter of dispute pertaining to the PPA, including imposition of penalties on players, officials, coaches, Tournament Support Personnel, and other credentialed persons."),
        p("The USAP Official Rulebook rules shall apply to all PPA Tournaments except as amended by the Rules in this Handbook. For the complete and current USAP Official Rulebook, please visit https://usapickleball.org/what-is-pickleball/official-rules/."),
        p("The Rules may be altered, amended, or repealed by the PPA. Capitalized terms have the meanings set forth in this Handbook. The headings and titles to the Sections contained herein are inserted solely for convenience purposes and shall not affect the meaning or construction of the Rules."),
        p("The PPA may impose appropriate sanctions, including monetary sanctions, upon any person or entity subject to these Rules who participates in or aids and abets any violation of these Rules. Any violation of these Rules which do not specify a process for imposition of a penalty shall be decided by the PPA and such decision may be appealed."),
      ),
      h(
        "Rain and Force Majeure",
        p("Due to the onset of rain, snow or other weather conditions that seriously affect playing quality or the immediate safety of the players, spectators, officials, or other persons on the tournament site, play will be stopped in conjunction with the director of officiating and players."),
        p("Play will be stopped for 1 hour until courts can be assessed by the necessary staff on-site."),
        p("If weather conditions continue to disrupt the tournament schedule, and matches are not resumed after the 1 hour stoppage period, the league will communicate with players, giving at a minimum, a 2 hour window to be ready for the next weather assessment and updated match schedule. If any condition, including but not limited to inclement weather, court condition, or lighting causes delay, and an event cannot be completed on its scheduled day, the event that has been delayed must be completed before the next regularly scheduled event can commence."),
        p("If inclement weather conditions persist and significantly affect the tournament schedule, the league reserves the right to adjust the format of matches and games."),
        p("The commissioner, at any point in the tournament, may cancel matches and games for the day, and may adjust the schedule and/or the match and game format as needed for the remainder of the tournament."),
        p("Tournaments may be extended as necessary for completion when unforeseen circumstances interrupt the play schedule."),
      ),
      h(
        "Registration and Entry",
        h(
          "Player Entry and Commitment to Rules",
          p(
            "Any player who enters or participates in any PPA Tournament consents and agrees to the following:",
            h("Compliance with Rules", p("Each player must comply with and is bound by all of the Rules of the Handbook, including but not limited to all amendments thereto.")),
            h("Written Consent", p("By registering for and participating in any event organized or sanctioned by the PPA, Players consent to and agree to comply with the Handbook, including but not limited to all amendments thereto.")),
          ),
        ),
        h(
          "Player Eligibility; MLP Injured Reserve Status",
          p("A player is not eligible to enter, be accepted into, or compete in any PPA Tournament while the player is listed on the Injured Reserve list, injury list, inactive injury designation, or any similar injury-related unavailability designation in Major League Pickleball, unless otherwise approved in writing by UPA."),
          p("For purposes of this rule, a player listed on MLP Injured Reserve or any similar injury-related status shall be deemed unavailable for PPA Tournament competition unless and until UPA determines otherwise."),
          p("UPA may deny entry, remove a player from a draw, withdraw a player from a Tournament, withhold approval to compete, or impose other appropriate administrative restrictions where the player’s MLP injury-related status is inconsistent with participation in PPA competition."),
          p("Nothing in this section limits UPA’s authority to administer player eligibility, Tournament participation, player safety, competitive integrity, roster status, or related matters under any applicable player agreement, handbook, league rule, event policy, or competition standard."),
        ),
      ),
      h(
        "Entry Fees",
        p("All entry and registration fees must be paid in full prior to the registration deadline. Failure to pay the fees prior to the registration deadline will constitute an invalid registration and that player will not be eligible to play in the tournament."),
        p(
          "For contracted touring professional players, entry and registration fees will be waived if registration is finalized within thirty (30) days of the opening of the registration.",
          p("Any contracted touring professional players that register after thirty (30) days of the opening of registration for a tournament must pay entry and registration fees before the registration deadline and will be reimbursed after the completion of the tournament."),
        ),
      ),
      h(
        "Ranking",
        h("General", p("The worldwide rankings for the Professional Pickleball Association (PPA Point Standings) reflect a player’s participation and performance in PPA Tour tournament play and determine player acceptances and seeding for all PPA Tour Events. The PPA Point Standings are computed and updated following each PPA Tour Tournament. Points are earned based on a Player or Team’s tournament results.")),
        h(
          "Tournament Results Comprised in Rankings",
          p("The PPA Point Standings reflect points earned in the best sixteen (16) PPA Events in a rolling 52 week period."),
          p("Points earned from a Tournament stay valid for 52 weeks from the week in which a Tournament is included in the PPA Points Standing totals."),
        ),
        h(
          "Number of PPA Points Awarded Per Tournament",
          { p: "The following table details the number of PPA Points awarded to players by round including Qualifying, and by Tournaments for both singles and doubles play.", table: POINTS_TABLE },
        ),
        h(
          "PPA Points Standings",
          p("Players are ranked on the basis of their total PPA Points in accordance with Section 2(E)(iii)."),
          p("Players are awarded ranking points for the highest round they reach."),
          p("Players who receive Wild Cards receive the same ranking points as any other player."),
          p(
            "Players who are accepted into the Main Draw from the Qualifying Draw earn PPA Points based on the highest round reached in the Main Draw plus the ranking points earned in the Qualifying Round, except that:",
            p("Qualifiers who have not played a match in the Qualifying Draw and advance to the Main Draw will receive only Main Draw points."),
            p("Qualifiers who lose in the first round of the Main Draw will receive only Qualifier Points."),
          ),
        ),
        h(
          "Withdrawals, Byes, and Defaults",
          h(
            "Withdrawals",
            p("If a player or team withdraws or is withdrawn automatically from an event before playing his or her first match, he or she will not receive any ranking points for that event, and the event will not count on his or her ranking."),
            p("In singles, if a player withdraws from a Tournament after the start of his or her first match, he or she will receive PPA Points for reaching the round in which he or she withdrew, except that a player who advances through the qualifying round and withdraws in the first round of the Main Draw will receive only PPA Points from the Qualifying Draw."),
            p("In Doubles, if a team withdraws after the start of their first match, the team will receive PPA Points for reaching the round in which they withdrew, except that a team who advances through the qualifying round and withdraws in the first round of the Main Draw will receive only PPA Points from the Qualifying Draw."),
          ),
          h(
            "Byes",
            p("If a Player or Team receives a bye and loses their first match played, the Player or Team will receive loser’s points for the round they lost in."),
            p("If a Player or Team receives a bye and defaults or withdraws from the first match, the Player or Team will not receive PPA Points for that round."),
          ),
          h(
            "Defaults",
            p(
              "For any disciplinary default occurring at a Tournament or after a match begins:",
              p("The advancing Player or Team will receive points for the round reached; and"),
              p("The defaulting Player or Team will lose all PPA Points earned for that event at that Tournament, except that if one member of a doubles team is not at fault for causing the default, he or she will receive PPA Points from the previous round."),
            ),
          ),
        ),
        h(
          "Tournament Cancellation or Early Termination",
          h("Tournament Cancellation Without Play Occurring", p("If an event is canceled, and there has been no play, players will not receive any PPA Points.")),
          h("Tournament Cancellation After Play Has Begun", p("If play has commenced for an event and is terminated before the first round is completed, players will not receive any PPA Points. However, if the first round has been completed, all players will receive PPA Points earned through the last completed round.")),
        ),
        h(
          "Tie-breaking Procedures",
          h(
            "Singles Ranking",
            p(
              "When two (2) or more players have the same number of PPA Points, the tie for the ranking position will be decided according to the following priorities:",
              p("The player with the fewest number of Tournaments in a 52-week period;"),
              p("The highest number of points from one (1) Tournament, then if needed, the second highest and so on."),
            ),
          ),
          h(
            "Doubles Ranking",
            p(
              "When two (2) or more teams have the same number of PPA Points, the tie for the ranking position will be decided according to the following priorities:",
              p("The team which has the Player with the most PPA Points, then if needed, the Player with the second most PPA Points."),
            ),
          ),
        ),
      ),
      h(
        "Entries / Seeding / Wild Cards / Qualifying Round",
        h(
          "Entries",
          p("The PPA will reveal draws for each tournament with a target of the Tuesday of the tournament week. With increasing pro participation, main draws will be limited to 32 teams. Those who do not automatically qualify for the main draw or those who are not awarded a wild card will be placed in a qualifying round(s)."),
          p("Main Draw and Qualifying draws will be released at midnight the day before each tournament bracket starts to each professional player as well as marketed to pickleball fans around the world."),
          p(
            "Main Draw spots will automatically be awarded based on touring pro status and receiving a wild card. The remaining spots will be awarded based on the results of the qualifying round.",
            p("In Pro Singles, PPA contracted Players will automatically be awarded a Main Draw spot."),
            p("In Pro Doubles, PPA contracted Players will automatically be awarded a Main Draw spot so long as they are playing with another PPA contracted Player."),
            p("Non-contracted Players will not be automatically awarded a Main Draw spot and are required to advance through the Qualifying Draw, unless they have a top ten PPA Points ranking in that event."),
          ),
        ),
        h(
          "Seeding",
          p("The seeding process will be randomized and recorded with at least two pros present throughout the process. The recording will be shared before each tournament by the Player Director."),
          p("The purpose of the leagues randomized seeding process is to: (1) create dynamic match-ups in the event that rankings remain static; (2) to help tell a better story of the sport; (3) to tackle the growing number of players; and (4) to provide enhanced marketing opportunities for social media, television, and sports journalism."),
          p(
            "Seeding will be randomized as follows (based on PPA Point Standings):",
            p("Seeds 1 and 2 will be set at the top and bottom of each draw respectively;"),
            p("Seeds 3 and 4 will be randomized among the bottom of the first half and the top of the second half of the draw;"),
            p("Seeds 5-8 will be randomized among the bottom of the first and third quarters and the top of the second and fourth quarters of the draw;"),
            p("Seeds 9-12 will be randomized among the bottom of third and seventh eighths and the top of second and sixth eighths of the draw;"),
            p("Seeds 13-16 will be randomized among the bottom of first and fifth eighths and the top of fourth and eighth eighths of the draw;"),
            p("Seeds 17-24 will be randomized among the bottom of the third, seventh, eleventh, and fifteenth sixteenths and the top of second, sixth, tenth, and fourteenth sixteenths of the draw;"),
            p("Seeds 25-32 will be randomized among the bottom of the first, fifth, ninth, and thirteenth sixteenths and the top of the fourth, eighth, twelfth, and sixteenth sixteenths of the draw."),
          ),
        ),
        h(
          "Wild Cards",
          p(
            "Wild cards will be awarded randomly to two of the six highest ranked players that were not directly accepted to the main draw, however, the Tournament Director reserves the right to award additional wild cards at his or her discretion. For wild cards awarded by rank, ranking will be determined in one of two ways:",
            p("If the Wild Card Counsel can meet prior to seeding process, the counsel will take into account PPA Point Ranking, DUPR, and prior tournament results to determine wild cards awarded; or"),
            p("If the Wild Card Counsel cannot meet prior to seeding process, the wild card awarded will be strictly based on PPA Point Ranking"),
          ),
        ),
        h(
          "Qualifying Draws and Winners",
          p(
            "If you do not make it into the main draw and are not awarded a wild card, you will then be submitted to the Qualifying Draw. The qualifying draw will be seeded by:",
            p("DUPR Ranking if the Wild Card Counsel can meet; or"),
            p("If the Wild Card Counsel cannot meet, it will be based on PPA Points Ranking"),
          ),
          p("Qualifying rounds will typically consist of 1 to 3 rounds of play to fill in at large spots in the main draw. Those who do not advance in the qualifying round will be placed in a secondary bracket to compete for PPA ranking points."),
          p("If you advance through the Qualifying draw you will be submitted into the Main Draw. The highest qualifying seed will play the lowest main draw player with a “bye”. The lowest qualifying seed will play the highest main draw player with a “bye”"),
        ),
      ),
      h(
        "Scheduling / Order of Play",
        p("Changes to the schedule of events and the order of play shall not be made within twenty-four (24) hours of the start time for the event unless inclement weather requires changes to be made."),
        h(
          "Player Obligations",
          p("Players are expected to play when scheduled. Players may be required to play more than one event on any day of a tournament."),
          p("The PPA Tour encourages all professional players to compete in as many event categories as they are reasonably able, including singles, gender doubles, and mixed doubles. Broad participation across event categories enhances the competitive product, provides fans with a more complete experience, and maximizes value for tournament hosts, sponsors, broadcast partners, and the Tour as a whole."),
          p("In recognition of the benefits and opportunities afforded to contracted professional players, an event will be credited toward a contracted player’s applicable participation or appearance obligations only if the player competes in at least two (2) of the three (3) offered professional event categories (singles, gender doubles, and mixed doubles) at that event."),
        ),
        h("Television", p("When a tournament is televised, the television commitments will be taken into scheduling consideration.")),
      ),
      h(
        "Withdrawal, Retirement, Change of Partners, and No-Show Offenses",
        h(
          "Withdrawal",
          h("Player Responsibility", p("The PPA will accept withdrawals from a player or his or her designated coach or agent, but the player is ultimately responsible for all of his or her entries and withdrawals.")),
          h(
            "Withdrawal Submission",
            p("A player’s withdrawal from a tournament is effective only if he or she submits a withdrawal in writing to the PPA or online at the registration portal."),
            p("At the time of a withdrawal, a player must provide a statement containing the reason for his or her withdrawal and a suitable, in the PPA Tour’s discretion, quotation that the PPA Tour may release to the media and public."),
          ),
          h(
            "Excused and Late Withdrawal",
            p(
              "The deadline for withdrawing is Thursday at 11:59 PM local time the week preceding the tournament. Withdrawals made after this deadline constitute a late withdrawal and subject the player to penalties, at the PPA Tour’s sole discretion, ranging from fines to suspension for multiple occurrences. However, withdrawals made after the deadline for injury or sickness will be considered excused and will not be subject to penalty.",
              p("All medal matches are required to be played and if a player withdraws from a medal match for reasons other than injury or sickness or otherwise fails to show up to the medal match, he or she will be subject to a minimum fine of $500 and a 500 PPA Point reduction for that event."),
              p(
                "For all matches other than medal matches, late withdrawal offenses will subject the player to fines and point penalties.",
                p("A players first late withdrawal offense will result in a minimum $250 fine and a reduction of 250 PPA Points from that event category."),
                p("A players second late withdrawal offense will result in at a minimum $500 fine and a reduction of 500 PPA Points from that event category."),
                p("A players third late withdrawal offense will result in a minimum $750 fine and a reduction of 750 PPA Points from that event category."),
              ),
            ),
          ),
        ),
        h(
          "Retirement",
          p(
            "If a player retires from a match, he or she is required to:",
            p("Prior to retiring from the match, call for the Head Referee and the Tournament Director to provide the reason for the retirement."),
            p("Immediately following the retirement, the Player must submit a PPA Withdrawal Form to the Tournament Director and provide a statement containing the reason for his or her retirement and a suitable, in the PPA Tour’s discretion, quotation that the PPA Tour may release to the media and public."),
          ),
        ),
        h(
          "Change of Partners",
          p("The deadline to change partners is Thursday at 11:59 PM local time the week preceding the tournament. After the deadline, changing of partners shall not be allowed for any reason."),
          p("If a partner must withdraw after the deadline to change partners, the non-withdrawing player must also withdraw from the event that both of those partners were registered to play in as a team."),
          p("Once a Player has finalized his or her tournament entry, he or she may change their registered partner without penalty until fourteen (14) days before the start of the tournament."),
        ),
        h("No-Show Offense", p("A player commits a No-Show Offense if he or she is entered and accepted into either the Qualifying Draw or Main Draw of a Tournament, does not withdraw, and fails to attend his or her first match. The fines and penalties for No-Show Offenses are 50% greater than the applicable Late/Unexcused Withdrawal fines and penalties.")),
        h("Unsportsmanlike and Unprofessional Conduct", p("Late and Unexcused Withdrawals, No-Show Offenses, Withdrawals for unprofessional reasons, or Withdrawals that are damaging to the PPA Tour’s image constitute unsportsmanlike and unprofessional conduct. A player who withdrawals for one of these reasons will be subject to disciplinary review and penalties at the PPA Tour’s sole discretion.")),
        h("Extraordinary Circumstances", p("In an extreme personal emergency (i.e., a death in the family or a serious illness or life-threatening situation for the player or his or her family) or similar extraordinary circumstances (“Extraordinary Circumstances”), a player has the right to appeal a Late Withdrawal penalty. The player must submit a written appeal to the PPA Tour, which must include documentation that substantiates the Extraordinary Circumstances, within twenty-one (21) days after the date he or she receives notice of the penalty for the Late/Unexcused, Unsportsmanlike, or Unprofessional Withdrawal.")),
      ),
      h(
        "Balls",
        h(
          "Changes and Number",
          p("Ball changes and the number of balls used per match shall be the same for all main draw matches throughout the tournament and may be altered only with approval of the Director of Officiating."),
          p("Six (6) new balls will be provided for each main draw match. In the case of a tie-break, the balls used in the match preceding the tie-break will be used in the tie-break game."),
          p("In case of a suspended match, the same balls shall be used when the match resumes."),
        ),
        h(
          "Lost and Unplayable Balls",
          p("If a ball is lost or becomes unplayable during the warm-up or before the start of the second game in the match, the ball will be replaced by a new ball, after the start of the second game, a ball of like wear shall be used as a replacement."),
          p("If a ball is hit into the stands during play, the fan that catches the ball may keep it."),
        ),
      ),
      h(
        "Officials and Officiating",
        h(
          "Head Referee",
          p(
            "The Head Referee shall:",
            p("Conduct meetings with the Referees and Line Judges to specify assignments and specific procedures."),
            p("Schedule on-court assignments for all Referees and Line Judges."),
            p("Be able to assist the Referee or Tournament Director wherever needed and be present on site at all times during play."),
            p("If necessary, conduct a clinic for the Referees and Line Judges."),
            p("Arrive at least one (1) hour before the first scheduled match, remain on-site at all times during matches, and leave after the end of play."),
            p("In the absence of the Tournament Director, be responsible for all matters of rules. His or her decision is final for interpretation of rules."),
          ),
        ),
        h(
          "Referee",
          p(
            "The Referee shall:",
            p("Ensure that the on-court rules are observed by the Players, Line Judges, and Ball Persons. He or she must control the match in all respects. He or she can be overruled by the Head Referee or Tournament Director only in matters of interpretation of the rules, not in matters of fact."),
            p("Promptly and accurately score matches using the approved methods provided by the PPA. Be competent in using the scoring system. Track and record when balls are to be changed."),
            p("Take charge of all Line Judges and Ball Persons when on court."),
            p("Be responsible for the calling of net cord service lets."),
            p("Ensure that play is continuous within the rules."),
            p("Determine if a court continues to be fit for play. If a change in condition occurs during a match that the referee considers sufficient to make the court unfit for play or if weather conditions require stoppage of play, the referee should stop play and immediately notify the Head Referee and Tournament Director."),
            p("Give the result of the match to the Tournament Director immediately upon completion of the match and any action taken under the Code of Conduct during the match."),
            p("Provide a detailed report on any Code of Conduct penalty issued in connection with the relevant match."),
          ),
        ),
        h(
          "Line Judges",
          p(
            "The responsibilities for Line Judges shall be as follows:",
            p("Calling “Out” and “Fault” for their respective lines."),
            p("To correct their call immediately upon realizing they have made a mistake."),
            p("To report immediately to the Referee any breach of the Code of Conduct."),
            p("To defer questions from players to the Referee. A Line Judge shall not enter into any discussions with players."),
          ),
        ),
      ),
    ],
  },
  {
    id: "player-responsibilities",
    title: "Player Responsibilities / On-Court Rules and Procedures",
    c: [
      h(
        "Clothing and Equipment",
        p("The PPA strongly encourages all players to wear protective eyewear during matches and warm-ups. While not mandatory, proper eye protection may reduce the risk of injury caused by high-speed balls or inadvertent paddle contact. Players assume all risks associated with not using such equipment."),
        p(
          "A Player shall dress and present themselves in a professional manner at all times on the Tournament site or any official practice site. Clean and customarily acceptable attire as approved by the PPA shall be worn. A player who violates this section may be ordered by the Head Referee or Tournament Director to change his attire or equipment immediately. Failure of a player to comply with such order may result in an immediate default, fines, and/or suspension.",
          hp("Too Much Clothing", "Clothing shall be appropriate based upon weather conditions. Players shall be permitted to wear tights, leggings and other such undergarments in colder weather. However, sweatpants may only be worn with temperatures under 60 degrees Fahrenheit."),
          hp("Too Little Clothing", "Players may be asked by the Head Referee or Tournament Director, to cover up or add additional clothing at any time, if, at their discretion, the Player’s lack of clothing is deemed to be inappropriate."),
          hp("Matching Attire", "Players shall make best efforts to match or color coordinate clothing with their tournament partner."),
          h(
            "Logo Requirements",
            p("Players who are required to wear the PPA logo or other logos as stipulated in that Player’s contract will be deemed in violation of this section if they are in violation of their contract and shall be subject to penalties in the sole discretion of the PPA in addition to any other penalties which may arise from breaching the Player Contract."),
            p("Players who are permitted to wear a sponsor’s logo as stipulated in that Player’s contract will be deemed in violation of this section if they are in violation of their contract and shall be subject to penalties in the sole discretion of the PPA in addition to any other penalties which may arise from breaching the Player Contract."),
            hp("Penalties for Violating this Section", "For a first offense, Player shall pay a fine of $750. For a second offense, Player shall pay a fine of $1500. For a third offense, Player will receive a two-tournament suspension."),
          ),
          hp("Paddle Color/Design", "Paddle faces shall not be designed or decorated in a way which is likely to impair the vision of opposing players or distract opposing players from tracking the ball. For the purposes of this rule, a paddle face is defined as any area of the hitting surface above the top edge of the grip."),
        ),
      ),
      h(
        "Paddle Compliance and Testing",
        h("PPA Paddle Compliance and Testing Policy", p("All paddles used at any PPA event, amateur, professional, or senior professional divisions, must be on the Professional Pickleball Association’s approved equipment list for both amateur and professional divisions.")),
        h("On-Site Paddle Testing", p("PPA tour stops will provide on-site testing, which players may use to confirm compliance. Testing will be available from 4:00 PM to 7:00 PM local time on two days during the tournament; the day before the start of the Pro Singles divisions, and the day before the start of the Pro Doubles divisions.")),
        h(
          "Nature of the Paddle Test",
          p("The Paddle Test shall be administered to the paddle surface using technology consistent with the PPA Tour’s paddle testing standards. These tests are considered on-the-spot testing and will not be sent to a lab for further certification. A trained surface tester will administer this test."),
          p("The Testing Device shall be placed no less than six (6) times on the paddle surface, on both sides, in varying positions and locations, with the average of the six (6) numbers taken as the final score."),
          p("The testing is complete if the final score of the first test is within the allowable range and the paddle is deemed legal. A second and third test may be administered directly following the first test if the final score tests over the legal limit. If all three tests return final scores over the limit, the paddle will be deemed illegal."),
          p("The accepted error range for each application of the roughness test is a score within three (3) points of the maximum which is forty (40). For example, a score that is less than 43 is within the legal limit."),
          p("All tests will be recorded, reported, and signed by all players involved in the match under question. The PPA will keep digital records of each test."),
        ),
        h(
          "Paddle Challenge Procedure",
          p("The PPA has the right to challenge paddle compliance at its sole discretion. Additionally, at any point in a match, a player may challenge the compliance of an opponent’s paddle."),
          p("A paddle challenge must be made to the referee during a timeout or between games. The player whose paddle is challenged may continue competing with the paddle in question. Play may not be delayed, suspended, stopped, or discontinued. If a player changes their paddle during play, they must hand the paddle in question to the referee on the court. All paddles used during a match will be tested."),
          p("At the conclusion of the match, all players on the court must hand their paddles to the referee, and paddles will not be returned to any of the players until all testing has been completed. Any players leaving the court with their paddle after a challenge is called will automatically forfeit the match, be ineligible to play the remainder of the day, and may be subject to further PPA Tour disciplinary actions at the PPA’s sole discretion."),
          p("The PPA will have a surface tester available at each tournament that is calibrated quarterly and tested for accuracy before every tournament against a series of control paddle surfaces."),
          p("If a paddle is challenged and tests as compliant, the challenging player faces a testing fee of $250, which the PPA has the right to deduct from any applicable appearance fees or prize money. In the absence of these deductions, the testing fee must be paid to the PPA within ten (10) days of test administration. Players will not be charged a fee for challenges that are correct. If a player has three (3) unsuccessful challenges during any 180-day rolling period, such player will be suspended from the PPA indefinitely, at the PPA’s sole discretion."),
        ),
        h("Foreign Substances on Paddles", p("No player is permitted to intentionally damage, deface or discolor the paddle by imparting on it any type of foreign item or substance, including any material that causes additional spin. Failure to follow this rule will result in an expulsion from the tour.")),
        h(
          "Offenses",
          h("First Offense", p("If the paddle tests as non-compliant, that player/team will forfeit the already completed match. The losing team will be awarded the victory and move forward in the bracket accordingly.")),
          h("Second Offense", p("Any player whose paddle tests as non-compliant twice within a 180-day rolling period will be suspended from all PPA events for ninety (90) days.")),
          h("Third Offense", p("Any player whose paddle tests as non-compliant three times during any 180-day rolling period will face an indefinite suspension from the PPA for all PPA events.")),
          h(
            "Multiple Offenses Within One Match",
            p(
              "If both opponents/teams have paddles that fail the paddle test, the following protocol will apply to the Offenses listed above:",
              hp("Both Opponents Fail (equal failures)", "the result of the match stands, and the advancing team must play with a new paddle that passes the paddle test."),
              hp("Both Opponents Fail, and Multiple Failures on One Team (unequal failures)", "if one team has more failed paddles than the other, the team with more failures will forfeit the match, and the opposing team advances and must play with a new paddle that passes the paddle test."),
            ),
          ),
        ),
      ),
      h(
        "Continuous Play / Delay of Game",
        p(
          "Once a match starts, play shall be continuous until the match finishes, except: a maximum of twenty-five (25) seconds is allowed between the time the ball goes out of play at the end of one rally, and the time the next ball is served; a maximum of ninety (90) seconds is allowed for a change of sides; and a maximum of one hundred twenty (120) seconds is allowed between games. Violations of this rule will be enforced as follows:",
          p("A serving player or team will receive a Time Violation warning for the first offense in a given match and a Time Violation fault resulting in a loss of serve for each subsequent fault thereafter."),
          p("A receiving player or team will receive a Time Violation warning for the first offense in a given match and a Time Violation fault resulting in a loss of point for each subsequent fault thereafter."),
          p("The referee will be responsible for keeping time between points, changes of side, and games. The referee will announce a fifteen (15) second warning during the changing of sides and between games, but not for time between points."),
        ),
        p("If, for reasons outside of the players control, necessary equipment including the paddle, clothing, or footwear becomes broken or needs to be replaced, the referee may allow the player to replace the broken item within a time the referee deems reasonable. If a player is intentionally delaying the game or taking an unreasonable amount of time to replace the broken equipment, the referee shall assess a Time Violation warning if it is the first violation, or a fault if a warning was already given."),
      ),
      h(
        "Coaching / Coaches / Electronic Devices",
        h(
          "Coaching / Coaches",
          p("Players shall not receive coaching during a tournament match except during a timeout, a change of sides, or between games. Communications of any kind, audible or visible, between a player and a coach may be construed as coaching. The match referee shall determine coaching violations and issue penalties accordingly."),
          p(PENALTY_REFERRAL),
        ),
        h(
          "Electronic Devices",
          p("All players are prohibited from wearing or using any electronic devices from the start or warm-up to the end of the match including during a timeout, medical timeout, change of side, break between games, or any other pause in play. Electronic devices include but are not limited to phones, mp3 players, headphones, electronic watches, or any other wearable or non-wearable electronic device."),
          p(PENALTY_REFERRAL),
        ),
      ),
      h(
        "Defaults",
        hp("During the match", "The Tournament Director may default a player either for a single violation of the Code (immediate default) or as outlined in the Penalty System."),
        hp("On-site", "The Tournament Director may withdraw a player from all events for a single violation of the Code occurring during the event but not during a player’s match."),
        p("In all cases of default, the Tournament Director’s decision shall be final and may not be appealed."),
        h(
          "Penalties",
          p("Any player who is defaulted shall lose all prize money (gross prize money to be paid by PPA), hotel accommodations, and points earned for that event at that tournament."),
          p("At the discretion of the Tournament Director, the player may be withdrawn from all other events, if any, in that tournament."),
          p("In addition, if the Commissioner determines that the default was particularly injurious to the success of the tournament or detrimental to the integrity of the sport, he may consider additional penalties (fines and/or suspensions)."),
        ),
        p(
          "The exception is when the offending incident involves:",
          p("A violation of the dress and equipment provisions set forth in the Rulebook;"),
          p("As a result of a medical condition;"),
          p("A match ending on a delay penalty (Code Violation for Delay of Game) if the delay penalty was the result of a medical condition; or"),
        ),
        p(
          "In doubles:",
          p("A default assessed for violation of the Code shall be assessed against the team."),
          p("The Tournament Director will assess the default penalties against both players on the team."),
          p("At the discretion of the Tournament Director, one or both of the players may be withdrawn from all other events, if any, in that tournament."),
          p("The partner of the player who caused the default shall receive points and prize money from the previous round."),
        ),
      ),
    ],
  },
  {
    id: "prize-money",
    title: "Prize Money",
    c: [
      h(
        "Distribution",
        h("Equal Opportunity", p("Payment of the same prize money must be available to all competitors without discrimination.")),
        h(
          "Timing and Process",
          h(
            "Taxes",
            p("The Tournament shall be responsible for withholding and payment of any taxes consistent with all laws concerning withholding taxes."),
            p("Tournaments must make best efforts to supply tax receipts or forms to the players before they collect their prize money. If tax forms are not available, players should be told when they will receive them and who they can contact if they have a problem. Players must receive the Tournament tax forms required by local law by the last day of the Tour Year or such other date as required by local law."),
            p("Players are solely responsible for their taxes and for providing current tax information on Tournament tax forms."),
            p("The PPA does not maintain current tax information pertaining to players nor does the PPA assume liability for Player tax obligations."),
          ),
          h(
            "General",
            p("Players receive prize money for the round reached, subject to any exceptions in this Section 4."),
            p("Players or teams who receive Wild Cards receive the same prize money as any other player."),
            p("In addition to the player’s applicable income tax deduction, each PPA Tournament shall also withhold from prize money any service fees, fines, or other expenses designated by the PPA."),
          ),
        ),
      ),
      h("Prize Money Breakdowns", p("The Prize Money Breakdowns are available on the official PPA website.")),
      h(
        "Tournament Cancellation or Early Termination",
        h("Tournament Cancellation Without Play Occurring", p("If a singles or doubles event of a Tournament is canceled and there has been no play, players will not receive any prize money.")),
        h("Tournament Cancellation After Play Has Begun", p("If play has commenced and is terminated before the Tournament is concluded, players will receive prize money for the individual round reached.")),
        h("Tournament Cancellation Without Completion of Finals", p("If a Tournament is officially terminated before the finals have been completed, each finalist will receive finalist’s prize money. The difference between the winner’s and finalist’s prize money will revert back to the Tournament.")),
      ),
      h(
        "Withdrawals, Byes, and Defaults",
        h(
          "Withdrawals",
          p("Any player who withdraws from a Tournament prior to his or her first match will not receive any prize money."),
          p("A player who withdraws from a Tournament after he or she starts the first match will receive prize money for reaching the round in which he or she withdrew."),
        ),
        h(
          "Byes",
          p("A player or team who receives one (1) or more consecutive byes and loses his or her first match player will receive prize money for the round reached."),
          p("A player or team who receives one (1) or more consecutive byes and defaults or withdraws from the next round will not receive any prize money."),
        ),
        h(
          "Defaults",
          p(
            "For any disciplinary default occurring in a Tournament after the match begins,",
            p("The advancing player or team will receive prize money for the round reached; and"),
            p("The defaulting player or team will lose all prize money earned for that event at that Tournament, except that if one member of a doubles team did not cause the default, he or she will receive prize money from the previous round."),
          ),
        ),
      ),
    ],
  },
  {
    id: "code-of-conduct",
    title: "Code of Conduct",
    c: [
      h(
        "General Principles",
        p("It is the purpose of this Code of Conduct (the “Code”), as it may be amended from time to time, to serve as a guide for the acceptable professional behavior of players, officials, referees, tournament support personnel, coaches, credentialed persons, and spectators as it relates to the promotion of the positive image of Professional Pickleball and the PPA."),
        p("No player shall violate any provisions under the Code of Conduct of the official PPA Tournament Handbook. Unless otherwise specified, any violation of this section may be subject to penalties including but not limited to loss of serves, loss of points, forfeiture of games, forfeiture of matches, ejection from the tournament, expulsion from PPA Tour events, fines, and any other penalty that the PPA deems appropriate in its sole discretion."),
      ),
      {
        t: "Applicability",
        p: "The Code of Conduct is applicable to all persons involved in any PPA event including: Tournament Directors and officials, players, referees, tournament support personnel, coaches, credentialed persons, and spectators.",
        c: [
          h(
            "Tournaments / Events",
            p("The Code shall apply to all PPA Tournaments and Events, the PPA also reserves the right to take action on any code violation that occurs outside of a PPA event."),
            p("Each tournament agrees to comply with all provisions contained in the PPA Tournament Handbook where applicable."),
          ),
          h("Players", p("Players shall at all times be subject to the Code and the USAPA Rules of Pickleball, as may be adopted by the PPA. Each Player who is accepted to play in a Tournament (singles or doubles, including Wild Cards) must have signed an Official PPA Registration Form prior to commencement of play in the Tournament. The entry form provides that acceptance of the Rules, including the Rules that apply to Tournament entries, acceptance, withdrawals and scheduling, are binding on the player.")),
          h("Tournament Directors, Officials, and Referees", p("The Code shall be upheld by Tournament Directors, Officials, and Referees at all times. It is the obligation of those named in the preceding subsection to uphold and enforce the Code to maintain and promote the integrity of the sport and the PPA.")),
          h("Coaches, Tournament Support Personnel, Credentialed Persons, and Spectators", p("Coaches, Tournament Support Personnel, Credentialed Persons, and Spectators are obligated to follow the Code and can be penalized according to this section five (5) for violations of the code.")),
        ],
      },
      h(
        "Reciprocity",
        h(
          "Sanctions by Other Pickleball Organizations",
          p("The PPA reserves the right to affirm, modify, or reject with respect to any or all PPA Tour events a suspension or other sanction issued against an individual or entity subject to the Code of Conduct either by or on behalf of any other pickleball organization."),
          p("The PPA may suspend provisionally any Covered Person under the Code of Conduct until completion of the PPA’s final determination under this subsection (C)."),
        ),
        h("Sharing of Information", p("The PPA reserves the right to share information concerning a complaint and/or conduct an investigation in conjunction with any other pickleball organization or any other relevant authorities. The PPA may also refer any complaint and/or information received during the course of investigating an allegation or prosecuting a charge to any authorities it considers appropriate in its absolute discretion. The PPA shall have the absolute discretion, where it deems appropriate, to stay in its own investigation pending the outcome of investigations being conducted by other pickleball organizations and/or relevant authorities.")),
      ),
      h(
        "Major Offenses",
        h(
          "Conduct Contrary to the Integrity of the Game",
          p(
            "The favorable reputation of the PPA, its tournaments, and players is a valuable asset and creates tangible benefits to its stakeholders. Accordingly, it is an obligation for players, officials, referees, tournament support personnel, coaches, credentialed persons, and spectators to refrain from engaging in conduct contrary to the integrity of the game of pickleball and the integrity of the PPA, its sponsors, and stakeholders. Conduct contrary to the integrity of the game, the PPA, its sponsors, and stakeholders shall include, but not be limited to, any comments made publicly to the news, online, on podcasts, etc., that unreasonably attack or disparage any person or group of people, a PPA event, sponsor, player, official, referee, employee, or the PPA at large.",
            p("In addition to other penalties that the PPA shall determine to be reasonable, the PPA may also suspend or expel a player without pay and assess fines to a player who violates sub-section 5(D)(i)."),
          ),
          p("Reasonable expressions of legitimate disagreement with PPA policies are not prohibited. However, public comments that one of the slated persons above knows or should reasonably know, will harm the reputation or financial best interests of a PPA event, sponsor, player, official, referee, employee, or the PPA at large are expressly covered by this section."),
        ),
        h(
          "Aggravated Behavior",
          p(
            "No players, officials, referees, tournament support personnel, coaches, credentialed persons, or spectators shall engage in any aggravated behavior which is defined as follows:",
            p("One incident of behavior that is flagrant and particularly injurious to the success of the PPA or its stakeholders or is singularly egregious, in the sole discretion of the PPA."),
            p("A series of two (2) or more violations of this code in consecutive years which singularly do not constitute aggravated behavior, but when viewed together establish a pattern of conduct that is collectively egregious and is detrimental or injurious to the PPA or its stakeholders, a PPA event, a sponsor, player, official, referee, or an employee of the PPA."),
          ),
        ),
      ),
      h(
        "On-Site Player Conduct and Offenses",
        h(
          "Unfair and/or Discriminatory Conduct",
          p(
            "Each Player shall commit to facilitating a diverse and inclusive environment. Each Player acknowledges that discrimination, offensive remarks, or adverse action of any kind arising out of or in connection with an individual’s protected status will not be tolerated, and a Player will face serious and significant sanctions, up to and including fines and suspensions, in the event such actions are determined to have occurred.",
            p("For further clarity, Players shall not discriminate in the provision on the basis of race, ethnicity, gender, national origin, religion, age, or sexual orientation."),
          ),
        ),
        h("Usage of Drugs or Alcohol", p("Players shall refrain from using drugs or alcohol or be under the influence of alcohol or drugs while performing their playing duties (this applies to matches, practices, as well as other PPA events).")),
        h(
          "Ball Abuse",
          p("Players shall not violently, dangerously or with anger hit, kick or throw a ball while on the grounds of the tournament site except in the reasonable pursuit of a point during a match (including warm-up). For purposes of this rule, abuse of balls is defined as intentionally or recklessly hitting a ball out of the enclosure of the court, hitting a ball dangerously or recklessly within the court or hitting a ball with disregard of the consequences."),
          p(PENALTY_ONLY),
        ),
        h(
          "Paddle or Equipment Abuse",
          p("Players shall not violently, dangerously or with anger hit, kick or throw a paddle or other equipment within the premises of the tournament site. For purposes of this rule, abuse of paddles or equipment is defined as intentionally, dangerously and violently destroying or damaging racquets or equipment or intentionally and violently hitting the net, court, umpire’s chair or other fixture during a match out of anger or frustration."),
          p(PENALTY_ONLY),
        ),
        h(
          "Physical Abuse",
          p("Players shall not at any time physically abuse any official, opponent, spectator or other person within the precincts of the tournament site. For purposes of this rule, physical abuse is the unauthorized touching of an official, opponent, and spectator or other person."),
          p(PENALTY_REFERRAL),
        ),
        h(
          "Verbal Abuse",
          p("Players shall not at any time directly or indirectly verbally abuse an official, opponent, sponsor, spectator, employee, or any other person within the premises of the tournament site. Verbal abuse is defined as any statement about an official, opponent, sponsor, spectator or any other person that implies dishonesty or is derogatory, insulting or otherwise abusive."),
          p(PENALTY_REFERRAL_TD),
        ),
        h(
          "Audible Obscenity",
          p("A player shall not use an audible obscenity while on-site. Audible obscenity is defined as the use of words commonly known and understood to be profane and uttered clearly and loudly enough to be heard."),
          p(OBSCENITY_AGGRAVATED),
        ),
        h(
          "Visible Obscenity",
          p("Players shall not make obscene gestures of any kind while on-site. Visible obscenity is defined as the making of signs by a player with hands and/or racquet or balls that commonly have an obscene meaning."),
          p(OBSCENITY_AGGRAVATED),
        ),
        h(
          "Unsportsmanlike Conduct",
          p("Players shall at all times conduct themselves in a sportsmanlike manner and give due regard to the authority of officials and the rights of opponents, spectators and others. Unsportsmanlike conduct is defined as any misconduct by a player that is clearly abusive or detrimental to the success of an event, the PPA and/or the Sport. In addition, unsportsmanlike conduct shall include, but not be limited to, the giving, making, issuing, authorizing or endorsing any public statement having, or designed to have, an effect prejudicial or detrimental to the best interest of the event, the officiating thereof, the PPA, or its stakeholders including but not limited to its sponsors, employees, referees, officials or any other person or organization affiliated with the PPA."),
          p(PENALTY_REFERRAL_TD),
        ),
        h(
          "Coaching and Coaches",
          p("Players may receive coaching during a match (including warm up) in accordance with Section (3)(D). Communication of any kind, audible or visible, between a Player and a coach other than that permitted in Section (3)(D) and the use of any electronic device during prohibited times as outlined in section (3)(D) constitutes a coaching violation."),
          p(
            "Players shall prohibit their coaches on site from:",
            p("Using an audible obscenity or making obscene gestures of any kind;"),
            p("Abusing any official, opponent, spectator, or other person, verbally or physically; and"),
            p("Engaging in conduct contrary to the integrity of the game of Pickleball. Conduct contrary to the integrity of the game of Pickleball shall include, but not be limited to, public comments, whether or not to the media, that unreasonably attack or disparage a Tournament, sponsor, player, official, or the PPA. Responsible expressions of legitimate disagreements with PPA policies are not prohibited. However, public comments that one of the stated persons above knows, or should reasonably know, will harm the reputation or financial best interest of a Tournament, players, sponsor, official, or the PPA are expressly covered by this Section."),
          ),
          p("Violation of this subsection shall subject a player to be penalized in accordance with the Penalty System. In circumstances that are flagrant and particularly injurious to the success of the Tournament, or are singularly egregious, the Referee shall have the authority to relocate the position of a coach if there is reasonable belief that nonpermitted coaching is occurring, or the Referee may order the coach to be removed from the match site or Tournament site and upon his/her failure to comply with such order, may declare an immediate default of such Player."),
        ),
        h(
          "Best Efforts",
          p("A player shall use his best efforts during the match when competing in a tournament."),
          p("For purposes of this rule, the referee of a match shall have the authority to penalize a player in accordance with the Penalty System. In circumstances that are flagrant and particularly injurious to the success of a tournament, or are singularly egregious, the Tournament Director may refer the matter to the Commissioner who shall conduct an investigation to determine whether the player committed a Major Offense of Aggravated Behavior or Conduct Contrary to the Integrity of the Game. Prize money earned at that event shall be held by the PPA until the Commissioner has concluded his investigation and made a determination."),
        ),
        h(
          "Sexual Conduct",
          p(
            "In order to prevent sexual abuse and the negative consequences resulting from the imbalance of a dual relationship, sexual conduct of any kind between a player and his Support Personnel, expressly is discouraged. In addition, the following conduct specifically is prohibited:",
            p("Players shall not advance towards, or have any sexual contact with, any person who is a) under the age of 17 or b) under the age of legal majority in the jurisdiction where the conduct takes place or where the player resides."),
            p("Players shall not sexually abuse a person of any age. Sexual abuse is defined as the forcing of sexual activity by one (1) person on another person a) of diminished mental capacity or b) by the use of physical force, threats, coercion, intimidation, or undue influence."),
            p("Players shall not engage in sexual harassment (for example, by making unwelcome advances, requests for sexual favors, or other verbal or physical conduct of a sexual nature where such conduct may create an intimidating, hostile, or offensive environment)."),
            p("Players shall not share a hotel room with a person who is a) under the age of 17 or b) under the age of legal majority in the jurisdiction where the hotel is located or where the player resides, unless such person is the Players legal guardian or is related to the player. Hotel room per diems shall be withheld from any player who is found to have violated this Hotel Room Policy. Such penalty shall be in addition to any penalties that may be imposed on the Player pursuant to sub-Section 2 below."),
          ),
          p("A violation of this Section shall constitute the major player offense of Aggravated Behavior."),
        ),
        h(
          "Criminal Conduct",
          p(
            "Players shall comply with all relevant criminal laws. For greater certainty and without limiting the foregoing, this obligation is violated if a Player has been convicted of or entered a plea of guilty or no contest to criminal charges or indictment for an offenses including but not limited to:",
            p("Use, possession, distribution, or intent to distribute illegal drugs or substances;"),
            p("Sexual misconduct, harassment, or abuse; or"),
            p("Child abuse."),
          ),
          p("Further, this obligation may be violated if, depending upon the nature of the crime, a Player or Support Personnel member has been convicted of or entered a plea of guilty or no contest to an offense that is a violation of any law specifically designed to protect minors."),
          p("A violation of this Section shall constitute the major player offense of Aggravated Behavior."),
        ),
      ),
      h(
        "Player Conduct Outside of PPA Competition and Events",
        h(
          "Dishonorable or Unprofessional Conduct",
          h("Avoidance of Criticism in Public or Media", p("A Player shall not address criticism of a Tournament, sponsor, player, official, PPA employee, the PPA, or the PPA Tour to the media or public. All such complaints should be forwarded to the PPA.")),
          h("Confidentiality", p("A Player shall not disclose to any PPA non-members information identified as confidential in an official PPA communication (“Confidential Information”) unless otherwise authorized by the PPA in writing or until such time that the information becomes publicly available through PPA-authorized means.")),
          p("A player who violates this subsection will be subject to penalties and fines imposed by the PPA in accordance with the penalty and fine schedule which may also include suspension without pay, fines, and other penalties the PPA determines to be reasonable"),
        ),
        h("Sexual Conduct", p("All players are to abide by the sexual conduct guidelines outlined in Section 5(E)(xii).")),
        h("Criminal Conduct", p("All players are to abide by the criminal conduct guidelines outlined in Section 5(E)(xiii).")),
        h("General Conduct", p("Players shall not promote any pickleball related event, tournament, entity, or the like, other than PPA, MLP, UPA, and their related entities.")),
        h(
          "Player Interaction with Sponsors, Fans and Media",
          p(
            "Player interaction with sponsors is a vital part of the PPA Tour’s commitment to maintaining strong relationships with its partners. These interactions provide valuable exposure and help ensure the continued support and success of its tournaments, events, and programs. It is essential that all players uphold the highest standards of professionalism and commitment when engaging with sponsors and fans.",
            p(
              "Players must make themselves available for media obligations, including but not limited to pre-match and post-match interviews, at the request of the PPA, broadcast partners, or event organizers. These obligations may occur on-site or remotely, and Players are expected to participate in a timely, respectful, and professional manner.",
              p("Failure to comply with media obligations, without prior approval or a valid excuse, may result in disciplinary action at the discretion of the PPA. Penalties may include, but are not limited to, monetary fines and/or PPA point deductions."),
            ),
          ),
          h(
            "Conduct Expectations",
            hp("Professionalism", "Players must conduct themselves with courtesy, respect, and professionalism during all sponsor-related Events and Appearances. This includes but is not limited to sponsor meet-and-greets, play-with-pro events, luncheons and dinners, player signings, and camps/clinics (“Events and Appearances”)"),
            hp("Timeliness", "Players are expected to arrive on time and be prepared for all Events and Appearances."),
            hp("Engagement", "Players should actively engage with fans, sponsors, and their representatives during interactions to ensure a positive experience for all parties involved."),
            hp("Dress Code", "Players must adhere to any specified dress codes for Events and Appearances or wear PPA Tour approved attire."),
            hp("Compliance", "Players must comply with any additional requirements stipulated in their contracts or communicated by the PPA Tour regarding Events and Appearances."),
          ),
          h("Obligations", p("Players are required to fulfill all sponsor related obligations and Events and Appearances as outlined in their contracts.")),
          h(
            "Penalties for Non-Compliance",
            p(
              "To ensure accountability, any failure to meet obligations or any conduct violations during Events and Appearances will result in the following penalties:",
              hp("Missed Obligations", "Players will be penalized up to three percent (3%) of their annual compensation for each missed Event and Appearance."),
              hp("Conduct Violations", "Players who fail to meet the expected standards of professionalism, timeliness, or engagement during any Event and Appearance will face penalties of up to 3% of their annual compensation per incident."),
            ),
          ),
          h(
            "Reporting and Appeals",
            hp("Reporting", "Any issues or failures to comply with contractual obligations will be documented and reviewed by the PPA Tour."),
            hp("Appeals", "Players may submit an appeal in writing within seven (7) days of receiving notice of a penalty. Appeals will be reviewed, and a decision will be provided within fourteen (14) days."),
          ),
        ),
      ),
      {
        t: "Conduct of Officials, Tournament Support Personnel, and Credentialed Persons",
        p: "Accordingly, it is an obligation for Officials, Tournament Support Personnel, and Credentialed Persons to refrain from engaging in conduct detrimental to the PPA or the PPA Tour or contrary to the integrity of the game of Pickleball and to ensure that Tournament partners adhere to the same standard in the activation of their partnership with the Tournament.",
        c: [
          h(
            "Unfair and/or Discriminatory Conduct",
            p("Officials, Tournament Support Personnel, and Credentialed Persons shall not engage in unfair or unethical conduct, including any attempt to injure, disable, or intentionally interfere with the preparation or competition of any Player."),
            p("Officials, Tournament Support Personnel, and Credentialed Persons shall not discriminate in the provision of services on the basis of race, ethnicity, gender, national origin, religion, age, or sexual orientation."),
          ),
          h("Use of Drugs or Alcohol", p("Officials, Tournament Support Personnel, and Credentialed Persons shall refrain from using drugs or alcohol or be under the influence of alcohol or drugs while performing their officiating, coaching, or other duties (this applies to matches, practices, as well as other PPA events).")),
          h(
            "Abuse of Authority; Abusive Conduct",
            p("Officials, Tournament Support Personnel, and Credentialed Persons shall not abuse their position of authority or control and shall not compromise or attempt to compromise the psychological, physical, or emotional well-being of any Player."),
            p("Officials, Tournament Support Personnel, and Credentialed Persons shall not engage in abusive conduct, either physical or verbal, or threatening conduct or language directed towards any Player, Tournament official, PPA staff member, on-court official, coach, parent, spectator, Credentialed Person, or member of the press/media."),
            p("Officials, Tournament Support Personnel, and Credentialed Persons shall not exploit any Player relationship to further personal, political, or business interests at the expense of the best interest of the Player."),
          ),
          h(
            "Sexual Conduct",
            p("Officials, Tournament Support Personnel, and Credentialed Persons shall not advance towards, or have any sexual contact with, any player who is a) under the age of 17 or b) under the age of legal majority in the jurisdiction where the conduct takes place or where the player resides."),
            p("Officials, Tournament Support Personnel, and Credentialed Persons shall not sexually abuse a player of any age. Sexual abuse is defined as the forcing of sexual activity by one (1) person on another person a) of diminished mental capacity or b) by the use of physical force, threats, coercion, intimidation, or undue influence."),
            p("Officials, Tournament Support Personnel, and Credentialed Persons shall not engage in sexual harassment (for example, by making unwelcome advances, requests for sexual favors, or other verbal or physical conduct of a sexual nature where such conduct may create an intimidating, hostile, or offensive environment)."),
            p("Officials, Tournament Support Personnel, and Credentialed Persons shall not share a hotel room with a player who is a) under the age of 17 or b) under the age of legal majority in the jurisdiction where the hotel is located or where the player resides, unless such Official, Tournament Support Personnel, or Credentialed Persons is the player’s legal guardian or is related to the player."),
          ),
          h(
            "Criminal Conduct",
            p(
              "Officials, Tournament Support Personnel, and Credentialed Persons shall comply with all relevant criminal laws. For greater certainty and without limiting the foregoing, this obligation is violated if an Official, Tournament Support Personnel, or Credentialed Person has been convicted of or entered a plea of guilty or no contest to a criminal charge or indictment for an offense involving:",
              p("Use, possession, distribution, or intent to distribute illegal drugs or substances;"),
              p("Sexual misconduct, harassment, or abuse; or"),
              p("Child abuse."),
            ),
            p("Further, this obligation may be violated if, depending upon the nature of the crime, a Official, Tournament Support Personnel, or Credentialed Person has been convicted of or entered a plea of guilty or no contest to an offense that is a violation of any law specifically designed to protect minors."),
          ),
          h(
            "General Conduct",
            p("No person who has been given a credential by a Tournament, including members of the media, may at any time during the Tournament engage in abusive conduct directed towards any player, official, spectator, other credentialed person, Tournament, or PPA staff."),
            p("Officials, Tournament Support Personnel, and Credentialed Persons shall be familiar with, and agree to abide by, the Rules and encourage players to abide by the same."),
            p("Officials, Tournament Support Personnel, and Credentialed Persons shall at all times, whether at a Tournament site or not, refrain from engaging in conduct detrimental to the PPA or the PPA Tour or contrary to the integrity of the game of Pickleball. Conduct detrimental to the PPA or the PPA Tour or contrary to the integrity of the game of Pickleball shall include, but not be limited to, public comments, whether or not to the media, which unreasonably attack or disparage any person, group of people, Tournament, sponsor, player, official, the PPA, or the PPA Tour. Responsible expressions of legitimate disagreement with PPA policies are not prohibited. However, public comments that an Official, Tournament Support Personnel, or Credentialed Person knows, or should reasonably know, will harm the reputation or financial best interests of a Tournament, player, sponsor, official, the PPA, or the PPA Tour are expressly prohibited by this Section."),
            p("Officials, Tournament Support Personnel, and Credentialed Persons shall not disclose to any PPA non-members Confidential Information unless otherwise authorized by the PPA in writing or until such time that the information becomes publicly available through PPA-authorized means."),
          ),
        ],
      },
      {
        t: "Spectator Conduct Violations and Procedures",
        p: "The PPA seeks to foster a safe, comfortable, and enjoyable sports and entertainment experience for every person. In pursuance of this goal, guidelines for spectator conduct are outlined below. Spectators who choose not to comply with this Code of Conduct will be subject to penalty including, but not limited to, ejection without a refund, revocation of paid future admission, and/or prevention from attending future events. Those who choose not to comply may also be in violation of local ordinances resulting in possible arrest and prosecution.",
        c: [
          h(
            "Prohibited Conduct",
            p("Any conduct that is illegal."),
            p("Conduct that results in damage to the venue or other personal property."),
            p("Behavior that is unruly, disruptive, obscene, threatening or violent in nature, including verbal or physical harassment of Players, Officials, Tournament Support Personnel, Credentialed Persons, Staff, Spectators, or any other person on the premises."),
            p("Displaying signs, symbols, images, using language or making gestures that are threatening, abusive, obscene, or discriminatory, including on the basis of race, ethnicity, national origin, religion, gender, gender identity, ability, and/or sexual orientation."),
            p("Displaying signs, symbols, or images for commercial purposes or for electioneering, campaigning or advocating for or against any candidate, political party, legislative issue, or government action."),
            p("Entering or attempting to enter the court or any other location other than that permitted by the Spectator’s ticket or credential."),
            p("Throwing objects of any kind whether on to the court or at other persons."),
            p("Failing to follow requests from venue staff regarding operations, policies and emergency response procedures."),
            p("Irresponsible use or consumption of alcohol or other substances."),
            p("Making unauthorized transmissions or play-by-play accounts of the match."),
            p("Any behavior that otherwise targets other fans or interferes with other fans’ enjoyment of the game."),
          ),
          h(
            "General Conduct Guidelines",
            p("Spectators are expected to treat all Officials, Tournament Support Personnel, and all other persons on the tournament site premises in a professional and courteous manner."),
            p("Spectators shall sit only in their ticketed seats and shall show their tickets when requested."),
            p("Spectators may move to and from their seats between points or between games. Spectators are encouraged to move quickly and to cause as little disruption as possible."),
            p("Spectators are encouraged to report any inappropriate behavior or conduct violations to the nearest security guard or Tournament Support Personnel."),
          ),
        ],
      },
      h(
        "Procedures and Penalties for Conduct Violations",
        h("On-Court Adjudication", p("Any violation of this Code that must by its nature be adjudicated prior to continuation of Tournament play shall be decided immediately by the official or officials given that authority under this Code. Any appeal of such decisions shall be made to the official making the decision, and the official’s judgment with respect to any penalties other than fines shall be final in all cases. The fine portion of any on-court violation may be appealed to the Committee as set out below.")),
        h(
          "Complaints",
          h(
            "Process and Timing for Reporting Alleged Player Violations",
            p("Reporting a Player’s violation of this Code by a Player may originate with the PPA, any Player, or a Tournament official. Violations of the sexual abuse and sexual harassment rules may also be reported by the victim of the violation, in the case of a minor, by his or her parents or legal guardians, or by anyone who witnessed the violation. Complaints shall be directed to the PPA. Complaints must be received by the PPA within one (1) year of the alleged conduct and, where feasible, must be acted upon prior to the time of the next scheduled Committee meeting."),
            p("No complaint, except for violations of the Sexual Conduct, or Criminal Conduct rules, lodged more than one (1) year following knowledge or reason to know of the incident or activity allegedly in violation of the Code may be considered by the PPA."),
          ),
          h("Process and Timing for Reporting Alleged Official, Tournament Support Personnel, or Credentialed Persons Violations", p("Reporting a violation of this Code by Official, Tournament Support Personnel, or Credentialed Persons may originate with the PPA, any Player, or a Tournament official. Complaints shall be directed to the PPA. Complaints must be received by the PPA within one (1) year of the alleged conduct and, where feasible, must be acted upon prior to the time of the next scheduled Committee meeting.")),
        ),
        {
          t: "Review, Appeal, and Hearing",
          p: "For those offenses which require the PPA to conduct a thorough investigation, the PPA may do so either prior or subsequent to notification being given to the Player or person involved. The PPA and the Committee shall keep accurate records of all complaints and the disposition thereof and shall be responsible for recording all penalties imposed upon Players, Officials, Tournament Support Personnel, or Credentialed Persons during any Tour Year.",
          c: [
            h(
              "Review Process",
              h(
                "Notification of Charges",
                p(
                  "If the PPA determines there are grounds for the complaint of misconduct under this Code, the person so charged shall thereupon be notified orally, if possible, and in writing, specifying:",
                  p("the provisions which she is charged as having violated; and"),
                  p("the penalty such a violation carries if so specified in the Code."),
                ),
                p("If the penalty is not so specified, the person shall be advised that the penalty will be determined by the PPA. This notification and any other in the course of a disciplinary proceeding shall be delivered to the player in person, sent to him/her by registered or certified mail, overnight delivery with confirmed delivery or sent by e-mail at her address as shown in the records of the PPA or on the most recent Tournament entry application submitted by the Player prior to the notification. All such notices shall be deemed given five (5) days after mailing."),
              ),
              h("Response to Charges", p("After receipt of notification of the charges and the potential penalties, a person charged with misconduct for which a fine is not automatic, shall have twenty-one (21) days from the date of notice to respond in writing to the allegations. Failure to respond to the charges within the time limit cited above will subject the charged person to the imposition of the fines as determined by the PPA, if the PPA determines that the person committed the violation with which he/she is charged, and such person fails to appeal to the Committee as outlined in this Code.")),
              h("Request for Hearing", p("Any person sanctioned for an offense which is subject to appeal, may request a hearing before the Committee or, in the case of an appeal involving monetary penalties of $2,500 or more, a Major Offense potentially resulting in suspension from play, or other sanction of similar magnitude, a person may request a hearing before the Board of Directors. The PPA must receive a request for a hearing within twenty-one (21) days following notification to the player of the fine or complaint against him/her.")),
            ),
            h(
              "Hearing Process and Timing",
              h(
                "Notification of Hearing Time and Place",
                p("A Player, Official, Tournament Support Personnel, or Credentialed Person requesting a hearing shall be given at least ten (10) days’ notice of the time and place of the hearing. Attendance at the appeal hearing is not mandatory."),
                p("It is intended that the hearing requested take place as soon as possible. If he/she wishes to shorten the time required for notice, the Committee or Board of Directors will cooperate in good faith."),
              ),
              h("Hearing Procedures", p("At the hearing, he/she may call witnesses testifying on his/her behalf and examine witnesses testifying against him/her. He/ she may, if he/she chooses, be represented by counsel at the hearing. The Committee or Board of Directors, as appropriate, shall make a determination, which shall be supported by written findings.")),
            ),
            h("Notification of Decisions", p("Within thirty (30) days of its decision, the Committee or Board of Directors shall give written notice to the Player, Official, Tournament Support Personnel, or Credentialed Person of its decision and the penalty to be imposed, if any, regardless of whether or not a hearing was requested. The decision of the Committee or Board of Directors shall be final and non-appealable.")),
            h(
              "Findings and Action",
              p("Upon review of the complaint and, where appropriate, additional investigation, the CEO may determine that the complaint does not merit further action."),
              p(
                "However, if the CEO determines the complaint does merit further action, after giving the accused individual the opportunity to present his or her views to the CEO or his/her designee, either in person or in writing, at the CEO’s discretion, the CEO may impose appropriate sanctions including:",
                p("Denial of privileges or exclusion of the person in question from any or all Tournaments; or"),
                p("Such other sanctions including monetary sanctions as the CEO may deem appropriate."),
              ),
              p("In addition, the CEO shall have authority to issue a provisional suspension, pending the completion of the investigation and issuance of a final decision on the matter."),
            ),
          ],
        },
        h(
          "Penalty System",
          { p: "The Penalty Schedule to be used for violations of the code is as follows:", table: PENALTY_TABLE },
          p("After the third Code of Conduct Violation, the Referee or Tournament Director shall determine whether each subsequent offense shall constitute a default."),
          p("Point Penalties and Game Penalties must be appealed on site to the Tournament Director or Referee, whose decision shall be final. Any monetary penalties imposed in conjunction with a point penalty may be appealed in accordance with the appeal process in section 5(I)."),
          p("Depending on the severity of the violation, the Tournament Director, the CEO or his/her designee may bypass the penalty schedule and directly issue a match forfeit, ejection, expulsion, or other penalty. These penalties in addition to associated monetary penalties for the Code of Conduct Violation may be appealed in accordance with the appeal process in section 5(I)."),
          p("In addition to fines and point penalties, the PPA may also assess other penalties at its sole reasonable discretion including but not limited to suspension without pay"),
        ),
        { t: "Fine Schedule", table: FINE_TABLE },
      ),
    ],
  },
  {
    id: "sports-betting",
    title: "Sports Betting",
    c: [
      h(
        "Introduction",
        h(
          "Background",
          p("The Professional Pickleball Association (PPA) Tour is strongly committed to maintaining the integrity of the PPA Tour, its events, players, coaches, and other PPA Tour personnel. Gambling, particularly on PPA Tour events or other sports presents potential risks to the integrity of our competition and can negatively impact the association and its stakeholders. We, therefore, owe it to our fans and everyone associated with the PPA Tour to take all appropriate steps to safeguard our sport against possible threats from legal gambling as well as gambling in a legal, regulated context."),
          p("This document sets out the guiding principles and provides general advice to all pickleball participants and officials on the issues surrounding the integrity of pickleball and betting. These guidelines are to be read with the Professional Pickleball Association Tournament Rulebook. These guidelines will be reviewed regularly by the PPA Tour to ensure they maintain their relevance."),
        ),
        h(
          "Definitions",
          p(
            "“Covered Persons” – This PPA Tour Sports Betting & Integrity Policy applies to the following persons:",
            p("All athletes, professional and amateur, who compete in PPA Tour events."),
            p("All coaches, trainers, or referees who may have access to privileged information."),
            p("Each employee of the PPA Tour."),
            p("Each independent contractor of the PPA Tour who has the potential or perceived influence over or privileged knowledge related to PPA Tour events."),
            p("Executive members of Dundon Capital who have the potential or perceived influence over or privileged knowledge related to PPA Tour events."),
          ),
          p("“Sports Betting” – Sports betting, gambling, and wagering are defined as staking, risking, or receiving anything of value, financial or otherwise, in connection with a sporting event of any kind, regardless of the location in which the sporting event takes place or in which the wager is placed. This definition encompasses a wide range of activities including, but not limited to, those available in any gaming facility, casino, lottery facility, racetrack facility, or on the internet or electronically (i.e., mobile sports betting)."),
          p("“PPA Tour Events” – All tournaments, matches, or other events organized or promoted by the PPA Tour."),
          p("“Pickleball” – A game between two to four players in which players use paddles to hit a plastic ball over a net. For clarity, this does not include tennis, table tennis, or paddleball."),
          p("“Inside Information” – Any information relating to a match or competition that an individual possesses by virtue of their position within the sport and that is not in the public domain or readily accessible by the public. Inside Information may include certain information regarding the competitors in a match or competition, the conditions, tactical considerations or any other aspect of a match or competition."),
        ),
        h("Policy Scope", p("This PPA Tour Sports Betting & Integrity Policy strictly applies to all Covered Persons defined in this document, although the PPA Tour expects all individuals associated with PPA Tour events to understand and abide by the standards of conduct outlined in this policy.")),
        h("Standards of Conduct", p("All Covered Persons are expected to know the rules and regulations laid out in this document. Failing to abide by the rules and regulations laid out in this document will result in punishment by the PPA Tour. While participating in non-PPA Tour events, Covered Persons are expected to adhere to the guidelines and standards of conduct related to the governing body running such event. If you have any questions regarding this policy, please reach out to PPA Integrity Info via email at integrityinfo@ppatour.com. The PPA Tour expects all its athletes, employees, and other stakeholders to adhere to the highest level of integrity no matter the event.")),
        h("Illegal Betting", p("Covered Persons may not engage or attempt to engage – nor instruct, ask, permit, cause, or enable other individuals or entities to engage or attempt to engage – in any form of illegal Sports Betting Activity in relation to any sport or event. Such activity includes but is not limited to, placing bets with illegal or unlicensed bookmakers (including, but not limited to, placing bets themselves and/or placing bets on behalf of or through a third party), operating an illegal or unlicensed bookmaker, or facilitating illegal or unlicensed bookmaking activity. Furthermore, Covered Persons may not engage in any illegal gambling activity that is unrelated to sports as this may jeopardize the integrity and standards of the PPA Tour. Covered Persons should be aware of and understand the sports betting laws and regulations in any jurisdictions in which they reside, compete, or travel.")),
        h(
          "Betting on Pickleball Events",
          p("While participating as part of the PPA Tour, Covered Persons may not engage, nor attempt to engage in any legal or illegal Sports Betting Activity related in any way to other Pickleball competitions. This includes the PPA Tour, Major League Pickleball, the Association of Pickleball Professionals, and any other events sanctioned by USA Pickleball."),
          p("Covered Persons may not instruct, ask, permit, cause, or enable other individuals or entities to engage, nor attempt to engage, in any form of betting on Pickleball competitions."),
          p("For clarity, this standard of conduct includes not only Sports Betting Activity pertaining to Pickleball Competition outcomes but also any other proposition bets in which individuals may wager on particular aspects or details associated with a Pickleball Competition."),
          p("This standard of conduct also includes Sports Betting Activity relating to multisport bets (often known as parlays) that combine Pickleball Competitions with other non-Pickleball Competitions."),
          p("It will be deemed a violation of this Policy irrespective of whether the Covered Person receives or stands to benefit directly or indirectly from such a bet. Additionally, the outcome and nature of the bet do not determine whether or not the Covered Person violated the Policy."),
        ),
        h("Betting on Non-Pickleball Events", p("Covered Persons may engage in legal Sports Betting Activity related to other sports that have no connection to Pickleball Competitions. Covered Persons may also engage in legal betting activity unrelated to sports (i.e., casino games, card games, etc.)")),
        h(
          "Inside Information",
          p("Given Covered Persons position with the PPA Tour, they may have access to non-public information (i.e., injuries, coaching strategy, etc.). This information is considered sensitive information and can be used for the purposes of betting. Covered Persons may not request or disclose, directly or indirectly, any non-public information that could potentially provide an advantage in Sports Betting Activity related to Pickleball Competitions to any person that does not have a legitimate need to know such non-public information."),
          p("The use of any non-public information for the purpose of betting, or sharing it with another individual whether or not it is used for betting, is strictly prohibited under the PPA Tour Sports Betting & Integrity Policy."),
          p("Covered Persons are expected to reasonably know and understand what information is considered to be non-public information and shall not disclose it via any official or non-official media channel, which includes social media."),
        ),
        h(
          "Event Manipulation",
          p("Covered Persons must play fair, act with integrity, and never manipulate the outcome or any individual aspect of a Pickleball Competition. Furthermore, Covered Persons may not influence nor attempt to influence any Pickleball event in any such way that the outcome or any other aspect is determined by anything other than the competitors’ merits. This includes but is not limited to, deliberately losing, deliberately underperforming, manipulating the number of points scored, the misapplication of rules, and interfering with any playing surface or equipment."),
          p("This standard of conduct also includes commenting on betting odds regardless of whether or not the individual participated in the competition on which they are commenting. Covered Persons should refrain from referencing betting odds relating to Pickleball events as this may cause there to be a perception that the results are manipulated for betting purposes. Covered Persons will be in violation of this standard of conduct even if their attempts to influence or manipulate are unsuccessful."),
        ),
        h("Bribery & Gifts", p("Covered Persons may not be involved, directly or indirectly, with the offering, giving, acceptance, or receipt of a bribe, gift, or any type of consideration, financial or otherwise, that could directly or indirectly result in the improper influencing or manipulation of any PPA Tour Competition or any other Pickleball Competition in any way. This includes the solicitation or acceptance of any benefit that results in the potential manipulation of the outcome of any aspect of a Pickleball Competition. Covered Persons may be in violation of this standard of conduct even if they do not influence or manipulate any PPA Tour Competition or any other Pickleball Competition.")),
        h("Sports Betting Endorsements & Services", p("Covered Persons, when acting in a personal capacity, must not advertise, promote, or provide services or endorsements to any third party that is related in any way to Sports Betting Activity unless authorized in writing by the PPA Tour. Covered Persons are also prohibited from advertising, promoting, or discussing any betting activity publicly in which they participate.")),
        h(
          "Obligation to Report",
          p("Covered Persons are obligated to report suspected, anticipated, or known violations of this policy, without undue delay and unprompted at first available opportunity, by email at integrityinfo@ppatour.com or via the PPA online reporting website at PPATour.com/reporting."),
          p("Covered Persons must report such information whether or not they are directly involved with the matter or should have reasonably been aware of the matter."),
          p("Covered Persons must not retaliate against any individual who, in good faith, reports a matter in accordance with this Policy."),
          p("Failure to report any potential or known violations of this Policy will be deemed a violation of the PPA Tour Sports Betting & Integrity Policy. If individuals have any questions pertaining to reporting, they should email their questions or concerns to integrityinfo@ppatour.com."),
        ),
        h(
          "Obligation to Cooperate",
          p("Covered Persons are required to cooperate and affirmatively participate in any internal or external investigation of a suspected violation of this policy. Failure to cooperate with an investigation will be deemed a violation of the policy. This includes attending any interview with the PPA Tour, or any person appointed by the PPA Tour, which they are directed to attend and to fully and truthfully answer all questions asked of them in the interview other than a question where the answer would render the Covered Person liable to prosecution for an indictable offense."),
          p(
            "Covered Persons must also cooperate by the following actions:",
            p("Producing documents and records related to any matter that is the subject of an investigation being conducted pursuant to this Betting Policy (including telephone records and internet service records);"),
            p("Providing their mobile phone(s), other personal electronic device(s) and computer(s), as well as access to any cloud-based storage used in association with those devices so that it may be images and examined by forensic experts to assist with an investigation being conducted pursuant to this policy;"),
            p("Providing any login credentials necessary to access any device or system on which data are stored, including on any social media platform."),
          ),
        ),
      ),
      h(
        "Disciplinary Action",
        h("Interpretation & Enforcement", p("The PPA Tour reserves the sole right to interpret and enforce the standards of conduct outlined in this policy. Specifically, the Commissioner shall maintain the sole responsibility and authority to issue disciplinary decisions relating to violations of this policy.")),
        h(
          "Sanctions",
          p(
            "Covered Persons whom the PPA Tour determines to be in violation of this policy will be subject to discipline, which shall vary based on the nature of the violation. Examples of such disciplinary action include, but are not limited to, fines, termination of employment, and temporary or permanent bans from ongoing or future PPA Tour Competitions. In appropriate cases, the PPA Tour reserves the right to refer violations of this policy to law enforcement. The PPA Tour also may share information with other relevant authorities, including Pickleball Administrators, bookmakers, and other Betting Organizations where the PPA Tour considers it reasonably necessary to disclose such information for such third parties to carry out their respective functions.",
            p("The PPA Tour reserves the right to consider a wide range of mitigating or aggravating factors when determining appropriate disciplinary action in any particular case. Examples of such factors include, but are not limited to, timely or untimely admissions of guilt, involvement of blackmail or coercion, cooperation with investigations, isolated or repeated violations, and participation in training or education modules."),
          ),
        ),
        h("Evidentiary Standards", p("The PPA Tour must satisfactorily demonstrate that there has been a violation of this policy prior to imposing disciplinary action for such violations. The severity of the alleged violation shall be used to determine the appropriate standard of proof. The PPA Tour reserves the right to review and assess all types and forms of evidence and will issue a written and reasoned decision following its assessment of the evidence.")),
        h(
          "Appeal and Reinstatement",
          p(
            "Written disciplinary decisions will outline, as applicable, conditions of appeal and reinstatement. Examples of such conditions may include but are not limited to, attendance at educational or counseling sessions, payment of fines, or cooperation with investigations.",
            p("A Covered Person may appeal a disciplinary decision related to any misconduct set forth in this policy. If an individual wishes to file an appeal, he or she shall make a written request addressed to the PPA Tour."),
            p("The PPA Tour reserves the right to assess whether all terms and conditions have been met prior to reinstatement."),
          ),
        ),
        h("Mutual Recognition", p("The PPA Tour may, without conducting its own proceedings, recognize and give effect to integrity-related decisions and sanctions pertaining to current or prospective Covered Persons by other Pickleball organizations, including any suspensions or permanent ban by another Pickleball organization. Without limitation, PPA Tour may deny entry to a PPA Tour event to any athlete, trainer, coach, employee, or team member who is subject to an integrity-related investigation or disciplinary proceedings of another Pickleball organization.")),
      ),
    ],
  },
];
