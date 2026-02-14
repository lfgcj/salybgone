import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isActiveSubscriber } from "@/lib/subscribers";
import { getToolBySlug } from "@/lib/tools";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isActive = await isActiveSubscriber(session.email);
  if (!isActive) {
    return NextResponse.json(
      { error: "Subscription required" },
      { status: 403 }
    );
  }

  const tool = getToolBySlug(params.slug);
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  const zipPath = path.join(
    process.cwd(),
    "public",
    "downloads",
    params.slug,
    `${params.slug}.zip`
  );

  if (!fs.existsSync(zipPath)) {
    return NextResponse.json(
      { error: "Download not available" },
      { status: 404 }
    );
  }

  // Log the download
  const logEntry = `${new Date().toISOString()} | ${session.email} | ${params.slug}\n`;
  const logPath = path.join(process.cwd(), "data", "downloads.log");
  try {
    fs.appendFileSync(logPath, logEntry);
  } catch {
    // Non-critical, continue
  }

  const fileBuffer = fs.readFileSync(zipPath);
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${params.slug}.zip"`,
      "Content-Length": fileBuffer.length.toString(),
    },
  });
}
