import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  Query,
  CollectionReference,
  DocumentData,
} from "firebase/firestore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // opcional: ?date=2026-02-26

    const skadaCollection = collection(db, "skada") as CollectionReference<DocumentData>;

    const q: Query<DocumentData> = date
      ? query(skadaCollection, where("date", "==", date))
      : query(skadaCollection);

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json([]);
    }

    const result = snapshot.docs.map((docSnap) => {
      const { name, date: docDate, Damage } = docSnap.data();
      return { name, date: docDate, Damage };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching from Firestore:", error);
    return NextResponse.json(
      { error: "Error fetching data from Firestore" },
      { status: 500 }
    );
  }
}
