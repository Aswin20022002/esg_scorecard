import { NextResponse } from "next/server";

export function needsCode(): boolean {
  return !!process.env.ACCESS_CODE;
}

/** Returns an error response when the access code is wrong, otherwise null. */
export function guard(req: Request): NextResponse | null {
  const code = process.env.ACCESS_CODE;
  if (!code) return null;
  if (req.headers.get("x-access-code") === code) return null;
  return NextResponse.json({ error: "Enter the access code in Settings to use this app.", code: "auth" }, { status: 401 });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export const MAX_CHARS = 420_000;
