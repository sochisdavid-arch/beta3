"use client";

import { getUserDataDoc, setUserDataDoc } from "@/lib/userData";

export type RecordDoc<T> = { records: Record<string, T> };

export async function loadRecords<T>(uid: string, docId: string, fallback: Record<string, T> = {}): Promise<Record<string, T>> {
  const data = await getUserDataDoc<RecordDoc<T>>(uid, docId, { records: fallback });
  return data?.records && typeof data.records === "object" ? (data.records as Record<string, T>) : fallback;
}

export async function saveRecords<T>(uid: string, docId: string, records: Record<string, T>): Promise<void> {
  await setUserDataDoc<RecordDoc<T>>(uid, docId, { records });
}

