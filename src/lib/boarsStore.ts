"use client";

import { loadList, saveList } from "@/lib/listStore";

export async function loadBoars<Boar>(uid: string): Promise<Boar[]> {
  return loadList<Boar>(uid, "boarCollection", [], false);
}

export async function saveBoars<Boar>(uid: string, boars: Boar[]): Promise<void> {
  await saveList<Boar>(uid, "boarCollection", boars);
}

