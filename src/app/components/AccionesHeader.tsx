"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AccionesHeader() {
  const [mostrarModalBorrar, setMostrarModalBorrar] = useState(false)
  const [borrando, setBorrando] = useState(false)
  
  // Estados para la carga REAL
  const [sincronizando, setSincronizando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [textoEstado, setTextoEstado] = useState("Conectando con Google...")

  const router = useRouter()

  const confirmarBorrado = async () => {
    setBorrando(true)
    try {
      const res = await fetch('/api/corredores', { method: 'DELETE' })
      if (res.ok) {
        setMostrarModalBorrar(false)
        router.refresh()
      }
    } catch (error) {
      alert("Error de conexión.")
    } finally {
      setBorrando(false)
    }
  }

  const sincronizarGoogleSheets = async () => {
    setSincronizando(true)
    setProgreso(0)
    setTextoEstado("Leyendo documento de Google...")

    try {
      // 1. Descargamos la lista completa de Google (Tarda ~1 segundo)
      const resLectura = await fetch('/api/sincronizar', { method: 'GET' })
      const dataLectura = await resLectura.json()

      if (!resLectura.ok || !dataLectura.success) throw new Error("Error leyendo Google Sheets")
      
      const filas = dataLectura.filas;
      if (filas.length === 0) {
        setProgreso(100)
        setTimeout(() => { setSincronizando(false); router.refresh(); }, 500)
        return
      }

      // 2. Procesamos en lotes para que la barra sea REAL y no saturar la BD
      const TAMAÑO_LOTE = 50;
      let procesados = 0;

      for (let i = 0; i < filas.length; i += TAMAÑO_LOTE) {
        const lote = filas.slice(i, i + TAMAÑO_LOTE)
        
        setTextoEstado(`Procesando ${Math.min(procesados + TAMAÑO_LOTE, filas.length)} de ${filas.length}...`)

        const resGuardado = await fetch('/api/sincronizar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filas: lote })
        })

        if (!resGuardado.ok) throw new Error("Error al guardar en base de datos")

        procesados += lote.length;
        const porcentajeReal = Math.round((procesados / filas.length) * 100);
        setProgreso(porcentajeReal);
      }

      // Terminó con éxito
      setTextoEstado("¡Sincronización completa!")
      setTimeout(() => {
        setSincronizando(false)
        setProgreso(0)
        router.refresh()
      }, 800)

    } catch (error: any) {
      setSincronizando(false)
      setProgreso(0)
      alert(error.message || "Error de conexión al sincronizar.")
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">

        <button 
          onClick={sincronizarGoogleSheets}
          disabled={sincronizando}
          className="w-full sm:w-auto bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-full font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          <svg className={`w-4 h-4 text-orange-500 ${sincronizando ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          Sincronizar Datos
        </button>
      </div>

      {/* MODAL DE CARGA REAL */}
      {sincronizando && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4">
          <div className="bg-white p-8 rounded-4xl shadow-2xl max-w-sm w-full text-center scale-100 animate-in zoom-in-95 duration-200">
            <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              {progreso === 100 ? (
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-12 h-12 text-orange-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              )}
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Actualizando...</h3>
            <p className="text-gray-500 text-sm font-medium mb-6">{textoEstado}</p>
            
            {/* Barra de Progreso */}
            <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ease-out ${progreso === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${progreso}%` }}
              ></div>
            </div>
            <p className="text-xs font-bold text-gray-400 text-right">{progreso}%</p>
          </div>
        </div>
      )}

      {/* MODAL BORRAR TODO */}
      {mostrarModalBorrar && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-gray-50 text-center">
             {/* ... Mismo contenido del modal de borrar ... */}
            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">¿Borrar todo?</h3>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">Esta acción vaciará la lista y borrará los dorsales asignados.</p>
            <div className="flex gap-3">
              <button onClick={() => setMostrarModalBorrar(false)} className="flex-1 bg-gray-100 text-gray-700 rounded-2xl py-4 font-bold hover:bg-gray-200 transition-colors">No</button>
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