"use client";

import type { DocumentData } from "firebase/firestore";
import { getUserDataDoc, setUserDataDoc } from "@/lib/userData";

export type PigsDoc<Pig> = { pigs: Pig[] } & DocumentData;

export async function loadPigs<Pig>(uid: string, initialPigs: Pig[]): Promise<Pig[]> {
  const data = await getUserDataDoc<PigsDoc<Pig>>(uid, "pigs", { pigs: initialPigs });
  const pigs = Array.isArray(data?.pigs) && data.pigs.length > 0 ? data.pigs : initialPigs;
  return pigs;
}

export async function savePigs<Pig>(uid: string, pigs: Pig[]): Promise<void> {
  await setUserDataDoc<PigsDoc<Pig>>(uid, "pigs", { pigs });
}

