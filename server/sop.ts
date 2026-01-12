import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { sopGenerations, SopGeneration, InsertSopGeneration } from "../drizzle/schema";

export async function createSopGeneration(sop: InsertSopGeneration): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result: any = await db.insert(sopGenerations).values(sop);
  const id = result[0]?.insertId || result.insertId;
  return Number(id);
}

export async function getUserSopGenerations(userId: number): Promise<SopGeneration[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(sopGenerations)
    .where(eq(sopGenerations.userId, userId));
}

export async function getSopGeneration(sopId: number): Promise<SopGeneration | undefined> {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db
    .select()
    .from(sopGenerations)
    .where(eq(sopGenerations.id, sopId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateSopGeneration(sopId: number, updates: Partial<InsertSopGeneration>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(sopGenerations)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(sopGenerations.id, sopId));
}

export async function deleteSopGeneration(sopId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(sopGenerations).where(eq(sopGenerations.id, sopId));
}
