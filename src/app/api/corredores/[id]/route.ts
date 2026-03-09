import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

export async function PATCH(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dorsal } = await request.json()
    const { id } = await params 

    // 1. Lógica para ELIMINAR el dorsal
    if (!dorsal || dorsal.trim() === "") {
      const actualizado = await prisma.corredor.update({
        where: { id },
        data: { 
          dorsal: null,
          entregado: false 
        }
      })
      return NextResponse.json({ success: true, data: actualizado })
    }

    const dorsalLimpio = String(dorsal).trim()

    // 2. VALIDAR que el dorsal no esté asignado a otro
    const duplicado = await prisma.corredor.findFirst({
      where: {
        dorsal: dorsalLimpio,
        NOT: { id: id } // Que no sea el mismo corredor
      }
    })

    if (duplicado) {
      return NextResponse.json({ 
        error: `El dorsal #${dorsalLimpio} ya está asignado a ${duplicado.nombre}` 
      }, { status: 400 })
    }

    // 3. ASIGNAR/EDITAR el dorsal
    const corredorActualizado = await prisma.corredor.update({
      where: { id },
      data: { 
        dorsal: dorsalLimpio,
        entregado: true 
      }
    })

    return NextResponse.json({ success: true, data: corredorActualizado })
  } catch (error) {
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}