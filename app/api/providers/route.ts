import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/providers — all providers with hosted-model counts. */
export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      include: { _count: { select: { models: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ providers });
  } catch (error) {
    console.error("GET /api/providers failed:", error);
    return NextResponse.json(
      { error: "Failed to list providers." },
      { status: 500 }
    );
  }
}
