/**
 * Página: GradePage
 * Página principal del módulo de Notas - Lista todos los registros
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GradeList } from '../components/GradeList'
import type { Grade } from '../models/grades.model'

export function GradePage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // TODO: Implementar servicio
        // const data = await gradesService.getAll()
        // setItems(data)

        // Datos de ejemplo
        setItems([
          {
            id: '1',
            name: 'Ejemplo 1',
            description: 'Descripción de ejemplo',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ])
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      // TODO: Implementar servicio
      // await gradesService.delete(id)
      setItems(items.filter((item) => item.id !== id))
      console.log('Eliminar registro:', id)
    } catch (error) {
      console.error('Error al eliminar:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notas</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestión de calificaciones y evaluaciones
          </p>
        </div>
        <button
          onClick={() => navigate('/notas/nuevo')}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Nuevo Registro
        </button>
      </div>

      <GradeList items={items} onDelete={handleDelete} />
    </div>
  )
}
