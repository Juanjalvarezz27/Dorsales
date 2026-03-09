import prisma from "../app/lib/prisma"
import ListaCorredores from "./components/ListaCorredores"
import AccionesHeader from "./components/AccionesHeader"

export const dynamic = 'force-dynamic' 

export default async function Home() {
  const corredores = await prisma.corredor.findMany({
    orderBy: { nombre: 'asc' }
  })

  const total = corredores.length
  const entregados = corredores.filter(c => c.entregado).length
  const pendientes = total - entregados

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabecera Centrada en Responsive */}
        <div className="flex flex-col items-center text-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
              META RUN <span className="text-orange-500">8K</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1 text-lg">Entrega de kits y dorsales</p>
          </div>
          
          <AccionesHeader /> 
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center md:text-left">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Total Inscritos</p>
            <p className="text-5xl font-black text-gray-900">{total}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden text-center md:text-left">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Entregados</p>
            <p className="text-5xl font-black text-gray-900">{entregados}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden text-center md:text-left">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Por Entregar</p>
            <p className="text-5xl font-black text-orange-500">{pendientes}</p>
          </div>
        </div>

        <ListaCorredores corredoresIniciales={corredores} />
      </div>
    </main>
  )
}