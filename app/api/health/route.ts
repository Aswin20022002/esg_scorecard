import { NextResponse } from "next/server";
import { keysAvailable } from "@/lib/server/llm";
import { needsCode } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ...keysAvailable(), needsCode: needsCode() });
}
