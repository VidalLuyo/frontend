/**
 * Página: EnrollmentEditPage
 * Página para editar una matrícula existente
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { EnrollmentForm } from '../components/EnrollmentForm'
import { enrollmentService } from '../service/Enrollment.service'
import { academicPeriodService } from '../service/AcademicPeriod.service'
import type { Enrollment } from '../models/enrollments.model'
import type { AcademicPeriod } from '../models/academicPeriod.model'

export function EnrollmentEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('ID de matrícula no proporcionado')
        setLoading(false)
        return
      }

      try {
        const [enrollmentData, periodsData] = await Promise.all([
          enrollmentService.getEnrollmentById(id),
          academicPeriodService.getAllAcademicPeriods()
        ])
        
        setEnrollment(enrollmentData)
        setAcademicPeriods(periodsData)
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Error al cargar los datos de la matrícula')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleSave = async (updatedEnrollment: Enrollment) => {
    if (!id) return

    try {
      await enrollmentService.updateEnrollment(id, updatedEnrollment)
      setNotification({ type: 'success', message: 'Matrícula actualizada correctamente' })
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/matriculas')
      }, 1500)
    } catch (error) {
      console.error('Error updating enrollment:', error)
      setNotification({ type: 'error', message: 'Error al actualizar la matrícula' })
    }
  }

  const handleCancel = () => {
    navigate('/matriculas')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mr-3" />
            <p className="text-lg text-gray-600">Cargando matrícula...</p>
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
              onClick={handleCancel}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Notificación */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-400 text-green-800' 
            : 'bg-red-50 border-red-400 text-red-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
            {notification.type === 'error' && <XCircle className="h-5 w-5 mr-2" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-lg text-white p-6">
        <div className="flex items-center">
          <button
            onClick={handleCancel}
            className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Editar Matrícula</h1>
            <p className="text-indigo-100">
              Modificando matrícula: {enrollment.enrollmentCode || enrollment.studentId}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <EnrollmentForm
          enrollment={enrollment}
          academicPeriods={academicPeriods}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
