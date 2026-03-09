"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

type Corredor = {
  id: string
  nombre: string
  cedula: string
  modalidad: string | null
  dorsal: string | null
  entregado: boolean
}

export default function ListaCorredores({ corredoresIniciales }: { corredoresIniciales: Corredor[] }) {
  const router = useRouter()
  
  // 1. Sincronización Vital: Actualiza el estado local cuando las props cambian (router.refresh o vaciar lista)
  const [corredores, setCorredores] = useState(corredoresIniciales)
  
  useEffect(() => {
    setCorredores(corredoresIniciales)
  }, [corredoresIniciales])

  const [busqueda, setBusqueda] = useState("")
  const [filtro, setFiltro] = useState<'todos' | 'entregados' | 'pendientes'>('todos')
  const [paginaActual, setPaginaActual] = useState(1)
  const [dorsalInput, setDorsalInput] = useState<{ [key: string]: string }>({})
  const [cargandoId, setCargandoId] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const [errorModal, setErrorModal] = useState<{ abierta: boolean; mensaje: string }>({
    abierta: false,
    mensaje: ""
  })
  const [confirmarEliminar, setConfirmarEliminar] = useState<{ abierta: boolean; corredorId: string | null }>({
    abierta: false,
    corredorId: null
  })

  const itemsPorPagina = 50
  const topRef = useRef<HTMLDivElement>(null)

  // Resetear página al filtrar o buscar
  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, filtro])

  const filtrados = corredores.filter(c => {
    const cumpleBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                          (c.cedula?.includes(busqueda));
    if (filtro === 'entregados') return cumpleBusqueda && c.entregado;
    if (filtro === 'pendientes') return cumpleBusqueda && !c.entregado;
    return cumpleBusqueda;
  })

  const totalPaginas = Math.ceil(filtrados.length / itemsPorPagina)
  const corredoresPaginados = filtrados.slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina)

  const cambiarPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina)
    if (topRef.current) {
      const y = topRef.current.getBoundingClientRect().top + window.scrollY - 20
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const manejarAsignacion = async (id: string, valorDorsal?: string) => {
    const numero = valorDorsal !== undefined ? valorDorsal : (dorsalInput[id]?.trim() || ""); 
    setCargandoId(id)
    
    try {
      const res = await fetch(`/api/corredores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dorsal: numero })
      })

      const data = await res.json()

      if (res.ok) {
        // Actualizamos localmente para feedback instantáneo
        setCorredores(prev => prev.map(c => 
          c.id === id 
            ? { ...c, dorsal: numero || null, entregado: numero !== "" } 
            : c
        ))
        setEditandoId(null)
        setConfirmarEliminar({ abierta: false, corredorId: null })
        
        // Refrescamos para actualizar las tarjetas de estadísticas globales en page.tsx
        router.refresh()
      } else {
        setErrorModal({ abierta: true, mensaje: data.error || "Error al actualizar" })
      }
    } catch (error) {
      setErrorModal({ abierta: true, mensaje: "Error de conexión" })
    } finally {
      setCargandoId(null)
    }
  }

  const renderPaginacion = () => {
    if (totalPaginas <= 1) return null
    return (
      <div className="flex justify-center items-center gap-3 py-6">
        <button onClick={() => cambiarPagina(Math.max(1, paginaActual - 1))} disabled={paginaActual === 1} className="p-3 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-colors shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <span className="text-sm font-bold text-gray-900 bg-white px-5 py-2.5 rounded-full border border-gray-100 shadow-sm">
          {paginaActual} <span className="text-gray-400 font-medium mx-1">de</span> {totalPaginas}
        </span>
        <button onClick={() => cambiarPagina(Math.min(totalPaginas, paginaActual + 1))} disabled={paginaActual === totalPaginas} className="p-3 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-colors shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full" ref={topRef}>
      
      {/* Selector de Filtros */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-200/50 p-1.5 rounded-2xl flex gap-1 backdrop-blur-sm">
          {(['todos', 'entregados', 'pendientes'] as const).map((op) => (
            <button
              key={op}
              onClick={() => setFiltro(op)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${
                filtro === op ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-4 sticky top-4 z-10 backdrop-blur-xl bg-gray-50/80 p-2 -mx-2 rounded-3xl">
        <input 
          type="text" 
          placeholder={`Buscar en ${filtro}...`} 
          className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-200 text-gray-900 focus:border-orange-500 outline-none shadow-sm transition-all font-medium"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {renderPaginacion()}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 my-4">
        {corredoresPaginados.map((corredor) => (
          <div key={corredor.id} className="flex flex-col justify-between p-6 rounded-3xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3 text-[10px] font-bold uppercase tracking-widest">
                <span className="text-gray-400">V-{corredor.cedula || 'S/C'}</span>
                <span className={corredor.entregado ? "text-green-500" : "text-orange-500"}>
                  {corredor.entregado ? "● Entregado" : "○ Pendiente"}
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{corredor.nombre}</h2>
              <p className="text-xs text-gray-400 font-medium uppercase">{corredor.modalidad}</p>
            </div>

            <div>
              {corredor.entregado && editandoId !== corredor.id ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <span className="text-2xl font-black text-gray-900 ml-2">#{corredor.dorsal}</span>
                    <button 
                      onClick={() => {
                        setEditandoId(corredor.id);
                        setDorsalInput({...dorsalInput, [corredor.id]: corredor.dorsal || ""});
                      }}
                      className="p-2 text-gray-300 hover:text-orange-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                  </div>
                  <button 
                    onClick={() => setConfirmarEliminar({ abierta: true, corredorId: corredor.id })}
                    className="p-3 bg-red-50 text-red-500 rounded-2xl border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="N°" 
                      autoFocus={editandoId === corredor.id}
                      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-center font-bold text-lg text-gray-900 outline-none focus:border-orange-500 focus:bg-white transition-all"
                      value={dorsalInput[corredor.id] || ""}
                      onChange={(e) => setDorsalInput({...dorsalInput, [corredor.id]: e.target.value})}
                      onKeyDown={(e) => e.key === 'Enter' && manejarAsignacion(corredor.id)}
                    />
                    <button 
                      onClick={() => manejarAsignacion(corredor.id)} 
                      disabled={cargandoId === corredor.id} 
                      className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      {cargandoId === corredor.id ? "..." : "✓"}
                    </button>
                  </div>
                  {editandoId === corredor.id && (
                    <button onClick={() => setEditandoId(null)} className="text-[10px] font-bold text-gray-400 uppercase hover:text-red-500 text-center">Cancelar</button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {renderPaginacion()}

      {/* Modal Confirmación Quitar Dorsal */}
      {confirmarEliminar.abierta && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-gray-900/30 backdrop-blur-md p-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-gray-50 text-center scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-2">Quitar dorsal</h3>
            <p className="text-gray-500 font-medium mb-8">¿Seguro que quieres quitar el dorsal? El corredor volverá a pendiente.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarEliminar({ abierta: false, corredorId: null })} className="flex-1 bg-gray-100 text-gray-700 rounded-2xl py-4 font-bold">No</button>
              <button onClick={() => confirmarEliminar.corredorId && manejarAsignacion(confirmarEliminar.corredorId, "")} className="flex-1 bg-red-500 text-white rounded-2xl py-4 font-bold shadow-md">Sí, quitar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Error */}
      {errorModal.abierta && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/20 backdrop-blur-md p-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-gray-100 text-center scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-2">Atención</h3>
            <p className="text-gray-500 font-medium mb-8">{errorModal.mensaje}</p>
            <button onClick={() => setErrorModal({ abierta: false, mensaje: "" })} className="w-full bg-gray-900 text-white rounded-2xl py-4 font-bold shadow-lg">Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}