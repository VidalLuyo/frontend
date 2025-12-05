/**
 * Componente: EnrollmentList
 * Muestra la lista de matrículas con funcionalidad completa
 */

import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Eye, Edit, Trash2, User, GraduationCap, FileText, CheckCircle, RefreshCw } from 'lucide-react'
import type { Enrollment } from '../models/enrollments.model'
import type { StudentResponse } from '../models/integration.model'
import { studentIntegrationService } from '../service/Integration.service'
import PdfExportButton from './PdfExportButton'

interface EnrollmentListProps {
  readonly items: Enrollment[]
  readonly onDelete?: (id: string) => Promise<void>
  readonly onView?: (enrollment: Enrollment) => void
  readonly onEdit?: (enrollment: Enrollment) => void
  readonly onActivate?: (id: string) => Promise<void>
  readonly onRestore?: (id: string) => Promise<void>
  readonly showCancelledActions?: boolean
}

export function EnrollmentList({ items, onDelete, onView, onEdit, onActivate, onRestore, showCancelledActions }: EnrollmentListProps) {
  const navigate = useNavigate()
  
  // Estado para almacenar los datos de estudiantes
  const [studentsData, setStudentsData] = useState<Record<string, StudentResponse>>({})
  const [loadingStudents, setLoadingStudents] = useState<Set<string>>(new Set())
  const [studentErrors, setStudentErrors] = useState<Record<string, string>>({})

  // Cargar datos de estudiantes cuando cambian los items
  useEffect(() => {
    const loadStudentData = async () => {
      const studentIds = items.map(enrollment => enrollment.studentId)
      const uniqueStudentIds = [...new Set(studentIds)]
      
      // Filtrar estudiantes que ya no están cargados o están cargándose
      const studentsToLoad = uniqueStudentIds.filter(
        studentId => !studentsData[studentId] && !loadingStudents.has(studentId)
      )

      if (studentsToLoad.length === 0) return

      // Marcar estudiantes como cargándose
      setLoadingStudents(prev => new Set([...prev, ...studentsToLoad]))

      // Cargar datos de estudiantes en paralelo
      const studentPromises = studentsToLoad.map(async (studentId) => {
        try {
          const studentResponse = await studentIntegrationService.getStudentById(studentId)
          return { studentId, data: studentResponse, error: null }
        } catch (error) {
          return { studentId, data: null, error: error instanceof Error ? error.message : 'Error desconocido' }
        }
      })

      const results = await Promise.allSettled(studentPromises)
      
      // Actualizar estado con los resultados
      const newStudentsData: Record<string, StudentResponse> = {}
      const newStudentErrors: Record<string, string> = {}
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { studentId, data, error } = result.value
          if (data) {
            newStudentsData[studentId] = data
          } else if (error) {
            newStudentErrors[studentId] = error
          }
        }
      })

      setStudentsData(prev => ({ ...prev, ...newStudentsData }))
      setStudentErrors(prev => ({ ...prev, ...newStudentErrors }))
      setLoadingStudents(prev => {
        const newSet = new Set(prev)
        studentsToLoad.forEach(id => newSet.delete(id))
        return newSet
      })
    }

    loadStudentData()
  }, [items])

  // Función para obtener el nombre del estudiante
  const getStudentDisplayName = (studentId: string): string => {
    const studentData = studentsData[studentId]
    const error = studentErrors[studentId]
    
    if (loadingStudents.has(studentId)) {
      return 'Cargando...'
    }
    
    if (error) {
      // Mostrar mensaje más claro si el estudiante no existe
      if (error.includes('404') || error.includes('Not Found')) {
        return `Estudiante no encontrado`
      }
      return `Error al cargar`
    }
    
    if (studentData?.success && studentData.data) {
      const { names, lastNames } = studentData.data.personalInfo
      return `${names} ${lastNames}`.trim()
    }
    
    // Fallback al ID si no se puede cargar el nombre
    return `ID: ${studentId.slice(0, 8)}...`
  }

  // Función para obtener el estado visual del estudiante
  const getStudentDisplayState = (studentId: string) => {
    const error = studentErrors[studentId]
    const isLoading = loadingStudents.has(studentId)
    const hasData = studentsData[studentId]?.success

    if (isLoading) {
      return { 
        iconClass: 'bg-gray-100 animate-pulse', 
        userClass: 'text-gray-400',
        tooltip: 'Cargando datos del estudiante...'
      }
    }
    
    if (error) {
      const errorMsg = error.includes('404') || error.includes('Not Found')
        ? `Estudiante no encontrado en el sistema (ID: ${studentId})`
        : `Error al cargar estudiante (ID: ${studentId}): ${error}`;
      
      return { 
        iconClass: 'bg-red-100', 
        userClass: 'text-red-600',
        tooltip: errorMsg
      }
    }
    
    if (hasData) {
      return { 
        iconClass: 'bg-green-100', 
        userClass: 'text-green-600',
        tooltip: 'Datos del estudiante cargados correctamente'
      }
    }
    
    return { 
      iconClass: 'bg-blue-100', 
      userClass: 'text-blue-600',
      tooltip: `Datos del estudiante no disponibles (ID: ${studentId})`
    }
  }

  const handleView = (enrollment: Enrollment) => {
    if (onView) {
      onView(enrollment)
    } else {
      navigate(`/matriculas/${enrollment.id}`)
    }
  }

  const handleEdit = (enrollment: Enrollment) => {
    if (onEdit) {
      onEdit(enrollment)
    } else {
      navigate(`/matriculas/${enrollment.id}/editar`)
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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtener texto de estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activa';
      case 'INACTIVE': return 'Inactiva';
      case 'PENDING': return 'Pendiente';
      default: return status;
    }
  };

  // Obtener texto de grupo de edad
  const getAgeGroupText = (ageGroup: string) => {
    switch (ageGroup) {
      case '3_AÑOS': return '3 años';
      case '4_AÑOS': return '4 años';
      case '5_AÑOS': return '5 años';
      default: return ageGroup;
    }
  };

  // Obtener texto de modalidad
  const getModalityText = (modality: string) => {
    switch (modality) {
      case 'PRESENCIAL': return 'Presencial';
      case 'VIRTUAL': return 'Virtual';
      case 'HIBRIDA': return 'Híbrida';
      default: return modality;
    }
  };

  // Calcular progreso de documentos
  const calculateDocumentProgress = (enrollment: Enrollment) => {
    // Normalizar valores booleanos (convertir null/undefined a false)
    const normalizeBoolean = (value: any): boolean => {
      return value === true || value === 'true' || value === 1;
    };

    const documents = [
      normalizeBoolean(enrollment.birthCertificate),
      normalizeBoolean(enrollment.studentDni),
      normalizeBoolean(enrollment.guardianDni),
      normalizeBoolean(enrollment.vaccinationCard),
      normalizeBoolean(enrollment.disabilityCertificate),
      normalizeBoolean(enrollment.utilityBill),
      normalizeBoolean(enrollment.psychologicalReport),
      normalizeBoolean(enrollment.studentPhoto),
      normalizeBoolean(enrollment.healthRecord),
      normalizeBoolean(enrollment.signedEnrollmentForm),
      normalizeBoolean(enrollment.dniVerification)
    ];
    
    const completed = documents.filter(Boolean).length;
    const total = documents.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  // Formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay matrículas</h3>
        <p className="text-gray-500">No se encontraron matrículas para mostrar.</p>
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
                Estudiante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Información Académica
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Documentos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((enrollment) => {
              const docProgress = calculateDocumentProgress(enrollment);
              
              return (
                <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {(() => {
                        const displayState = getStudentDisplayState(enrollment.studentId)
                        return (
                          <div 
                            className={`rounded-full p-2 mr-3 ${displayState.iconClass}`}
                            title={displayState.tooltip}
                          >
                            <User className={`h-4 w-4 ${displayState.userClass}`} />
                          </div>
                        )
                      })()}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getStudentDisplayName(enrollment.studentId)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getAgeGroupText(enrollment.ageGroup)} - {enrollment.section}
                        </div>
                        <div className="text-xs text-gray-400">
                          {enrollment.enrollmentCode ? enrollment.enrollmentCode : `ID: ${enrollment.studentId.slice(0, 8)}...`}
                          {studentsData[enrollment.studentId]?.success && studentsData[enrollment.studentId].data && (
                            <span className="ml-2 text-green-600">
                              • CUI: {studentsData[enrollment.studentId].data.cui}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium flex items-center">
                        <GraduationCap className="h-4 w-4 mr-1 text-purple-600" />
                        {enrollment.academicYear}
                      </div>
                      <div className="text-gray-500">
                        {enrollment.shift} - {getModalityText(enrollment.modality)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {enrollment.institutionId}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(enrollment.enrollmentStatus || 'PENDING')}`}>
                      {getStatusText(enrollment.enrollmentStatus || 'PENDING')}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {enrollment.enrollmentType === 'NUEVA' ? 'Nueva' : 'Reinscripción'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            {docProgress.completed}/{docProgress.total}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">
                              {docProgress.percentage}%
                            </span>
                            {/* Indicador de datos de prueba */}

                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              docProgress.percentage === 100 ? 'bg-green-500' :
                              docProgress.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${docProgress.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(enrollment.enrollmentDate)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleView(enrollment)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(enrollment)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      {/* Botón de activar matrícula (solo para pendientes) */}
                      {enrollment.id && enrollment.enrollmentStatus === 'PENDING' && onActivate && !showCancelledActions && (
                        <button
                          onClick={() => onActivate(enrollment.id!)}
                          className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                          title="Activar matrícula"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}

                      {/* Botón de restaurar matrícula (solo para canceladas) */}
                      {enrollment.id && enrollment.enrollmentStatus === 'CANCELLED' && onRestore && showCancelledActions && (
                        <button
                          onClick={() => onRestore(enrollment.id!)}
                          className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                          title="Restaurar como pendiente"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Botón de exportar PDF individual */}
                      <PdfExportButton
                        enrollment={enrollment}
                        variant="single"
                        className=""
                      />
                      
                      {/* Botón de cancelar (solo para no canceladas) */}
                      {enrollment.id && enrollment.enrollmentStatus !== 'CANCELLED' && onDelete && !showCancelledActions && (
                        <button
                          onClick={() => handleDelete(enrollment.id!)}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                          title="Cancelar matrícula"
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
  )
}
