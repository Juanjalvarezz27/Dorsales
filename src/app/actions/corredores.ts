"use server"

import { PrismaClient } from "@prisma/client"

// Evita crear múltiples instancias de Prisma en desarrollo
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export async function importarCorredores(datosCSV: any[][]) {
  try {
    let contador = 0;

    // Recorremos las filas omitiendo la primera (que son las cabeceras)
    for (let i = 1; i < datosCSV.length; i++) {
      const fila = datosCSV[i];
      
      // La cédula está en la posición 3 y el nombre en la 2 (según tu archivo)
      const cedulaRaw = fila[3];
      const nombreRaw = fila[2];

      if (!cedulaRaw || !nombreRaw) continue; // Si la fila está vacía, la saltamos

      const cedulaStr = String(cedulaRaw).trim();

      await prisma.corredor.upsert({
        where: { cedula: cedulaStr },
        update: {
          // Si ya existe, actualizamos por si cambió de modalidad o club
          nombre: String(nombreRaw).trim(),
          correo: fila[1] ? String(fila[1]).trim() : "",
          modalidad: fila[8] ? String(fila[8]).trim() : "",
          club: fila[9] ? String(fila[9]).trim() : "",
        },
        create: {
          correo: fila[1] ? String(fila[1]).trim() : "",
          nombre: String(nombreRaw).trim(),
          cedula: cedulaStr,
          fechaNacimiento: fila[4] ? String(fila[4]).trim() : "",
          genero: fila[5] ? String(fila[5]).trim() : "",
          telefono: fila[6] ? String(fila[6]).trim() : "",
          contactoEmergencia: fila[7] ? String(fila[7]).trim() : "",
          modalidad: fila[8] ? String(fila[8]).trim() : "",
          club: fila[9] ? String(fila[9]).trim() : "",
        }
      });
      contador++;
    }

    return { success: true, guardados: contador };
  } catch (error) {
    console.error("Error en la importación:", error);
    return { success: false, error: "Ocurrió un error guardando los corredores." };
  }
}

export async function obtenerCorredores() {
  try {
    const corredores = await prisma.corredor.findMany({
      orderBy: { nombre: 'asc' }
    });
    return corredores;
  } catch (error) {
    console.error("Error obteniendo corredores:", error);
    return [];
  }
}

export async function asignarDorsal(id: string, numeroDorsal: string) {
  try {
    await prisma.corredor.update({
      where: { id },
      data: { 
        dorsal: numeroDorsal,
        entregado: true 
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Error al asignar dorsal:", error);
    return { success: false, error: "No se pudo asignar el dorsal" };
  }
}