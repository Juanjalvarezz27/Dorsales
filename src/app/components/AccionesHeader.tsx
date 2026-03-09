"use client"

import { useState } from "react"
import { useRouter } from "next/navigation" // Importante para el refresh
import Link from "next/link"

export default function AccionesHeader() {
  const [mostrarModal, setMostrarModal] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const router = useRouter()

  const confirmarBorrado = async () => {
    setBorrando(true)
    try {
      const res = await fetch('/api/corredores', { method: 'DELETE' })
      if (res.ok) {
        setMostrarModal(false)
        // Esto actualiza los datos del servidor (Prisma) y refresca la UI al instante
        router.refresh() 
      }
    } catch (error) {
      alert("Error de conexión.")
    } finally {
      setBorrando(false)
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <button 
          onClick={() => setMostrarModal(true)}
          className="w-full sm:w-auto bg-white hover:bg-red-50 text-red-500 border border-gray-200 px-6 py-3 rounded-full font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          Vaciar Lista
        </button>

        <Link 
          href="/importar" 
          className="w-full sm:w-auto bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-full font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg"
        >
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          Actualizar Excel
        </Link>
      </div>

      {/* Modal Estilo Apple */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-gray-50 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">¿Borrar todo?</h3>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">Esta acción vaciará la lista y borrará los dorsales asignados.</p>
            <div className="flex gap-3">
              <button onClick={() => setMostrarModal(false)} className="flex-1 bg-gray-100 text-gray-700 rounded-2xl py-4 font-bold hover:bg-gray-200 transition-colors">No</button>
              <button onClick={confirmarBorrado} className="flex-1 bg-red-500 text-white rounded-2xl py-4 font-bold hover:bg-red-600 transition-colors shadow-md">
                {borrando ? '...' : 'Sí, borrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}