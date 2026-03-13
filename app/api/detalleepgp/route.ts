import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getOrSetCache } from "../../../lib/cache";

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

    // Si la fecha es "all", no traemos nada para evitar consumo excesivo de lectura
    if (fechaFilter === "all") {
      return NextResponse.json([]);
    }

    const cacheKey = `epgp_logs_${fechaFilter.replace(/\//g, "-")}`;
    const result = await getOrSetCache(cacheKey, async () => {
      const epgpLogsCollection = collection(db, "epgp_logs");
      const q = query(epgpLogsCollection, where("fecha", "==", fechaFilter));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
    }, 15 * 60 * 1000); // 15 minutos de caché por cada fecha

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching from Firestore (epgp_logs):", error);
    return NextResponse.json(
      { error: "Error fetching data from Firestore" },
      { status: 500 }
    );
  }
}
