/**
 * Componente: TeacherList
 * Muestra la lista de gestión de profesores
 */

import { useNavigate } from 'react-router-dom'
import type { Teacher } from '../models/teacher.model'

interface TeacherListProps {
  readonly items: Teacher[]
  readonly onDelete?: (id: string) => void
}

export function TeacherList({ items, onDelete }: TeacherListProps) {
  const navigate = useNavigate()

  const handleView = (id: string) => {
    navigate(`/cursos/${id}`)
  }

  const handleEdit = (id: string) => {
    navigate(`/cursos/${id}/editar`)
  }

  const handleDelete = (id: string) => {
    if (globalThis.confirm('¿Estás seguro de eliminar este registro?')) {
      onDelete?.(id)
    }
  }

  const getStatusClass = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descripción
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{item.name}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {item.description || 'Sin descripción'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleView(item.id)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Ver
                </button>
                <button
                  onClick={() => handleEdit(item.id)}
                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
