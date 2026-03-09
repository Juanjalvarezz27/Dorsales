"use client"

import { useState } from "react"

type Corredor = {
  id: string
  nombre: string
  cedula: string
  modalidad: string | null
  dorsal: string | null
  entregado: boolean
}

export default function ListaCorredores({ corredoresIniciales }: { corredoresIniciales: Corredor[] }) {
  const [corredores, setCorredores] = useState(corredoresIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [dorsalInput, setDorsalInput] = useState<{ [key: string]: string }>({})
  const [cargandoId, setCargandoId] = useState<string | null>(null)

  const filtrados = corredores.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    c.cedula.includes(busqueda)
  )

  const manejarAsignacion = async (id: string) => {
    const numero = dorsalInput[id]
    if (!numero) return

    setCargandoId(id)
    
    const res = await fetch(`/api/corredores/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dorsal: numero })
    })

    if (res.ok) {
      setCorredores(prev => prev.map(c => 
        c.id === id ? { ...c, dorsal: numero, entregado: true } : c
      ))
    } else {
      alert("Error al guardar el dorsal en la base de datos")
    }
    setCargandoId(null)
  }

  return (
    <div className="w-full">
      {/* Buscador Flotante */}
      <div className="mb-6 sticky top-4 z-10">
        <input 
          type="text" 
          placeholder="🔍 Buscar corredor por nombre o cédula..." 
          className="w-full p-4 rounded-2xl bg-slate-800 border-2 border-slate-700 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-lg shadow-2xl transition-all"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Grid de Tarjetas Responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtrados.map((corredor) => (
          <div 
            key={corredor.id} 
            className={`flex flex-col justify-between p-5 rounded-2xl shadow-lg border-l-8 transition-all hover:-translate-y-1 ${
              corredor.entregado 
                ? "bg-slate-800 border-green-500" 
                : "bg-slate-800 border-orange-500"
            }`}
          >
            {/* Cabecera de la Tarjeta */}
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  V-{corredor.cedula}
                </span>
                <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-md ${
                  corredor.entregado ? "bg-green-900/40 text-green-400" : "bg-slate-700 text-slate-300"
                }`}>
                  {corredor.entregado ? "Entregado" : "Pendiente"}
                </span>
              </div>
              <h2 className="text-xl font-black text-white leading-tight mb-1">
                {corredor.nombre}
              </h2>
              <p className="text-sm text-slate-400">
                {corredor.modalidad || 'Sin modalidad'}
              </p>
            </div>

            {/* Zona de Acción */}
            <div className="mt-auto pt-4 border-t border-slate-700">
              {corredor.entregado ? (
                <div className="flex justify-between items-center bg-green-900/20 p-3 rounded-xl border border-green-900/50">
                  <span className="text-sm font-semibold text-slate-300">Dorsal:</span>
                  <span className="text-3xl font-black text-green-400">#{corredor.dorsal}</span>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    placeholder="N° Dorsal" 
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 text-center font-bold text-lg text-white outline-none focus:border-orange-500"
                    value={dorsalInput[corredor.id] || ""}
                    onChange={(e) => setDorsalInput({...dorsalInput, [corredor.id]: e.target.value})}
                  />
                  <button 
                    onClick={() => manejarAsignacion(corredor.id)}
                    disabled={cargandoId === corredor.id || !dorsalInput[corredor.id]}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-50 transition-colors shadow-md"
                  >
                    {cargandoId === corredor.id ? "..." : "Asignar"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-slate-800 rounded-2xl border border-slate-700">
            No encontramos a nadie con esa búsqueda.
          </div>
        )}
      </div>
    </div>
  )
}