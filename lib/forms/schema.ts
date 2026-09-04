/**
 * Client-safe form definitions — field lists + display copy only, NO routing
 * logic (recipients, subjects, sheet tabs live server-side in ./routing.ts so
 * inbox addresses never ship to the browser). Both the <InquiryForm> component
 * and the /api/form-submit route read these to stay in sync: the route
 * validates against the same `required` flags + conditional rules the form
 * renders.
 *
 * Fields mirror the live ppatour.com Gravity Forms 1:1 (exported 2026-07-27).
 * To add a form: add an entry here (fields + copy) and a matching entry in
 * ./routing.ts (recipient inbox + subject + sheet tab).
 */

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox" // multi-select group → value is string[]
  | "consent" // single required agreement checkbox
  | "file"
  | "signature"
  | "heading"; // display-only section divider

export type FormField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Render at half width on sm+ so two fields share a row. */
  half?: boolean;
  options?: string[]; // select / radio / checkbox
  /** Agreement text for `consent` (may contain simple anchor HTML). */
  consentText?: string;
  placeholder?: string;
  maxLength?: number;
  min?: number; // number
  accept?: string; // file (comma-separated extensions/mime)
  multiple?: boolean; // file
  /** Small helper text shown under the control. */
  help?: string;
  /**
   * Conditional visibility: show this field only when another field's value
   * equals `value` (radio/select) or, for a checkbox group, includes `value`.
   */
  showIf?: { field: string; value: string };
};

export type FormSchema = {
  key: string; // URL/tab key — matches routing config + sheet tab
  eyebrow: string;
  heading: string;
  intro?: string;
  submitLabel: string;
  successTitle: string;
  successBody: string;
  /** Compact single-column layout (newsletters). */
  compact?: boolean;
  fields: FormField[];
};

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const YESNO = ["Yes", "No"];
const EVENT_COUNT = ["0", "1-2", "3-4", "5-6", "7+"];

export const FORM_SCHEMAS: Record<string, FormSchema> = {
  // ── Contact (GF #5) ───────────────────────────────────────────────
  contact: {
    key: "contact",
    eyebrow: "Contact",
    heading: "Got a Question? No Problem.",
    intro:
      "Let us know if you have a question about the PPA. Pick the topic that fits and we'll route your message to the right team.",
    submitLabel: "Submit",
    successTitle: "Thanks for contacting us!",
    successBody: "We will get in touch with you shortly.",
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true, half: true, maxLength: 120, placeholder: "First" },
      { name: "lastName", label: "Last name", type: "text", required: true, half: true, maxLength: 120, placeholder: "Last" },
      { name: "phone", label: "Phone", type: "tel", half: true, maxLength: 40, placeholder: "Phone" },
      { name: "email", label: "Email", type: "email", required: true, half: true, maxLength: 160, placeholder: "Email Address" },
      {
        name: "topic",
        label: "Inquiry topic",
        type: "select",
        required: true,
        options: ["Pickleball Brackets/Tournaments", "Registrations", "Tickets", "PBTV/Broadcasting", "Public Relations", "Sponsorship", "Marketing", "PPA Challenger", "Other"],
      },
      { name: "message", label: "Questions/Comments", type: "textarea", maxLength: 2000, placeholder: "Questions/Comments" },
    ],
  },

  // ── Careers (GF #9) ───────────────────────────────────────────────
  careers: {
    key: "careers",
    eyebrow: "Careers",
    heading: "Apply Here",
    intro: "Tell us about yourself and the roles you're interested in. Attach a résumé and we'll be in touch.",
    submitLabel: "Submit",
    successTitle: "Thanks for contacting us!",
    successBody: "We will get in touch with you shortly.",
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true, half: true, maxLength: 120, placeholder: "First" },
      { name: "lastName", label: "Last name", type: "text", half: true, maxLength: 120, placeholder: "Last" },
      { name: "phone", label: "Phone", type: "tel", half: true, maxLength: 40, placeholder: "Phone" },
      { name: "email", label: "Email", type: "email", required: true, half: true, maxLength: 160, placeholder: "Email Address" },
      { name: "positions", label: "What position(s) are you interested in?", type: "text", maxLength: 200 },
      { name: "dallas", label: "Willing to work from Dallas, TX?", type: "radio", options: YESNO },
      { name: "message", label: "Tell us about yourself…", type: "textarea", maxLength: 2000 },
      { name: "resume", label: "Upload your résumé", type: "file", accept: ".pdf,.doc,.docx", help: "PDF or Word. Optional." },
    ],
  },

  // ── Integrity report (GF #8) ──────────────────────────────────────
  reporting: {
    key: "reporting",
    eyebrow: "Integrity",
    heading: "Report Here",
    intro:
      "Report anything related to the integrity of the sport, especially about players and gambling. Your identity will remain anonymous unless we are approved to use your name.",
    submitLabel: "Submit",
    successTitle: "Thanks for contacting us!",
    successBody: "We will get in touch with you shortly.",
    fields: [
      { name: "firstName", label: "First name", type: "text", half: true, maxLength: 120, placeholder: "First" },
      { name: "lastName", label: "Last name", type: "text", half: true, maxLength: 120, placeholder: "Last" },
      { name: "phone", label: "Phone", type: "tel", half: true, maxLength: 40, placeholder: "Phone" },
      { name: "email", label: "Email", type: "email", half: true, maxLength: 160, placeholder: "Email Address" },
      { name: "message", label: "Details", type: "textarea", maxLength: 4000, placeholder: "Tell us more information" },
    ],
  },

  // ── Hospitality / VIP (GF #17) ────────────────────────────────────
  hospitality: {
    key: "hospitality",
    eyebrow: "Hospitality",
    heading: "Hospitality",
    intro: "Tell us about your group and we'll build the right hospitality experience.",
    submitLabel: "Submit",
    successTitle: "Thanks for contacting us!",
    successBody: "We will get in touch with you shortly.",
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true, half: true, placeholder: "First" },
      { name: "lastName", label: "Last name", type: "text", required: true, half: true, placeholder: "Last" },
      { name: "phone", label: "Phone", type: "tel", half: true, maxLength: 40, placeholder: "Phone" },
      { name: "email", label: "Email", type: "email", required: true, half: true, placeholder: "Email Address" },
      { name: "city", label: "City", type: "text", required: true, half: true, placeholder: "City" },
      { name: "state", label: "State", type: "text", required: true, half: true, placeholder: "State" },
      { name: "participants", label: "Approx. number of participants", type: "number", required: true, min: 1, half: true },
      { name: "date", label: "Date", type: "date", required: true, half: true },
      { name: "eventType", label: "Type of event", type: "radio", required: true, options: ["Corporate Event", "Birthday Party", "Other"] },
      { name: "eventTypeOther", label: "Please specify your event type", type: "text", showIf: { field: "eventType", value: "Other" } },
      { name: "notes", label: "Special requests / notes (optional)", type: "textarea", maxLength: 2000 },
    ],
  },

  // ── Host a tournament / Classic Series RFP (GF #7) ────────────────
  "host-tournament": {
    key: "host-tournament",
    eyebrow: "Host a Tournament",
    heading: "PPA Tour Classic Series RFP",
    intro:
      "Interested in hosting a PPA Tour event at your venue? Submit your venue details and any supporting documents. Selected venues will be contacted to finalize a contract.",
    submitLabel: "Submit",
    successTitle: "Thanks for contacting us!",
    successBody: "We will get in touch with you shortly.",
    fields: [
      { name: "venueName", label: "Name of venue", type: "text", half: true, placeholder: "Name of Venue" },
      { name: "address", label: "Address", type: "text", half: true, placeholder: "Address" },
      { name: "contactName", label: "Contact person name", type: "text", half: true, placeholder: "Contact Person Name" },
      { name: "email", label: "Email", type: "email", half: true, placeholder: "Email Address" },
      { name: "phone", label: "Phone", type: "tel", half: true, maxLength: 40, placeholder: "Phone" },
      { name: "courts", label: "Number of courts", type: "text", placeholder: "Number of Courts (Minimum of 16)" },
      { name: "courtCapacity", label: "Humana Championship Court capacity", type: "text", placeholder: "Humana Championship Court Capacity (Minimum 250)" },
      { name: "backupIndoor", label: "Backup indoor location?", type: "radio", options: YESNO, half: true },
      { name: "wifi", label: "Does your venue have wifi?", type: "radio", options: YESNO, half: true },
      { name: "wifiDetails", label: "If yes, please provide details on the quality and coverage of the Wifi service, including any limitations or restrictions.", type: "textarea", maxLength: 2000 },
      { name: "staffing", label: "Staffing and Volunteers Availability: Does your venue have sufficient staffing and access to volunteers to support the event? Please provide details on the number of available staff and volunteers, their roles and responsibilities, and their experience in managing similar events.", type: "textarea", maxLength: 2000 },
      { name: "parking", label: "Parking Availability: Does your venue provide parking facilities for event participants and attendees? If yes, please provide details on the availability, capacity, and any restrictions or costs associated with parking at the venue.", type: "textarea", maxLength: 2000 },
      { name: "accommodate400", label: "Can your venue accommodate a minimum of 400 players for the event?", type: "radio", options: YESNO },
      { name: "bid", label: "Are you willing to provide a PPA Tour sanctioning bid? If yes, please specify the bid amount. The PPA Venue designation will be awarded to the venue with the highest bid.", type: "textarea", maxLength: 2000 },
      { name: "documents", label: "If there are any relevant documents that could support your application, please attach them here.", type: "file", multiple: true },
    ],
  },

  // ── International event inquiry (GF #20) ───────────────────────────
  "event-inquiry": {
    key: "event-inquiry",
    eyebrow: "Bring an Event to Your Market",
    heading: "PPA Tour Event Inquiry Form",
    intro: "Interested in bringing a PPA Tour event to your city or country? Tell us about your organization and proposed event.",
    submitLabel: "Submit",
    successTitle: "Thanks for contacting us!",
    successBody: "We will get in touch with you shortly.",
    fields: [
      { name: "orgName", label: "Organization name", type: "text", required: true, half: true, placeholder: "Organization Name" },
      { name: "contactPerson", label: "Contact person", type: "text", required: true, half: true, placeholder: "Contact Person" },
      { name: "email", label: "Email address", type: "email", required: true, half: true, placeholder: "Email Address" },
      { name: "phone", label: "Phone number", type: "tel", required: true, half: true, maxLength: 40, placeholder: "Phone Number" },
      { name: "city", label: "City", type: "text", required: true, half: true, placeholder: "City" },
      { name: "country", label: "Country", type: "text", required: true, half: true, placeholder: "Country" },
      { name: "years", label: "Proposed event year", type: "checkbox", required: true, options: ["2025", "2026", "2027", "2028"] },
      { name: "info", label: "Additional information (optional)", type: "textarea", maxLength: 2000 },
    ],
  },

  // ── PPA sponsored private event (GF #19) ──────────────────────────
  "private-event": {
    key: "private-event",
    eyebrow: "Private Events",
    heading: "PPA Sponsored Private Event",
    intro: "Host a private event with the PPA Tour. Tell us what you have in mind.",
    submitLabel: "Submit",
    successTitle: "Thanks for contacting us!",
    successBody: "We will get in touch with you shortly.",
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true, half: true, placeholder: "First Name" },
      { name: "lastName", label: "Last name", type: "text", required: true, half: true, placeholder: "Last Name" },
      { name: "phone", label: "Phone", type: "tel", required: true, half: true, maxLength: 40, placeholder: "Phone Number" },
      { name: "email", label: "Email", type: "email", required: true, half: true, placeholder: "Email Address" },
      { name: "street", label: "Street address", type: "text", required: true, placeholder: "Street Address" },
      { name: "city", label: "City", type: "text", required: true, half: true, placeholder: "City" },
      { name: "state", label: "State / Province", type: "text", required: true, half: true, placeholder: "State / Province" },
      { name: "zip", label: "ZIP / Postal Code", type: "text", required: true, half: true, placeholder: "ZIP / Postal Code" },
      { name: "country", label: "Country", type: "text", required: true, half: true, placeholder: "Country" },
      { name: "eventType", label: "Type of event", type: "radio", required: true, options: ["Birthday Party", "Corporate Event", "Other"] },
      { name: "companyName", label: "Company name", type: "text", required: true, showIf: { field: "eventType", value: "Corporate Event" } },
      { name: "otherEventType", label: "Other event type", type: "text", required: true, showIf: { field: "eventType", value: "Other" } },
      { name: "partySize", label: "Estimate of party size", type: "number", required: true, min: 1, placeholder: "Number of guests" },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "notes", label: "Special requests / notes (optional)", type: "textarea", maxLength: 2000 },
    ],
  },

  // ── Ambassador program application (GF #6) ────────────────────────
  ambassador: {
    key: "ambassador",
    eyebrow: "Ambassador Program",
    heading: "Ambassador Program Application",
    intro: "Represent the PPA Tour in your community. Tell us about yourself and your reach.",
    submitLabel: "Submit",
    successTitle: "Thanks for contacting us!",
    successBody: "We will get in touch with you shortly.",
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true, half: true, placeholder: "First" },
      { name: "lastName", label: "Last name", type: "text", required: true, half: true, placeholder: "Last" },
      { name: "phone", label: "Phone", type: "tel", required: true, half: true, maxLength: 40, placeholder: "Phone" },
      { name: "email", label: "Email", type: "email", required: true, half: true, placeholder: "Email Address" },
      { name: "street", label: "Street address", type: "text", required: true, half: true, placeholder: "Street Address" },
      { name: "apt", label: "Apartment, suite, etc.", type: "text", half: true, placeholder: "Apartment, suite, etc." },
      { name: "city", label: "City", type: "text", required: true, half: true, placeholder: "City" },
      { name: "state", label: "State", type: "text", required: true, half: true, placeholder: "State" },
      { name: "zip", label: "Zip code", type: "text", required: true, half: true, placeholder: "Zip Code" },
      { name: "volunteeredBefore", label: "Have you volunteered at a PPA event before?", type: "radio", required: true, options: YESNO, half: true },
      { name: "eventsAttended", label: "How many PPA events have you attended?", type: "radio", required: true, options: EVENT_COUNT },
      { name: "careerBackground", label: "Please provide a brief explanation of your career background (work- and/or pickleball-related).", type: "textarea", required: true, maxLength: 2000 },
      { name: "whyAmbassador", label: "Why do you want to be a PPA Ambassador?", type: "textarea", required: true, maxLength: 2000 },
      { name: "howPromote", label: "How will you help promote PPA events?", type: "textarea", required: true, maxLength: 2000 },
      { name: "willingTravel", label: "How many PPA events are you willing to travel to (at your own expense) each year?", type: "radio", required: true, options: EVENT_COUNT },
      { name: "qualifications", label: "What skills or characteristics make you a qualified candidate to perform the essential duties of a PPA Ambassador?", type: "textarea", required: true, maxLength: 2000 },
      { name: "socialPlatforms", label: "What social media platforms are you on? (Select all that apply)", type: "checkbox", required: true, options: ["Instagram", "TikTok", "X (Twitter)", "Facebook"] },
      { name: "instagramHandle", label: "Instagram handle", type: "text", required: true, half: true, showIf: { field: "socialPlatforms", value: "Instagram" } },
      { name: "instagramFollowers", label: "# of followers on Instagram", type: "number", required: true, half: true, min: 0, showIf: { field: "socialPlatforms", value: "Instagram" } },
      { name: "tiktokHandle", label: "TikTok handle", type: "text", required: true, half: true, showIf: { field: "socialPlatforms", value: "TikTok" } },
      { name: "tiktokFollowers", label: "# of followers on TikTok", type: "number", required: true, half: true, min: 0, showIf: { field: "socialPlatforms", value: "TikTok" } },
      { name: "xHandle", label: "X (Twitter) handle", type: "text", required: true, half: true, showIf: { field: "socialPlatforms", value: "X (Twitter)" } },
      { name: "xFollowers", label: "# of followers on X (Twitter)", type: "number", required: true, half: true, min: 0, showIf: { field: "socialPlatforms", value: "X (Twitter)" } },
      { name: "facebookHandle", label: "Facebook handle", type: "text", required: true, half: true, showIf: { field: "socialPlatforms", value: "Facebook" } },
      { name: "facebookFollowers", label: "# of followers on Facebook", type: "number", required: true, half: true, min: 0, showIf: { field: "socialPlatforms", value: "Facebook" } },
    ],
  },

  // ── Fan / player opt-in (GF #11) ──────────────────────────────────
  "opt-in": {
    key: "opt-in",
    eyebrow: "Join the Family",
    heading: "Stay in the Loop",
    intro: "Tell us a little about how you play, and we'll notify you about tournaments near you.",
    submitLabel: "Sign Up",
    successTitle: "Welcome to the Family!",
    successBody:
      "Keep an eye on your inbox for a warm welcome, and get ready for valuable insights and updates.",
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true, half: true, placeholder: "First" },
      { name: "lastName", label: "Last name", type: "text", required: true, half: true, placeholder: "Last" },
      { name: "email", label: "Email", type: "email", required: true, half: true, placeholder: "Email Address" },
      { name: "phone", label: "Phone (optional, but helps us stay connected)", type: "tel", half: true, maxLength: 40 },
      { name: "skillLevel", label: "Skill level", type: "select", required: true, half: true, options: ["Beginner", "Intermediate", "Advanced"] },
      { name: "enjoy", label: "How do you prefer to enjoy pickleball?", type: "select", required: true, half: true, options: ["Player", "Spectator"] },
      { name: "state", label: "Select your state (we'll notify you about tournaments near you)", type: "select", required: true, options: US_STATES },
    ],
  },

  // ── PPA Tour Europe contact (new 2026-09-03) ──────────────────────
  /**
   * The Europe region's "Contact Us".
   *
   * ⚠ THE DESTINATION ADDRESS IS DELIBERATELY NOT PUBLISHED ANYWHERE ON THE
   * PAGE. Payton Pemberton, 9/3: *"Don't publicize the email but have the form
   * forward to us."* That is why /europe carries a form and not a mailto row
   * like /about/contact does. Do not add the address to the page, to this file,
   * or to a `CONTACTS` table — it lives in `FORM_INBOX_EUROPE` only.
   */
  europe: {
    key: "europe",
    eyebrow: "PPA Tour Europe",
    heading: "Contact PPA Tour Europe",
    intro:
      "Questions about the European tour — events, entries, partnerships or media. Your message goes straight to the PPA Tour Europe team.",
    submitLabel: "Send Message",
    successTitle: "Thanks for contacting PPA Tour Europe!",
    successBody: "We will get back to you shortly.",
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true, half: true, maxLength: 120, placeholder: "First" },
      { name: "lastName", label: "Last name", type: "text", required: true, half: true, maxLength: 120, placeholder: "Last" },
      { name: "email", label: "Email", type: "email", required: true, half: true, maxLength: 160, placeholder: "Email Address" },
      { name: "phone", label: "Phone", type: "tel", half: true, maxLength: 40, placeholder: "Phone" },
      { name: "country", label: "Country", type: "text", half: true, maxLength: 80, placeholder: "Country" },
      {
        name: "topic",
        label: "What is this about?",
        type: "select",
        required: true,
        half: true,
        options: ["Event Entry", "Schedule & Tickets", "Player Relations", "Partnerships", "Media", "Hosting an Event", "Other"],
      },
      { name: "message", label: "Your message", type: "textarea", required: true, maxLength: 2000, placeholder: "How can we help?" },
    ],
  },

  // ── Newsletters (GF #2 footer, #10 CTA, #14 junior) ───────────────
  newsletter: {
    key: "newsletter",
    eyebrow: "Newsletter",
    heading: "Stay in the Know",
    intro: "Sign up to be among the first to know about upcoming events, promotions, giveaways, news, and more.",
    submitLabel: "Sign Me Up",
    successTitle: "You're in!",
    successBody: "Thanks for signing up — watch your inbox for the latest from the PPA Tour.",
    compact: true,
    fields: [
      { name: "email", label: "Email", type: "email", required: true, maxLength: 160, placeholder: "Email Address" },
    ],
  },
  "newsletter-junior": {
    key: "newsletter-junior",
    eyebrow: "Junior PPA Tour",
    heading: "Junior PPA Tour Newsletter",
    intro: "Get the latest on the Junior PPA Tour.",
    submitLabel: "Sign Me Up",
    successTitle: "You're in!",
    successBody: "Thanks for signing up — watch your inbox for Junior PPA Tour news.",
    compact: true,
    fields: [
      { name: "email", label: "Email", type: "email", required: true, maxLength: 160, placeholder: "Email Address" },
    ],
  },
};

/**
 * Form types that skip the Cloudflare Turnstile widget.
 *
 * The newsletter signups are a single email field laid out as a row
 * (`compact`), and Turnstile's widget is a fixed 300×65px that cannot shrink.
 * In the footer's 320px column that box crowded the email input out of its own
 * form — reported as "'Stay in the Know' shows a verification box instead of a
 * signup field" (Hannah Johns, 29 Jul). A one-field newsletter is also thin
 * spam bait, and the honeypot below still covers it.
 *
 * ⚠ Read by BOTH the client (whether to render the widget) and
 * `app/api/form-submit/route.ts` (whether to require a token). It has to stay a
 * single source: dropping the widget without relaxing the server check would
 * have made every signup fail the anti-spam gate — a silent conversion loss,
 * strictly worse than the cramped layout it replaced.
 */
export const TURNSTILE_EXEMPT_FORMS: ReadonlySet<string> = new Set([
  "newsletter",
  "newsletter-junior",
]);

/** Whether this form type should render and require a Turnstile token. */
export function formNeedsTurnstile(formType: string): boolean {
  return !TURNSTILE_EXEMPT_FORMS.has(formType);
}
