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
    
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { timeZone: "America/Lima", year: 'numeric', month: '2-digit', day: '2-digit' };
    const timeOptions: Intl.DateTimeFormatOptions = { timeZone: "America/Lima", hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    
    const limaDate = now.toLocaleDateString('en-GB', options).split('/').reverse().join('-'); // YYYY-MM-DD
    const limaTime = now.toLocaleTimeString('en-GB', timeOptions);

    return NextResponse.json({ 
      date: limaDate,
      hour: limaTime,
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
