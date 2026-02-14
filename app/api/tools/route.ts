import { NextResponse } from "next/server";
import { getTools } from "@/lib/tools";

export async function GET() {
  const tools = getTools();
  return NextResponse.json(tools);
}
