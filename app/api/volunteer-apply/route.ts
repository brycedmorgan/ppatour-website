import { NextResponse } from "next/server";

/**
 * Volunteer application endpoint. Same stage as /api/lead-capture (§9.8):
 * validates and logs the submission. TODO: forward to Customer.io (person +
 * `volunteer_application` event) so the volunteer team gets the pipeline in
 * one place, and applicants get a confirmation email.
 */
type Application = {
  firstName?: string;
  lastName?: string;
  dob?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  email?: string;
  heardAbout?: string;
  pastVolunteering?: string;
  shirtSize?: string;
  additionalInfo?: string;
  acknowledgments?: string[];
};

const REQUIRED: (keyof Application)[] = [
  "firstName",
  "lastName",
  "dob",
  "street",
  "city",
  "state",
  "zip",
  "email",
  "shirtSize",
];

export async function POST(request: Request) {
  let payload: Application;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const missing = REQUIRED.filter(
    (k) => !String(payload[k] ?? "").trim(),
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email!.trim())) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // TODO: forward to Customer.io
  console.log("[volunteer-apply]", {
    ...payload,
    applicationDate: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
