import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { participants } from "@/drizzle/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
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

    // Support batch insertion: { names: string[], column?: string }
    if (Array.isArray(body.names) && body.names.length > 0) {
      const trimmedNames: string[] = body.names
        .map((n: unknown) => (typeof n === "string" ? n.trim() : ""))
        .filter((n: string) => n.length > 0);

      const uniqueNames: string[] = Array.from(new Set(trimmedNames));
      if (uniqueNames.length === 0) {
        return NextResponse.json(
          { error: "No valid names provided" },
          { status: 400 }
        );
      }

      const existing = await db.select({ name: participants.name }).from(participants);
      const existingLower = new Set(existing.map((e) => e.name.toLowerCase()));

      const columnValue = typeof body.column === "string" ? body.column.trim() || null : null;

      const toInsert: { name: string; column: string | null }[] = uniqueNames
        .filter((name: string) => !existingLower.has(name.toLowerCase()))
        .map((name: string) => ({ name, column: columnValue }));

      let inserted: { id: string; name: string; column: string | null; createdAt: Date | null }[] = [];
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
    const { name, column } = body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const trimmed = name.trim();
    const columnValue = typeof column === "string" ? column.trim() || null : null;

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
      .values({ name: trimmed, column: columnValue })
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
