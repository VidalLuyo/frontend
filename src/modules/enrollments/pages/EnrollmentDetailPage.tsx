/**
 * Página: EnrollmentDetailPage
 * Página para ver los detalles completos de una matrícula
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Building, 
  GraduationCap, 
  FileText, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Calendar
} from 'lucide-react'
import { enrollmentService } from '../service/Enrollment.service'
import type { Enrollment } from '../models/enrollments.model'

export function EnrollmentDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEnrollment = async () => {
      if (!id) {
        setError('ID de matrícula no proporcionado')
        setLoading(false)
        return
      }

      try {
        const enrollmentData = await enrollmentService.getEnrollmentById(id)
        setEnrollment(enrollmentData)
      } catch (error) {
        console.error('Error loading enrollment:', error)
        setError('Error al cargar los datos de la matrícula')
      } finally {
        setLoading(false)
      }
    }

    fetchEnrollment()
  }, [id])

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

  // Obtener texto de tipo de matrícula
  const getEnrollmentTypeText = (type: string) => {
    switch (type) {
      case 'NUEVA': return 'Nueva';
      case 'REINSCRIPCION': return 'Reinscripción';
      default: return type;
    }
  };

  // Calcular progreso de documentos
  const calculateDocumentProgress = (enrollment: Enrollment) => {
    const documents = [
      enrollment.birthCertificate,
      enrollment.studentDni,
      enrollment.guardianDni,
      enrollment.vaccinationCard,
      enrollment.disabilityCertificate,
      enrollment.utilityBill,
      enrollment.psychologicalReport,
      enrollment.studentPhoto,
      enrollment.healthRecord,
      enrollment.signedEnrollmentForm,
      enrollment.dniVerification
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = () => {
    navigate(`/matriculas/${id}/editar`)
  }

  const handleBack = () => {
    navigate('/matriculas')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mr-3" />
            <p className="text-lg text-gray-600">Cargando detalles de la matrícula...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !enrollment) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <XCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="text-red-700">{error || 'No se pudo cargar la matrícula'}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    )
  }

  const docProgress = calculateDocumentProgress(enrollment);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold mb-2">Detalles de Matrícula</h1>
              <p className="text-blue-100">
                {enrollment.enrollmentCode || enrollment.studentId}
              </p>
            </div>
          </div>
          <button
            onClick={handleEdit}
            className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </button>
        </div>
      </div>

      {/* Información del Estudiante */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
          <User className="mr-2" size={20} />
          Información del Estudiante
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">ID del Estudiante</h4>
            <p className="text-sm font-medium text-gray-900">{enrollment.studentId}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Grupo de Edad</h4>
            <p className="text-sm font-medium text-gray-900">{getAgeGroupText(enrollment.ageGroup)}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Edad</h4>
            <p className="text-sm font-medium text-gray-900">{enrollment.studentAge} años</p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Código de Matrícula</h4>
            <p className="text-sm font-medium text-gray-900">{enrollment.enrollmentCode || 'No asignado'}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Estado</h4>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(enrollment.enrollmentStatus || 'PENDING')}`}>
              {getStatusText(enrollment.enrollmentStatus || 'PENDING')}
            </span>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Tipo de Matrícula</h4>
            <p className="text-sm font-medium text-gray-900">{getEnrollmentTypeText(enrollment.enrollmentType || 'NUEVA')}</p>
          </div>
        </div>
      </div>

      {/* Información Institucional */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
        <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
          <Building className="mr-2" size={20} />
          Información Institucional
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Institución</h4>
            <p className="text-sm font-medium text-gray-900">{enrollment.institutionId}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Aula</h4>
            <p className="text-sm font-medium text-gray-900">{enrollment.classroomId}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Sección</h4>
            <p className="text-sm font-medium text-gray-900">{enrollment.section}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Turno</h4>
            <p className="text-sm font-medium text-gray-900">{enrollment.shift}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Modalidad</h4>
            <p className="text-sm font-medium text-gray-900">{getModalityText(enrollment.modality)}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Nivel Educativo</h4>
            <p className="text-sm font-medium text-gray-900">{enrollment.educationalLevel}</p>
          </div>
        </div>
      </div>

      {/* Información Académica */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
        <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
          <GraduationCap className="mr-2" size={20} />
          Información Académica
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">Año Académico</h4>
            <p className="text-sm font-medium text-gray-900">{enrollment.academicYear}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">Período Académico</h4>
            <p className="text-sm font-medium text-gray-900">{enrollment.academicPeriodId}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">Fecha de Matrícula</h4>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-green-600 mr-1" />
              <p className="text-sm font-medium text-gray-900">{formatDate(enrollment.enrollmentDate)}</p>
            </div>
          </div>
          
          {enrollment.previousInstitution && (
            <div className="md:col-span-2 lg:col-span-3">
              <h4 className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">Institución Anterior</h4>
              <p className="text-sm font-medium text-gray-900">{enrollment.previousInstitution}</p>
            </div>
          )}
        </div>
      </div>

      {/* Estado de Documentos */}
      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-100">
        <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
          <FileText className="mr-2" size={20} />
          Estado de Documentos
        </h3>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-800">
              {docProgress.completed} de {docProgress.total} documentos completados
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              docProgress.percentage === 100 ? 'bg-green-100 text-green-800' :
              docProgress.percentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            }`}>
              {docProgress.percentage}%
            </span>
          </div>
          
          <div className="bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${
                docProgress.percentage === 100 ? 'bg-green-500' :
                docProgress.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${docProgress.percentage}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'birthCertificate', label: 'Certificado de Nacimiento' },
            { key: 'studentDni', label: 'DNI del Estudiante' },
            { key: 'guardianDni', label: 'DNI del Apoderado' },
            { key: 'vaccinationCard', label: 'Carné de Vacunación' },
            { key: 'disabilityCertificate', label: 'Certificado de Discapacidad' },
            { key: 'utilityBill', label: 'Recibo de Servicios' },
            { key: 'psychologicalReport', label: 'Informe Psicológico' },
            { key: 'studentPhoto', label: 'Foto del Estudiante' },
            { key: 'healthRecord', label: 'Ficha de Salud' },
            { key: 'signedEnrollmentForm', label: 'Formulario de Matrícula Firmado' },
            { key: 'dniVerification', label: 'Verificación de DNI' }
          ].map((doc) => (
            <div key={doc.key} className="flex items-center p-3 bg-white rounded-lg border border-orange-200">
              {enrollment[doc.key as keyof Enrollment] ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mr-3" />
              )}
              <span className={`text-sm font-medium ${
                enrollment[doc.key as keyof Enrollment] ? 'text-green-700' : 'text-red-700'
              }`}>
                {doc.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Observaciones */}
      {enrollment.observations && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <FileText className="mr-2" size={20} />
            Observaciones
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">{enrollment.observations}</p>
        </div>
      )}

      {/* Acciones */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          onClick={handleBack}
          className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Volver a la lista
        </button>
        <button
          onClick={handleEdit}
          className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Editar Matrícula
        </button>
      </div>
    </div>
  )
}
