/**
 * Página: TeacherPage
 * Página principal del módulo de Gestión de Profesores - Lista todos los registros
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TeacherList } from '../components/TeacherList'
import type { Teacher } from '../models/teacher.model'

export function TeacherPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // TODO: Implementar servicio
        // const data = await teacherService.getAll()
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
      // await teacherService.delete(id)
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Profesores</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestión de profesores y asignaciones
          </p>
        </div>
        <button
          onClick={() => navigate('/cursos/nuevo')}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Nuevo Registro
        </button>
      </div>

      <TeacherList items={items} onDelete={handleDelete} />
    </div>
  )
}
