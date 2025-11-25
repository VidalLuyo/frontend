/**
 * Página: EnrollmentCreatePage
 * Página para crear una nueva matrícula
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { EnrollmentForm } from '../components/EnrollmentForm'
import { enrollmentService } from '../service/Enrollment.service'
import { academicPeriodService } from '../service/AcademicPeriod.service'
import type { Enrollment } from '../models/enrollments.model'
import type { AcademicPeriod } from '../models/academicPeriod.model'

export function EnrollmentCreatePage() {
  const navigate = useNavigate()
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  useEffect(() => {
    const fetchAcademicPeriods = async () => {
      try {
        const periods = await academicPeriodService.getAllAcademicPeriods()
        setAcademicPeriods(periods)
      } catch (error) {
        console.error('Error loading academic periods:', error)
        setNotification({ type: 'error', message: 'Error al cargar los períodos académicos' })
      } finally {
        setLoading(false)
      }
    }

    fetchAcademicPeriods()
  }, [])

  const handleSave = async (enrollment: Enrollment) => {
    try {
      await enrollmentService.createEnrollment(enrollment)
      setNotification({ type: 'success', message: 'Matrícula creada correctamente' })
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/matriculas')
      }, 1500)
    } catch (error) {
      console.error('Error creating enrollment:', error)
      setNotification({ type: 'error', message: 'Error al crear la matrícula' })
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-lg text-gray-600">Cargando formulario...</p>
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg text-white p-6">
        <div className="flex items-center">
          <button
            onClick={handleCancel}
            className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Nueva Matrícula</h1>
            <p className="text-blue-100">Complete el formulario para crear una nueva matrícula</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <EnrollmentForm
          academicPeriods={academicPeriods}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
