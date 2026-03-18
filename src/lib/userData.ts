"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase";

export async function getUserDataDoc<T>(
  uid: string,
  docId: string,
  fallback: T,
  initIfMissing = true
): Promise<T> {
  const ref = doc(firestoreDb, "users", uid, "data", docId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as T;
  }
  if (initIfMissing) {
    await setDoc(ref, fallback as any);
  }
  return fallback;
}

export async function setUserDataDoc<T>(uid: string, docId: string, data: T): Promise<void> {
  const ref = doc(firestoreDb, "users", uid, "data", docId);
  await setDoc(ref, data as any);
}

