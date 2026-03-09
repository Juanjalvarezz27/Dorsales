"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import * as xlsx from "xlsx"

export default function ImportarPage() {
  const router = useRouter()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState("")

  const manejarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0])
      setMensaje("")
    }
  }

  const procesarExcel = async () => {
    if (!archivo) {
      setMensaje("Por favor, selecciona un archivo primero.")
      return
    }

    setCargando(true)
    setMensaje("Leyendo archivo Excel...")

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = e.target?.result
        const workbook = xlsx.read(data, { type: "binary" })
        const nombrePrimeraHoja = workbook.SheetNames[0]
        const hoja = workbook.Sheets[nombrePrimeraHoja]
        const datosExtraidos = xlsx.utils.sheet_to_json(hoja, { header: 1 })

        setMensaje("Sincronizando con la base de datos...")

        const response = await fetch('/api/corredores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosExtraidos),
        })

        const resultado = await response.json()

        if (response.ok) {
          setMensaje(`¡Éxito! Se sincronizaron ${resultado.guardados} corredores correctamente. Redirigiendo...`)
          setTimeout(() => {
            router.push("/")
            router.refresh()
          }, 2000)
        } else {
          setMensaje("Hubo un error en el servidor: " + resultado.error)
        }
      } catch (error) {
        setMensaje("Error procesando el archivo. Asegúrate de que sea un .xlsx válido.")
      } finally {
        setCargando(false)
      }
    }
    reader.readAsBinaryString(archivo)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      
      <Link href="/" className="mb-8 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2">
        &larr; Volver al panel
      </Link>

      <div className="bg-white p-10 rounded-3xl shadow-sm max-w-md w-full border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
          Cargar <span className="text-orange-500">Inscritos</span>
        </h1>
        <p className="text-gray-500 mb-8 font-medium">
          Sube el archivo Excel para actualizar la base de datos de la carrera.
        </p>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-200 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-12 h-12 mb-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <p className="mb-2 text-sm text-gray-900 font-bold text-center px-4">
                  {archivo ? archivo.name : "Haz clic para subir el .xlsx"}
                </p>
                <p className="text-xs text-gray-500 font-medium">Solo formato .xlsx o .xls</p>
              </div>
              <input id="dropzone-file" type="file" accept=".xlsx, .xls" className="hidden" onChange={manejarArchivo} />
            </label>
          </div>

          <button 
            onClick={procesarExcel}
            disabled={cargando || !archivo}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-4 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {cargando ? "Procesando datos..." : "Sincronizar"}
          </button>

          {mensaje && (
            <div className={`p-4 rounded-2xl text-sm font-bold text-center ${mensaje.includes('Éxito') ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
              {mensaje}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}