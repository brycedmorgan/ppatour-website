import { type Occupancy, isOccupancy, PRICING } from "./pricing";

export type Traveler = {
  firstName: string;
  lastName: string;
  preferredName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  skillLevel: string;
};

export type BedType = "King" | "Twin";

export type RegistrationPayload = {
  occupancy: Occupancy;
  bedType?: BedType;
  travelers: Traveler[];
  /** Trip slug (see trip-config.ts). Absent means the active trip. */
  trip?: string;
};

export const GENDER_OPTIONS = [
  "Female",
  "Male",
  "X / Non-binary",
  "Prefer not to say",
];

export const BED_OPTIONS: BedType[] = ["King", "Twin"];

export const SKILL_OPTIONS = [
  "2.0",
  "2.5",
  "3.0",
  "3.5",
  "4.0",
  "4.5",
  "5.0+",
];

export const emptyTraveler = (): Traveler => ({
  firstName: "",
  lastName: "",
  preferredName: "",
  dob: "",
  gender: "",
  email: "",
  phone: "",
  skillLevel: "",
});

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function travelerErrors(t: Traveler, index: number): string[] {
  const who = `Traveler ${index + 1}`;
  const errs: string[] = [];
  if (!t.firstName.trim()) errs.push(`${who}: passport first name is required`);
  if (!t.lastName.trim()) errs.push(`${who}: passport last name is required`);
  if (!t.dob.trim()) errs.push(`${who}: date of birth is required`);
  if (!t.gender.trim()) errs.push(`${who}: gender is required`);
  if (!isEmail(t.email)) errs.push(`${who}: a valid email is required`);
  if (t.phone.trim().length < 7) errs.push(`${who}: a valid phone number is required`);
  if (!t.skillLevel.trim()) errs.push(`${who}: player skill level is required`);
  return errs;
}

/** Server-side validation of the full payload. Returns a list of error strings. */
export function validateRegistration(payload: unknown): string[] {
  const errors: string[] = [];
  if (!payload || typeof payload !== "object") return ["Invalid registration data"];

  const data = payload as Partial<RegistrationPayload>;
  if (!isOccupancy(data.occupancy)) return ["Please choose single or double occupancy"];
  if (PRICING[data.occupancy].soldOut) return ["That room option is sold out. Please choose another."];

  const expected = PRICING[data.occupancy].travelers;
  const travelers = Array.isArray(data.travelers) ? data.travelers : [];
  if (travelers.length !== expected) {
    errors.push(`Expected ${expected} traveler(s) for ${data.occupancy} occupancy`);
  }

  travelers.slice(0, expected).forEach((t, i) => {
    errors.push(...travelerErrors(t as Traveler, i));
  });

  if (data.occupancy === "double" && data.bedType !== "King" && data.bedType !== "Twin") {
    errors.push("Please choose King or Twin beds");
  }

  return errors;
}
