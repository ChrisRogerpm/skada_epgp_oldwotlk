import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export async function GET() {
  try {
    const epgpLogsCollection = collection(db, "epgp_logs");
    // Assuming there's a timestamp or at least we want them all
    // If there's a field to order by, we should use it. 
    // Based on the JSON, there are 'fecha' and 'hour' strings.
    const q = query(epgpLogsCollection); 
    const snapshot = await getDocs(q);

    const result = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching from Firestore (epgp_logs):", error);
    return NextResponse.json(
      { error: "Error fetching data from Firestore" },
      { status: 500 }
    );
  }
}
