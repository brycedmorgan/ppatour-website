/**
 * The volunteer page's FAQ, verbatim, in its own module so the contact-form
 * triage (lib/forms/knowledge.ts) can quote it. The page renders this list;
 * the auto-answers cite it. One source, so an answer sent by email can never
 * disagree with the page it points at.
 *
 * ⚠ Edit the copy HERE, not on the page. Every entry is the volunteer team's
 * own wording; the triage prompt is told to quote, never to paraphrase policy.
 */
export type VolunteerFaq = { q: string; a: string };

export const VOLUNTEER_FAQS: VolunteerFaq[] = [
  {
    q: "What are the next steps after submitting my volunteer application?",
    a: "Our volunteer team will review your application and follow up by email with next steps, including shift selection and orientation details.",
  },
  {
    q: "Do I attend an orientation before my shift begins?",
    a: "Yes. We will be holding a venue tour/orientation before the tournament begins that all volunteers are required to attend. More information about dates and times will be communicated to you before the tournament begins.",
  },
  {
    q: "How long are the shifts?",
    a: "The length of each shift varies depending on what you are signed up for. Most shifts are 5–6 hours.",
  },
  {
    q: "Does the tournament provide housing or transportation assistance?",
    a: "No, all volunteers are required to find their own accommodations and lodging. The tournament does not reimburse expenses.",
  },
  {
    q: "Are there age restrictions to volunteer?",
    a: "Volunteers at the Carvana PPA Tour must be 18 by the first day of the tournament — no age ceiling. We ask our volunteers to pay careful attention to the physical requirements for the position they are interested in, as some tasks will require lifting, standing for long periods of time, being in the sun, or having specific experience with technology. We rely on our volunteers to select the volunteer position that will be a good fit for them and are ready to answer questions you may have.",
  },
  {
    q: "What do I need to wear/bring?",
    a: "All PPA volunteers receive a tournament shirt and a hat to wear on your shift. The balance of the uniform is the responsibility of the volunteer. You may wear whatever pants or shorts you'd like. Shoes need to be closed toe and comfortable for standing and walking for many hours.",
  },
  {
    q: "Can I volunteer with my friends/family?",
    a: "If noted on an application, every effort is made to coordinate your schedule with family and friends, but we cannot guarantee such. All parties should select similar availability on their application and make a note in the comment section with whom they would like to be assigned. There is always a chance that shifts may change to accommodate health and weather challenges. Volunteers need to be flexible so that we can take care of patrons and one another.",
  },
  {
    q: "How do I get my parking pass, credential and courtside ticket?",
    a: "You will receive an email before the tournament containing all parking information. Your credential will be picked up during orientation. We will give you your courtside ticket when you check in for your volunteer shift that day.",
  },
  {
    q: "Will I get to watch pickleball while volunteering?",
    a: "Volunteers are welcome to watch pickleball before and after their shifts and on days when they are not scheduled. Volunteers have access to the grounds all week. Volunteers are given a Championship Court ticket on the day they volunteer. Volunteers must relinquish the seat immediately if a ticket holder arrives.",
  },
  {
    q: "Will I get to meet players?",
    a: "Some volunteer positions involve interaction with players. It is important that while in uniform, on duty, and in restricted areas requiring credentials for access, volunteers respect the privacy of the players and do not ask for autographs or photos. Volunteers that violate this code will lose their credentials and forfeit an invitation to volunteer in the future. Volunteers are welcome to join the public at scheduled player interviews and autograph sessions while in uniform, but no preferential treatment is given.",
  },
  {
    q: "I work full time. Can I volunteer for evening or weekend shifts only?",
    a: "Yes, we have many volunteer shifts that take place in the evenings and on the weekends of the tournament. However, these are often the most frequently requested shifts. Those who have more flexibility in their schedule and are willing to cover weekday shifts will more easily get placed.",
  },
  {
    q: "Can I bring a bag into the tournament?",
    a: "Yes, bags are allowed inside all venues.",
  },
  {
    q: "Can I bring and/or drink alcohol at the venue?",
    a: "No one may bring alcohol onto the tournament grounds or into the volunteer support services tent. Absolutely NO alcohol consumption is permitted while on duty and in uniform.",
  },
  {
    q: "Can I bring a camera or use my mobile phone to take pictures?",
    a: "Mobile phone use while volunteering is limited to assisting patrons or one another. Phones must be silenced on all courts, including the player practice courts. Use of flashes is prohibited. No photos may be taken with players while in your volunteer uniform and wearing credentials. Professional cameras are limited to Media Passes only.",
  },
];
