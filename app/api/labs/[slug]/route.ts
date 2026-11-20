import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/labs/[slug] — lab detail with its models. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const lab = await prisma.lab.findUnique({
      where: { slug },
      include: {
        models: {
          include: { lab: true },
          orderBy: { releaseDate: { sort: "desc", nulls: "last" } },
        },
      },
    });
    if (!lab) {
      return NextResponse.json({ error: "Lab not found." }, { status: 404 });
    }
    return NextResponse.json(lab);
  } catch (error) {
    console.error("GET /api/labs/[slug] failed:", error);
    return NextResponse.json(
      { error: "Failed to load lab." },
      { status: 500 }
    );
  }
}
