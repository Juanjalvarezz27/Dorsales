import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

// 1. GET: Solo se conecta a Google Sheets y trae la lista cruda (Súper rápido)
export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Respuestas de formulario 1!A2:Z', 
    });

    return NextResponse.json({ success: true, filas: response.data.values || [] });
  } catch (error) {
    return NextResponse.json({ error: "No se pudo leer Google Sheets" }, { status: 500 });
  }
}

// 2. POST: Recibe un grupo pequeño (ej. 50 corredores) y los guarda/actualiza
export async function POST(request: Request) {
  try {
    const { filas } = await request.json();
    if (!filas || filas.length === 0) return NextResponse.json({ success: true });

    // Traemos todos los IDs rápidos para comparar
    const corredoresDb = await prisma.corredor.findMany({
      select: { id: true, nombre: true, cedula: true }
    });

    const mapaCorredores = new Map();
    corredoresDb.forEach(c => {
      mapaCorredores.set(`${c.nombre.toLowerCase()}-${c.cedula || ''}`, c.id);
    });

    const nuevos: any[] = [];
    const paraActualizar = [];

    for (const fila of filas) {
      const nombreRaw = fila[2];
      if (!nombreRaw) continue;

      const nombreStr = String(nombreRaw).trim();
      const cedulaStr = fila[3] ? String(fila[3]).trim() : "";
      const clave = `${nombreStr.toLowerCase()}-${cedulaStr}`;

      const datosExtras = {
        correo: fila[1] ? String(fila[1]).trim() : "",
        fechaNacimiento: fila[4] ? String(fila[4]).trim() : "",
        genero: fila[5] ? String(fila[5]).trim() : "",
        telefono: fila[6] ? String(fila[6]).trim() : "",
        contactoEmergencia: fila[7] ? String(fila[7]).trim() : "",
        modalidad: fila[8] ? String(fila[8]).trim() : "",
        club: fila[9] ? String(fila[9]).trim() : "",
      };

      const idExistente = mapaCorredores.get(clave);

      // --- LA SOLUCIÓN AL ERROR 500 ESTÁ AQUÍ ---
      if (idExistente === "nuevo") {
        // Si el ID es "nuevo", significa que es un duplicado en este mismo lote de 50. Lo ignoramos.
        continue;
      } else if (idExistente) {
        paraActualizar.push(prisma.corredor.update({
          where: { id: idExistente },
          data: datosExtras
        }));
      } else {
        nuevos.push({ nombre: nombreStr, cedula: cedulaStr, ...datosExtras });
        mapaCorredores.set(clave, "nuevo"); // Lo marcamos para evitar que su duplicado choque
      }
    }

    if (nuevos.length > 0) await prisma.corredor.createMany({ data: nuevos });
    if (paraActualizar.length > 0) await prisma.$transaction(paraActualizar);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error guardando el lote:", error);
    return NextResponse.json({ error: "Error guardando el lote" }, { status: 500 });
  }
}