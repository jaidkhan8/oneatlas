import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/providers/[slug] — provider detail with hosted models. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const provider = await prisma.provider.findUnique({
      where: { slug },
      include: {
        models: {
          include: { model: { include: { lab: true } } },
          orderBy: { model: { name: "asc" } },
        },
      },
    });
    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found." },
        { status: 404 }
      );
    }
    return NextResponse.json(provider);
  } catch (error) {
    console.error("GET /api/providers/[slug] failed:", error);
    return NextResponse.json(
      { error: "Failed to load provider." },
      { status: 500 }
    );
  }
}
