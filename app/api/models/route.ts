import { NextRequest, NextResponse } from "next/server";
import { listModels, parseModelFilters } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/models?q=&lab=&type=&capability=&modality=&openWeights=
 *   &sort=name|price-asc|price-desc|context-desc|newest&page=&perPage=
 * Paginated, filterable model list.
 */
export async function GET(request: NextRequest) {
  try {
    const sp = Object.fromEntries(request.nextUrl.searchParams.entries());
    const { filters, sort, page } = parseModelFilters(sp);
    const perPage = Math.min(
      50,
      Math.max(1, parseInt(sp.perPage ?? "12", 10) || 12)
    );
    const result = await listModels(filters, sort, page, perPage);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/models failed:", error);
    return NextResponse.json(
      { error: "Failed to list models." },
      { status: 500 }
    );
  }
}
