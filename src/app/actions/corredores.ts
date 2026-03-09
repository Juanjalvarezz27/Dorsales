"use server"

import { PrismaClient } from "@prisma/client"

// Evita crear múltiples instancias de Prisma en desarrollo
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
export async function importarCorredores(datosCSV: any[][]) {
  try {
    let contador = 0;

    for (let i = 1; i < datosCSV.length; i++) {
      const fila = datosCSV[i];
      const cedulaRaw = fila[3];
      const nombreRaw = fila[2];

      if (!cedulaRaw || !nombreRaw) continue;

      const cedulaStr = String(cedulaRaw).trim();
      const nombreStr = String(nombreRaw).trim();

      // Buscamos si existe por nombre y cédula combinados
      const corredorExistente = await prisma.corredor.findFirst({
        where: {
          nombre: nombreStr,
          cedula: cedulaStr,
        },
      });

      const datosComunes = {
        nombre: nombreStr,
        correo: fila[1] ? String(fila[1]).trim() : "",
        fechaNacimiento: fila[4] ? String(fila[4]).trim() : "",
        genero: fila[5] ? String(fila[5]).trim() : "",
        telefono: fila[6] ? String(fila[6]).trim() : "",
        contactoEmergencia: fila[7] ? String(fila[7]).trim() : "",
        modalidad: fila[8] ? String(fila[8]).trim() : "",
        club: fila[9] ? String(fila[9]).trim() : "",
      };

      if (corredorExistente) {
        // Si existe, actualizamos usando su ID único
        await prisma.corredor.update({
          where: { id: corredorExistente.id },
          data: datosComunes,
        });
      } else {
        // Si no existe, lo creamos
        await prisma.corredor.create({
          data: {
            ...datosComunes,
            cedula: cedulaStr,
          },
        });
      }
      contador++;
    }

    return { success: true, guardados: contador };
  } catch (error) {
    console.error("Error en la importación:", error);
    return { success: false, error: "Ocurrió un error guardando los corredores." };
  }
}