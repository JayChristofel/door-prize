import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { participants } from "@/drizzle/schema";
import { eq, asc, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allParticipants = await db
      .select()
      .from(participants)
      .orderBy(asc(participants.createdAt));

    return NextResponse.json(allParticipants, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("GET /api/participants error:", err);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support batch insertion: { names: string[] }
    if (Array.isArray(body.names) && body.names.length > 0) {
      const trimmedNames = body.names
        .map((n: unknown) => (typeof n === "string" ? n.trim() : ""))
        .filter((n: string) => n.length > 0);

      // Deduplicate within the provided batch itself
      const uniqueNames = Array.from(new Set(trimmedNames));
      if (uniqueNames.length === 0) {
        return NextResponse.json(
          { error: "No valid names provided" },
          { status: 400 }
        );
      }

      // Check existing participants
      const existing = await db.select({ name: participants.name }).from(participants);
      const existingLower = new Set(existing.map((e) => e.name.toLowerCase()));

      const toInsert = uniqueNames
        .filter((name) => !existingLower.has(name.toLowerCase()))
        .map((name) => ({ name }));

      let inserted: { id: string; name: string; createdAt: Date | null }[] = [];
      if (toInsert.length > 0) {
        inserted = await db.insert(participants).values(toInsert).returning();
      }

      revalidatePath("/api/participants");
      revalidatePath("/");

      return NextResponse.json(
        {
          inserted,
          added: inserted.length,
          skipped: uniqueNames.length - inserted.length,
        },
        { status: 201 }
      );
    }

    // Single insertion
    const { name } = body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const trimmed = name.trim();

    // Check for duplicates (case-insensitive)
    const existing = await db.select({ id: participants.id, name: participants.name }).from(participants);
    const isDuplicate = existing.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());

    if (isDuplicate) {
      return NextResponse.json(
        { error: "Name already exists" },
        { status: 409 }
      );
    }

    const [newParticipant] = await db
      .insert(participants)
      .values({ name: trimmed })
      .returning();

    revalidatePath("/api/participants");
    revalidatePath("/");

    return NextResponse.json(newParticipant, { status: 201 });
  } catch (err) {
    console.error("POST /api/participants error:", err);
    return NextResponse.json(
      { error: "Failed to add participant" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id === "all") {
      await db.delete(participants);
      revalidatePath("/api/participants");
      revalidatePath("/api/winners");
      revalidatePath("/");
      return NextResponse.json({ success: true, message: "All participants deleted" });
    }

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    // id is UUID string
    await db.delete(participants).where(eq(participants.id, id));

    revalidatePath("/api/participants");
    revalidatePath("/api/winners");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/participants error:", err);
    return NextResponse.json(
      { error: "Failed to delete participant" },
      { status: 500 }
    );
  }
}
