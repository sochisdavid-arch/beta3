"use client";

import { getUserDataDoc, setUserDataDoc } from "@/lib/userData";

export type ListDoc<T> = { items: T[] };

export async function loadList<T>(uid: string, docId: string, fallback: T[] = [], initIfMissing = true): Promise<T[]> {
  const doc = await getUserDataDoc<ListDoc<T>>(uid, docId, { items: fallback }, initIfMissing);
  return Array.isArray(doc?.items) ? doc.items : fallback;
}

export async function saveList<T>(uid: string, docId: string, items: T[]): Promise<void> {
  await setUserDataDoc<ListDoc<T>>(uid, docId, { items });
}

