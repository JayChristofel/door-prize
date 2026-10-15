import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { winners } from "@/drizzle/schema";
import { asc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const allWinners = await db
      .select({
        id: winners.id,
        participantId: winners.participantId,
        name: winners.name,
        round: winners.round,
        column: winners.column,
        createdAt: winners.createdAt,
      })
      .from(winners)
      .orderBy(asc(winners.round), asc(winners.createdAt));

    return NextResponse.json(allWinners, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("GET /api/winners error:", err);
    return NextResponse.json(
      { error: "Failed to fetch winners" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support batch insertion
    if (Array.isArray(body.items) && body.items.length > 0) {
      const itemsToInsert = body.items.map((item: { participantId: string; name: string; round?: number; column?: string | null }) => ({
        participantId: item.participantId,
        name: String(item.name).trim(),
        round: Number(item.round) || 1,
        column: item.column || null,
      }));

      const insertedWinners = await db
        .insert(winners)
        .values(itemsToInsert)
        .returning();

      revalidatePath("/api/winners");
      revalidatePath("/");

      return NextResponse.json(insertedWinners, { status: 201 });
    }

    const { participantId, name, round, column } = body;

    if (!participantId || !name) {
      return NextResponse.json(
        { error: "participantId and name are required" },
        { status: 400 }
      );
    }

    const [newWinner] = await db
      .insert(winners)
      .values({
        participantId,
        name: String(name).trim(),
        round: Number(round) || 1,
        column: column || null,
      })
      .returning();

    revalidatePath("/api/winners");
    revalidatePath("/");

    return NextResponse.json(newWinner, { status: 201 });
  } catch (err) {
    console.error("POST /api/winners error:", err);
    return NextResponse.json(
      { error: "Failed to add winner" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      await db.delete(winners).where(eq(winners.id, id));
      revalidatePath("/api/winners");
      revalidatePath("/");
      return NextResponse.json({ success: true, message: "Winner deleted" });
    }

    // Reset all winners
    await db.delete(winners);
    revalidatePath("/api/winners");
    revalidatePath("/");
    return NextResponse.json({ success: true, message: "Winners successfully reset" });
  } catch (err) {
    console.error("DELETE /api/winners error:", err);
    return NextResponse.json(
      { error: "Failed to reset winners" },
      { status: 500 }
    );
  }
}
