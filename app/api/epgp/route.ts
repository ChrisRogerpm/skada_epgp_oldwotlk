import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";

export async function GET() {
  try {
    const epgpCollection = collection(db, "epgp");
    const snapshot = await getDocs(query(epgpCollection));

    if (snapshot.empty) {
      return NextResponse.json({ date: "", hour: "", roster: [] });
    }

    const roster = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // In the JSON there was date and hour at root. 
    // If they are not in a separate document, we might not have them easily.
    // For now, let's just return the roster.
    
    return NextResponse.json({ 
      date: new Date().toISOString().split('T')[0], // Fallback date
      hour: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Fallback hour
      roster 
    });
  } catch (error) {
    console.error("Error fetching from Firestore (epgp):", error);
    return NextResponse.json(
      { error: "Error fetching data from Firestore" },
      { status: 500 }
    );
  }
}
