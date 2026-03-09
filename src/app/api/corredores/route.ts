import { NextResponse } from 'next/server'
import prisma from '../../lib/prisma'

export async function GET() {
  try {
    const corredores = await prisma.corredor.findMany({
      orderBy: { nombre: 'asc' }
    })
    return NextResponse.json(corredores)
  } catch (error) {
    return NextResponse.json({ error: "Error obteniendo los corredores" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    let contador = 0;

    for (let i = 1; i < data.length; i++) {
      const fila = data[i];
      
      // La columna 2 es el nombre (según tu Excel)
      const nombreRaw = fila[2];

      // Ahora SOLO exigimos que el nombre exista. Si está vacío, saltamos la fila.
      if (!nombreRaw) continue;

      const nombreStr = String(nombreRaw).trim();
      // Si la cédula viene vacía, le ponemos "S/C" (Sin Cédula) o la dejamos en blanco
      const cedulaStr = fila[3] ? String(fila[3]).trim() : "";

      // Buscamos si ya existe alguien con ESE EXACTO nombre y ESA EXACTA cédula
      const corredorExistente = await prisma.corredor.findFirst({
        where: { 
          nombre: nombreStr,
          cedula: cedulaStr
        }
      });

      const datosExtras = {
        correo: fila[1] ? String(fila[1]).trim() : "",
        fechaNacimiento: fila[4] ? String(fila[4]).trim() : "",
        genero: fila[5] ? String(fila[5]).trim() : "",
        telefono: fila[6] ? String(fila[6]).trim() : "",
        contactoEmergencia: fila[7] ? String(fila[7]).trim() : "",
        modalidad: fila[8] ? String(fila[8]).trim() : "",
        club: fila[9] ? String(fila[9]).trim() : "",
      };

      if (corredorExistente) {
        // Si existe, lo actualizamos (esto mantiene los dorsales ya asignados)
        await prisma.corredor.update({
          where: { id: corredorExistente.id },
          data: datosExtras
        });
      } else {
        // Si no existe, lo creamos nuevo
        await prisma.corredor.create({
          data: {
            nombre: nombreStr,
            cedula: cedulaStr,
            ...datosExtras
          }
        });
      }
      contador++;
    }

    return NextResponse.json({ success: true, guardados: contador })
  } catch (error) {
    console.error("Error en la importación:", error)
    return NextResponse.json({ error: "Error guardando los corredores" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await prisma.corredor.deleteMany({})
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error eliminando los corredores" }, { status: 500 })
  }
}