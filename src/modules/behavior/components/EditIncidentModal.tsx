import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, MapPin, AlertTriangle, FileText, Save } from 'lucide-react';
import StudentSelector from './StudentSelector';
import UserSelector from './UserSelector';
import { showConfirmDialog } from '../../../shared/utils/sweetAlert';
import type { Student } from '../../student/models/student.model';
import type { User as UserType } from '../../users/models/users.model';
import type { 
  EditIncidentModalProps, 
  IncidentUpdateRequest,
  IncidentType,
  SeverityLevel,
  IncidentStatus,
  IncidentFormData
} from '../models/incident.interface';



// Utility functions for date/time array conversion
const formatIncidentDate = (date: string | number[]): string => {
  if (Array.isArray(date)) {
    // Convert [year, month, day] to YYYY-MM-DD format
    const [year, month, day] = date;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  return date;
};

const formatIncidentTime = (time: string | number[]): string => {
  if (Array.isArray(time)) {
    // Convert [hour, minute] to HH:MM format
    const [hour, minute] = time;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  return time;
};

const formatReportedAt = (reportedAt: string | number[]): string => {
  const formatToCustomDateTime = (date: Date): string => {
    const day = date.getDate();
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                   'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };
  
  if (Array.isArray(reportedAt)) {
    // Convert [year, month, day, hour, minute, second, nanoseconds] to Date
    const [year, month, day, hour, minute, second] = reportedAt;
    const date = new Date(year, month - 1, day, hour, minute, second); // month is 0-indexed in JS Date
    return formatToCustomDateTime(date);
  }
  return formatToCustomDateTime(new Date(reportedAt));
};

// Interfaz extendida para el formulario de edición
interface EditIncidentFormData extends IncidentFormData {
  parentsNotified: boolean;
  notificationDate: string;
  followUpRequired: boolean;
  status: IncidentStatus;
  resolvedBy: string;
}

const EditIncidentModal: React.FC<EditIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  incident,
  loading = false
}) => {
  // Verificar si el incidente está cerrado
  const isIncidentClosed = incident?.status === 'CLOSED';
  const [formData, setFormData] = useState<EditIncidentFormData>({
    studentId: '',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
    academicYear: new Date().getFullYear(),
    incidentType: 'COMPORTAMIENTO' as IncidentType,
    severityLevel: 'LEVE' as SeverityLevel,
    description: '',
    location: '',
    witnesses: '',
    otherStudentsInvolved: [],
    immediateAction: '',
    reportedBy: '',
    parentsNotified: false,
    notificationDate: '',
    followUpRequired: false,
    status: 'OPEN' as IncidentStatus,
    resolvedBy: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (isOpen && incident) {
      setFormData({
        studentId: incident.studentId,
        incidentDate: formatIncidentDate(incident.incidentDate),
        incidentTime: formatIncidentTime(incident.incidentTime),
        academicYear: incident.academicYear,
        incidentType: incident.incidentType,
        severityLevel: incident.severityLevel,
        description: incident.description,
        location: incident.location,
        witnesses: incident.witnesses || '',
        otherStudentsInvolved: incident.otherStudentsInvolved || [],
        immediateAction: incident.immediateAction || '',
        reportedBy: incident.reportedBy,
        parentsNotified: incident.parentsNotified || false,
        notificationDate: incident.notificationDate ? 
          new Date(incident.notificationDate).toISOString().slice(0, 16) : '',
        followUpRequired: incident.followUpRequired || false,
        status: incident.status,
        resolvedBy: incident.resolvedBy || ''
      });
      setErrors({});
      setSelectedStudent(null);
    }
  }, [isOpen, incident]);

  const handleInputChange = (field: keyof EditIncidentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error si existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Funciones de validación en tiempo real
  const getFieldValidationState = (field: string): 'valid' | 'invalid' | 'neutral' => {
    const alphanumericRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,;:()\-]+$/;
    
    switch(field) {
      case 'location':
        if (!formData.location) return 'neutral';
        return formData.location.trim().length >= 5 ? 'valid' : 'invalid';
      
      case 'description':
        if (!formData.description) return 'neutral';
        return formData.description.trim().length >= 5 ? 'valid' : 'invalid';
      
      case 'witnesses':
        if (!formData.witnesses || !formData.witnesses.trim()) return 'neutral';
        const witnessesValid = formData.witnesses.trim().length >= 5 && alphanumericRegex.test(formData.witnesses);
        return witnessesValid ? 'valid' : 'invalid';
      
      case 'immediateAction':
        if (!formData.immediateAction) return 'neutral';
        const actionValid = formData.immediateAction.trim().length >= 5 && alphanumericRegex.test(formData.immediateAction);
        return actionValid ? 'valid' : 'invalid';
      
      default:
        return 'neutral';
    }
  };

  const getFieldClassName = (field: string, baseClass: string = 'border-gray-300'): string => {
    const state = getFieldValidationState(field);
    if (errors[field]) return 'border-red-500';
    if (state === 'valid') return 'border-green-500';
    if (state === 'invalid') return 'border-red-500';
    return baseClass;
  };



  const handleStudentChange = (studentId: string, student?: Student) => {
    setFormData(prev => ({ ...prev, studentId }));
    setSelectedStudent(student || null);
    
    // Limpiar error del estudiante si existía
    if (errors.studentId) {
      setErrors(prev => ({ ...prev, studentId: '' }));
    }
  };

  const addStudentInvolved = () => {
    setFormData(prev => ({
      ...prev,
      otherStudentsInvolved: [...prev.otherStudentsInvolved, '']
    }));
  };

  const updateStudentInvolved = (index: number, studentId: string) => {
    setFormData(prev => ({
      ...prev,
      otherStudentsInvolved: prev.otherStudentsInvolved.map((id, i) => 
        i === index ? studentId : id
      )
    }));
  };

  const removeStudentInvolved = (index: number) => {
    setFormData(prev => ({
      ...prev,
      otherStudentsInvolved: prev.otherStudentsInvolved.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const alphanumericRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,;:()\-]+$/;

    // Los campos studentId, fecha, hora, año académico, tipo, severidad y reportedBy no se validan 
    // porque están deshabilitados en modo edición

    // Validar descripción mínimo 5 caracteres
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.trim().length < 5) {
      newErrors.description = 'La descripción debe tener al menos 5 caracteres';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'La descripción no puede exceder 1000 caracteres';
    }

    // Validar ubicación mínimo 5 caracteres
    if (!formData.location.trim()) {
      newErrors.location = 'La ubicación es requerida';
    } else if (formData.location.trim().length < 5) {
      newErrors.location = 'La ubicación debe tener al menos 5 caracteres';
    } else if (formData.location.length > 200) {
      newErrors.location = 'La ubicación no puede exceder 200 caracteres';
    }

    // Validar testigos mínimo 5 caracteres y solo letras y números
    if (formData.witnesses && formData.witnesses.trim()) {
      if (formData.witnesses.trim().length < 5) {
        newErrors.witnesses = 'Los testigos deben tener al menos 5 caracteres';
      } else if (!alphanumericRegex.test(formData.witnesses)) {
        newErrors.witnesses = 'Los testigos solo pueden contener letras, números y signos de puntuación básicos';
      } else if (formData.witnesses.length > 500) {
        newErrors.witnesses = 'Los testigos no pueden exceder 500 caracteres';
      }
    }

    // Validar acción inmediata mínimo 5 caracteres y solo letras y números (OBLIGATORIO)
    if (!formData.immediateAction || !formData.immediateAction.trim()) {
      newErrors.immediateAction = 'La acción inmediata es requerida';
    } else if (formData.immediateAction.trim().length < 5) {
      newErrors.immediateAction = 'La acción inmediata debe tener al menos 5 caracteres';
    } else if (!alphanumericRegex.test(formData.immediateAction)) {
      newErrors.immediateAction = 'La acción inmediata solo puede contener letras, números y signos de puntuación básicos';
    } else if (formData.immediateAction.length > 500) {
      newErrors.immediateAction = 'La acción inmediata no puede exceder 500 caracteres';
    }

    if (formData.status === 'RESOLVED' && !formData.resolvedBy.trim()) {
      newErrors.resolvedBy = 'Se requiere especificar quien resolvió el incidente';
    }

    // Validar flujo de estados
    if (incident) {
      if (incident.status === 'RESOLVED' && formData.status === 'OPEN') {
        newErrors.status = 'No se puede cambiar de "Resuelto" a "Abierto"';
      }
      if (incident.status === 'CLOSED') {
        newErrors.status = 'No se puede modificar un incidente cerrado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !incident) {
      return;
    }

    // Mostrar confirmación antes de actualizar
    let confirmTitle = '¿Actualizar incidente?';
    let confirmMessage = `Se actualizará el incidente con ID: ${incident.id.substring(0, 8)}... Estado: ${formData.status}. ¿Desea continuar?`;
    
    // Mensaje especial para incidentes graves
    if (formData.severityLevel === 'GRAVE') {
      confirmTitle = '¿Actualizar incidente GRAVE?';
      confirmMessage = `ATENCIÓN: Este es un incidente de severidad GRAVE. Se actualizará con estado: ${formData.status}. ¿Está seguro de que desea continuar?`;
    }
    
    const result = await showConfirmDialog(confirmTitle, confirmMessage);

    if (!result.isConfirmed) {
      return;
    }

    try {
      const submitData: IncidentUpdateRequest = {
        studentId: formData.studentId,
        incidentDate: formData.incidentDate,
        incidentTime: formData.incidentTime + ':00', // Add seconds
        academicYear: formData.academicYear,
        incidentType: formData.incidentType,
        severityLevel: formData.severityLevel,
        description: formData.description.trim(),
        location: formData.location.trim(),
        witnesses: formData.witnesses.trim() || undefined,
        otherStudentsInvolved: formData.otherStudentsInvolved.length > 0 ? 
          formData.otherStudentsInvolved.filter(id => id.trim() !== '') : 
          undefined,
        immediateAction: formData.immediateAction.trim() || undefined,
        parentsNotified: formData.parentsNotified,
        notificationDate: formData.notificationDate ?
          new Date(formData.notificationDate).toISOString() :
          undefined,
        followUpRequired: formData.followUpRequired,
        status: formData.status,
        resolvedBy: formData.resolvedBy.trim() || undefined,
        reportedBy: formData.reportedBy.trim() || undefined
      };
      
      await onSubmit(incident.id, submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-orange-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Editar Incidente Disciplinario
              </h2>
              <p className="text-sm text-gray-600">
                Modifica los detalles del incidente disciplinario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          
          {/* Mensaje de advertencia para incidentes cerrados */}
          {isIncidentClosed && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center text-red-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <strong>Incidente Cerrado</strong>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Este incidente está cerrado y no puede ser modificado. Solo se permite visualización.
              </p>
            </div>
          )}
          {/* Selector de Estudiante */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <User className="h-4 w-4 inline mr-1" />
              Estudiante *
            </label>
            <StudentSelector
              value={formData.studentId}
              onChange={handleStudentChange}
              error={errors.studentId}
              disabled={true}
              placeholder="Seleccionar estudiante"
              className="w-full bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">
              ℹ️ Este campo no puede ser modificado
            </p>
            {selectedStudent && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-sm text-green-800">
                  <User className="h-4 w-4 mr-2" />
                  <div>
                    <span className="font-medium">{selectedStudent.personalInfo?.names} {selectedStudent.personalInfo?.lastNames}</span>
                    <span className="text-green-600 ml-2">({selectedStudent.personalInfo?.documentNumber})</span>
                  </div>
                </div>
                {(selectedStudent.classroomId || selectedStudent.institutionId) && (
                  <div className="mt-1 text-xs text-green-600">
                    {selectedStudent.classroomId && `Aula: ${selectedStudent.classroomId}`}
                    {selectedStudent.classroomId && selectedStudent.institutionId && ' • '}
                    {selectedStudent.institutionId && `Institución: ${selectedStudent.institutionId}`}
                  </div>
                )}
              </div>
            )}
            {incident && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Información original del incidente:</strong>
                  <div className="mt-1 text-xs">
                    <div>Estudiante: {incident.studentName || incident.studentId}</div>
                    <div>Aula: {incident.classroomName || incident.classroomId}</div>
                    <div>Institución: {incident.institutionName || incident.institutionId}</div>
                    <div>Reportado por: {incident.reportedByName || incident.reportedBy}</div>
                    <div>Fecha de reporte: {formatReportedAt(incident.reportedAt)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date/Time and Academic Year */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Incident Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha del Incidente *
              </label>
              <input
                type="text"
                value={(() => {
                  if (formData.incidentDate) {
                    const date = new Date(formData.incidentDate);
                    const day = date.getDate();
                    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                    const month = months[date.getMonth()];
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`;
                  }
                  return '';
                })()}
                onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed ${
                  errors.incidentDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={true}
                readOnly
              />
              {errors.incidentDate && <p className="text-red-500 text-xs mt-1">{errors.incidentDate}</p>}
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Este campo no puede ser modificado
              </p>
            </div>

            {/* Incident Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Hora del Incidente *
              </label>
              <input
                type="text"
                value={formData.incidentTime}
                onChange={(e) => handleInputChange('incidentTime', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed ${
                  errors.incidentTime ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={true}
                readOnly
              />
              {errors.incidentTime && <p className="text-red-500 text-xs mt-1">{errors.incidentTime}</p>}
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Este campo no puede ser modificado
              </p>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año Académico *
              </label>
              <input
                type="number"
                value={formData.academicYear}
                onChange={(e) => handleInputChange('academicYear', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed ${
                  errors.academicYear ? 'border-red-500' : 'border-gray-300'
                }`}
                min="2020"
                max="2030"
                disabled={true}
                readOnly
              />
              {errors.academicYear && <p className="text-red-500 text-xs mt-1">{errors.academicYear}</p>}
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Este campo no puede ser modificado
              </p>
            </div>
          </div>

          {/* Type and Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Incident Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Incidente *
              </label>
              <select
                value={formData.incidentType}
                onChange={(e) => handleInputChange('incidentType', e.target.value as IncidentType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                disabled={true}
              >
                <option value="ACCIDENTE">Accidente</option>
                <option value="CONFLICTO">Conflicto</option>
                <option value="COMPORTAMIENTO">Comportamiento</option>
                <option value="EMOCIONAL">Emocional</option>
                <option value="SALUD">Salud</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Este campo no puede ser modificado
              </p>
            </div>

            {/* Severity Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Nivel de Severidad *
              </label>
              <select
                value={formData.severityLevel}
                onChange={(e) => handleInputChange('severityLevel', e.target.value as SeverityLevel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                disabled={true}
              >
                <option value="LEVE">Leve</option>
                <option value="MODERADO">Moderado</option>
                <option value="GRAVE">Grave</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Este campo no puede ser modificado
              </p>
            </div>
          </div>

          {/* Reported By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reportado por *
            </label>
            <UserSelector
              value={formData.reportedBy}
              onChange={(userId: string, user?: UserType) => {
                handleInputChange('reportedBy', userId);
                // Opcional: guardar información adicional del usuario
                console.log('Usuario seleccionado:', user);
              }}
              error={errors.reportedBy}
              disabled={true}
              placeholder="Seleccionar usuario que reporta"
              allowedRoles={['PROFESOR', 'AUXILIAR', 'DIRECTOR']}
              className="w-full bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              ℹ️ Este campo no puede ser modificado
            </p>
            {incident && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Usuario original:</strong> {incident.reportedByName || incident.reportedBy}
                </div>
              </div>
            )}
          </div>

          {/* Status and Additional Fields */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Seguimiento del Incidente</h3>
            
            {/* Status */}
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado del Incidente
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as IncidentStatus)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    isIncidentClosed ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  disabled={loading || isIncidentClosed}
                >
                  <option value="OPEN" disabled={incident?.status === 'RESOLVED' || incident?.status === 'CLOSED'}>
                    Abierto {incident?.status === 'RESOLVED' ? '(No disponible - ya fue resuelto)' : ''}
                  </option>
                  <option value="RESOLVED">Resuelto</option>
                  <option value="CLOSED" disabled={incident?.status === 'OPEN'}>
                    Cerrado {incident?.status === 'OPEN' ? '(Debe estar resuelto primero)' : ''}
                  </option>
                </select>
                {incident?.status === 'RESOLVED' && formData.status === 'OPEN' && (
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ No se puede volver al estado "Abierto" desde "Resuelto"
                  </p>
                )}
                {incident?.status === 'OPEN' && formData.status === 'CLOSED' && (
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ No se puede cerrar un incidente sin resolverlo primero
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  💡 Flujo: Abierto → Resuelto → Cerrado
                </p>
              </div>

              {/* Resolved By (only if status is RESOLVED) */}
              {formData.status === 'RESOLVED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resuelto por *
                  </label>
                  <UserSelector
                    value={formData.resolvedBy}
                    onChange={(userId: string, user?: UserType) => {
                      handleInputChange('resolvedBy', userId);
                      // Opcional: guardar información adicional del usuario
                      console.log('Usuario que resolvió seleccionado:', user);
                    }}
                    error={errors.resolvedBy}
                    disabled={loading || isIncidentClosed}
                    placeholder="Seleccionar quien resolvió el incidente"
                    allowedRoles={['PROFESOR', 'AUXILIAR', 'DIRECTOR']}
                    className={`w-full ${isIncidentClosed ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                  {errors.resolvedBy && <p className="text-red-500 text-xs mt-1">{errors.resolvedBy}</p>}
                </div>
              )}
            </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="h-4 w-4 inline mr-1" />
              Ubicación *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                getFieldClassName('location')
              } ${isIncidentClosed ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Ingrese la ubicación donde ocurrió el incidente (mínimo 5 caracteres)"
              maxLength={200}
              disabled={loading || isIncidentClosed}
              readOnly={isIncidentClosed}
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            {formData.location && !errors.location && !isIncidentClosed && (
              <p className={`text-xs mt-1 ${
                getFieldValidationState('location') === 'valid' ? 'text-green-600' : 'text-red-600'
              }`}>
                {formData.location.trim().length}/5 caracteres mínimos
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="h-4 w-4 inline mr-1" />
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                getFieldClassName('description')
              } ${isIncidentClosed ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              rows={4}
              placeholder="Describa detalladamente el incidente (mínimo 5 caracteres)"
              maxLength={1000}
              disabled={loading || isIncidentClosed}
              readOnly={isIncidentClosed}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
              <p className={`text-xs ml-auto ${
                formData.description.trim().length >= 5 ? 'text-green-600' : 'text-gray-500'
              }`}>{formData.description.length}/1000 caracteres</p>
            </div>
          </div>

          {/* Witnesses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Testigos
            </label>
            <textarea
              value={formData.witnesses}
              onChange={(e) => handleInputChange('witnesses', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                getFieldClassName('witnesses')
              } ${isIncidentClosed ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              rows={2}
              placeholder="Mencione los testigos del incidente (opcional, mínimo 5 caracteres)"
              maxLength={500}
              disabled={loading || isIncidentClosed}
              readOnly={isIncidentClosed}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.witnesses && <p className="text-red-500 text-xs">{errors.witnesses}</p>}
              {formData.witnesses && !errors.witnesses && !isIncidentClosed && (
                <p className={`text-xs ${
                  getFieldValidationState('witnesses') === 'valid' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formData.witnesses.trim().length >= 5 ? '✓ Válido' : `${formData.witnesses.trim().length}/5 caracteres mínimos`}
                </p>
              )}
              <p className="text-gray-500 text-xs ml-auto">{formData.witnesses.length}/500 caracteres</p>
            </div>
          </div>

          {/* Other Students Involved */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Otros Estudiantes Involucrados
            </label>
            <div className="space-y-2">
              {formData.otherStudentsInvolved.map((studentId, index) => (
                <div key={index} className="flex gap-2">
                  <StudentSelector
                    value={studentId}
                    onChange={(id) => updateStudentInvolved(index, id)}
                    disabled={loading || isIncidentClosed}
                    placeholder="Seleccionar estudiante involucrado"
                    className={`flex-1 ${isIncidentClosed ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    excludeStudentId={formData.studentId}
                  />
                  <button
                    type="button"
                    onClick={() => removeStudentInvolved(index)}
                    className={`px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex-shrink-0 ${
                      isIncidentClosed ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    disabled={loading || isIncidentClosed}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addStudentInvolved}
                className={`text-orange-600 hover:text-orange-800 text-sm flex items-center gap-1 ${
                  isIncidentClosed ? 'cursor-not-allowed opacity-50' : ''
                }`}
                disabled={loading || isIncidentClosed}
              >
                <User className="h-4 w-4" />
                + Agregar estudiante
              </button>
            </div>
          </div>

          {/* Immediate Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acción Inmediata *
            </label>
            <textarea
              value={formData.immediateAction}
              onChange={(e) => handleInputChange('immediateAction', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                getFieldClassName('immediateAction')
              } ${isIncidentClosed ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              rows={3}
              placeholder="Describa las acciones inmediatas tomadas (mínimo 5 caracteres)"
              maxLength={500}
              disabled={loading || isIncidentClosed}
              readOnly={isIncidentClosed}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.immediateAction && <p className="text-red-500 text-xs">{errors.immediateAction}</p>}
              {formData.immediateAction && !errors.immediateAction && !isIncidentClosed && (
                <p className={`text-xs ${
                  getFieldValidationState('immediateAction') === 'valid' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formData.immediateAction.trim().length >= 5 ? '✓ Válido' : `${formData.immediateAction.trim().length}/5 caracteres mínimos`}
                </p>
              )}
              <p className="text-gray-500 text-xs ml-auto">{formData.immediateAction.length}/500 caracteres</p>
            </div>
          </div>

          {/* Follow up required */}
          <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={formData.followUpRequired}
                onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                className={`h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded ${
                  isIncidentClosed ? 'cursor-not-allowed' : ''
                }`}
                disabled={loading || isIncidentClosed}
              />
            <label htmlFor="followUpRequired" className="text-sm font-medium text-gray-700">
              Requiere seguimiento
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              {isIncidentClosed ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isIncidentClosed && (
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Actualizar Incidente
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditIncidentModal;