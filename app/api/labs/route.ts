import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/labs — all labs with model counts. */
export async function GET() {
  try {
    const labs = await prisma.lab.findMany({
      include: { _count: { select: { models: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ labs });
  } catch (error) {
    console.error("GET /api/labs failed:", error);
    return NextResponse.json(
      { error: "Failed to list labs." },
      { status: 500 }
    );
  }
}
