/**
 * Componente: AcademicPeriodList
 * Muestra la lista de períodos académicos con funcionalidad completa
 */

import { Eye, Edit, Trash2, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { AcademicPeriod } from '../models/academicPeriod.model'

interface AcademicPeriodListProps {
  readonly items: AcademicPeriod[]
  readonly onDelete?: (id: string) => void
  readonly onView?: (period: AcademicPeriod) => void
  readonly onEdit?: (period: AcademicPeriod) => void
}

export function AcademicPeriodList({ items, onDelete, onView, onEdit }: AcademicPeriodListProps) {

  const handleView = (period: AcademicPeriod) => {
    if (onView) {
      onView(period)
    }
  }

  const handleEdit = (period: AcademicPeriod) => {
    if (onEdit) {
      onEdit(period)
    }
  }

  const handleDelete = (id: string) => {
    onDelete?.(id)
  }

  // Obtener clase de badge de estado
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtener texto de estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activo';
      case 'INACTIVE': return 'Inactivo';
      case 'PENDING': return 'Pendiente';
      case 'CLOSED': return 'Cerrado';
      default: return status;
    }
  };

  // Verificar si un período está activo
  const isPeriodActive = (period: AcademicPeriod) => {
    const now = new Date();
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    return now >= startDate && now <= endDate && period.status === 'ACTIVE';
  };

  // Verificar si el período de matrícula está abierto
  const isEnrollmentOpen = (period: AcademicPeriod) => {
    const now = new Date();
    const enrollmentStart = new Date(period.enrollmentPeriodStart);
    const enrollmentEnd = new Date(period.enrollmentPeriodEnd);
    return now >= enrollmentStart && now <= enrollmentEnd && period.status === 'ACTIVE';
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Formatear rango de fechas
  const formatDateRange = (startDate: string, endDate: string) => {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay períodos académicos</h3>
        <p className="text-gray-500">No se encontraron períodos académicos para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Período
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fechas del Período
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Período de Matrícula
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Matrícula Tardía
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((period) => {
              const isActive = isPeriodActive(period);
              const enrollmentOpen = isEnrollmentOpen(period);
              
              return (
                <tr key={period.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-purple-100 rounded-full p-2 mr-3">
                        <Calendar className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {period.periodName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {period.academicYear}
                        </div>
                        <div className="text-xs text-gray-400">
                          {period.institutionId}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDateRange(period.startDate, period.endDate)}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {isActive ? 'Período activo' : 'Período inactivo'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDateRange(period.enrollmentPeriodStart, period.enrollmentPeriodEnd)}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      {enrollmentOpen ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          Matrícula abierta
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1 text-red-500" />
                          Matrícula cerrada
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(period.status)}`}>
                      {getStatusText(period.status)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {period.allowLateEnrollment ? (
                      <div>
                        <div className="text-sm text-green-600 font-medium">Permitida</div>
                        {period.lateEnrollmentEndDate && (
                          <div className="text-xs text-gray-500">
                            Hasta: {formatDate(period.lateEnrollmentEndDate)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600 font-medium">No permitida</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleView(period)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(period)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {period.id && (
                        <button
                          onClick={() => handleDelete(period.id!)}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
