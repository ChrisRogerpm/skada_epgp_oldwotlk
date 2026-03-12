import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let fechaFilter = searchParams.get("fecha");

    // Si no hay fecha en el query, calculamos la actual en Lima
    if (!fechaFilter) {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        timeZone: "America/Lima", 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      };
      fechaFilter = now.toLocaleDateString('es-PE', options);
    }

    const epgpLogsCollection = collection(db, "epgp_logs");
    
    // Si la fecha es "all", traemos todo (para cuando el usuario quita el filtro)
    // De lo contrario, filtramos por el campo 'fecha'
    let q;
    if (fechaFilter === "all") {
      q = query(epgpLogsCollection);
    } else {
      q = query(epgpLogsCollection, where("fecha", "==", fechaFilter));
    }

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
