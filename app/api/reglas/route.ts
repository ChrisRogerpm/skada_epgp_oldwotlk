import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";

export async function GET() {
  try {
    // Intentar con varios nombres posibles de colección por si acaso
    const collectionNames = ["reglas", "Reglas", "normativas", "Normativas"];
    let snapshot: any = { empty: true };
    
    for (const name of collectionNames) {
      const col = collection(db, name);
      const snap = await getDocs(query(col));
      if (!snap.empty) {
        snapshot = snap;
        break;
      }
    }
    
    if (snapshot.empty) {
      return NextResponse.json([
        { "Reglas de Loteo": [] },
        { "Beneficios": [] },
        { "Perjuicios": [] }
      ]);
    }

    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<Record<string, any>>;

    const formatOrder = ["Reglas de Loteo", "Beneficios", "Perjuicios"];
    
    const formattedRules = formatOrder.map(key => {
      const lowerKey = key.toLowerCase();
      const noSpaceLowerKey = lowerKey.replace(/ /g, "");

      // 1. Buscar si algún documento tiene una clave que coincida (case-insensitive)
      for (const doc of docs) {
        const foundKey = Object.keys(doc).find(k => {
          const lk = k.toLowerCase();
          return lk === lowerKey || lk === noSpaceLowerKey || (lk.includes("loteo") && lowerKey.includes("loteo"));
        });
        
        if (foundKey && Array.isArray(doc[foundKey])) {
          return { [key]: doc[foundKey] };
        }
      }
      
      // 2. Buscar si el ID del documento coincide con la sección
      const docById = docs.find(d => {
        const lId = d.id.toLowerCase();
        return lId === lowerKey || lId === noSpaceLowerKey || (lId.includes("loteo") && lowerKey.includes("loteo"));
      });

      if (docById) {
        const { id, ...rest } = docById;
        // Priorizar campos que sean arrays
        const data = rest[key] || rest.items || rest.data || Object.values(rest).find(v => Array.isArray(v));
        if (Array.isArray(data)) {
            // Si el ID es Loteo pero el contenido es un solo raid (no tiene campo raid en los items)
            if (lowerKey.includes("loteo") && data.length > 0 && !data[0].raid && data[0].item) {
                return { [key]: [{ raid: docById.raid || docById.id, items: data }] };
            }
            return { [key]: data };
        }
      }

      // 3. Heurísticas por contenido de todos los documentos
      if (lowerKey.includes("loteo")) {
        const lootDocs = docs.filter(d => d.raid || (Array.isArray(d.items) && d.items[0]?.raid));
        if (lootDocs.length > 0) {
            // Si los documentos tienen el campo 'raid', ellos mismos son las reglas de raid
            if (lootDocs[0].raid) return { [key]: lootDocs };
            // Si es un documento contenedor con 'items' que tienen 'raid'
            const container = lootDocs.find(d => Array.isArray(d.items));
            if (container) return { [key]: container.items };
        }
      }

      if (lowerKey.includes("bene") || lowerKey.includes("perj")) {
        const searchStr = lowerKey.substring(0, 4);
        const matchingDocs = docs.filter(d => 
            d.id.toLowerCase().includes(searchStr) || 
            Object.keys(d).some(k => k.toLowerCase().includes(searchStr))
        );
        if (matchingDocs.length > 0) {
            const withItems = matchingDocs.find(d => Array.isArray(d.items));
            if (withItems) return { [key]: withItems.items };
            const withKey = matchingDocs.find(d => Array.isArray(d[key]) || Array.isArray(d[Object.keys(d).find(k => k.toLowerCase().includes(searchStr)) || ""]));
            if (withKey) {
                const k = Object.keys(withKey).find(k => k.toLowerCase().includes(searchStr)) || "";
                return { [key]: withKey[k] };
            }
            return { [key]: matchingDocs };
        }
      }

      return { [key]: [] };
    });

    return NextResponse.json(formattedRules);

  } catch (error) {
    console.error("Error fetching rules from Firestore:", error);
    return NextResponse.json(
      { error: "Error fetching data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
