import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, MapPin, AlertTriangle, FileText } from 'lucide-react';
import StudentSelector from './StudentSelector';
import UserSelector from './UserSelector';
import { showConfirmDialog } from '../../../shared/utils/sweetAlert';
import type { 
  CreateIncidentModalProps, 
  IncidentCreateRequest,
  IncidentType,
  SeverityLevel,
  IncidentFormData
} from '../models/incident.interface';
import type { Student } from '../../student/models/student.model';
import type { User as UserType } from '../../users/models/users.model';

const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState<IncidentFormData>({
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
    followUpRequired: false,
    reportedBy: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
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
        followUpRequired: false,
        reportedBy: ''
      });
      setErrors({});
      setSelectedStudent(null);
    }
  }, [isOpen]);

  const handleStudentChange = (studentId: string, student?: Student) => {
    setFormData(prev => ({ ...prev, studentId }));
    setSelectedStudent(student || null);
    
    // Limpiar error del estudiante si existía
    if (errors.studentId) {
      setErrors(prev => ({ ...prev, studentId: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const alphanumericRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,;:()\-]+$/;

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Debe seleccionar un estudiante';
    }

    // Validar fecha del incidente no sea posterior a la fecha actual
    if (!formData.incidentDate) {
      newErrors.incidentDate = 'La fecha del incidente es requerida';
    } else {
      const incidentDate = new Date(formData.incidentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (incidentDate > today) {
        newErrors.incidentDate = 'La fecha del incidente no puede ser posterior a la fecha actual';
      }
    }

    if (!formData.incidentTime) {
      newErrors.incidentTime = 'La hora del incidente es requerida';
    }

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

    // Validar reportado por es requerido
    if (!formData.reportedBy.trim()) {
      newErrors.reportedBy = 'El usuario que reporta es requerido';
    }

    if (formData.academicYear < 2020 || formData.academicYear > new Date().getFullYear()) {
      newErrors.academicYear = `El año académico debe estar entre 2020 y ${new Date().getFullYear()}`;
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Mostrar confirmación antes de crear
    const result = await showConfirmDialog(
      '¿Crear incidente?',
      `Se creará un incidente de tipo ${formData.incidentType} con severidad ${formData.severityLevel}. ¿Desea continuar?`
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      const submitData: IncidentCreateRequest = {
        studentId: formData.studentId.trim(),
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
        followUpRequired: formData.followUpRequired,
        reportedBy: formData.reportedBy.trim()
      };

      console.log('🔍 Datos a enviar al backend:', submitData);
      console.log('📝 FormData original:', formData);

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleInputChange = (field: keyof IncidentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Funciones de validación en tiempo real
  const getFieldValidationState = (field: string): 'valid' | 'invalid' | 'neutral' => {
    const alphanumericRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,;:()\-]+$/;
    
    switch(field) {
      case 'incidentDate':
        if (!formData.incidentDate) return 'neutral';
        const incidentDate = new Date(formData.incidentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return incidentDate <= today ? 'valid' : 'invalid';
      
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

  const addStudentInvolved = () => {
    setFormData(prev => ({
      ...prev,
      otherStudentsInvolved: [...prev.otherStudentsInvolved, '']
    }));
  };

  const removeStudentInvolved = (index: number) => {
    setFormData(prev => ({
      ...prev,
      otherStudentsInvolved: prev.otherStudentsInvolved.filter((_, i) => i !== index)
    }));
  };

  const updateStudentInvolved = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      otherStudentsInvolved: prev.otherStudentsInvolved.map((id, i) => i === index ? value : id)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Crear Nuevo Incidente</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              disabled={loading}
              placeholder="Seleccionar estudiante"
              className="w-full"
            />
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
                type="date"
                value={formData.incidentDate}
                onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  getFieldClassName('incidentDate')
                }`}
                disabled={loading}
              />
              {errors.incidentDate && <p className="text-red-500 text-xs mt-1">{errors.incidentDate}</p>}
            </div>

            {/* Incident Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Hora del Incidente *
              </label>
              <input
                type="time"
                value={formData.incidentTime}
                onChange={(e) => handleInputChange('incidentTime', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.incidentTime ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.incidentTime && <p className="text-red-500 text-xs mt-1">{errors.incidentTime}</p>}
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.academicYear ? 'border-red-500' : 'border-gray-300'
                }`}
                min="2020"
                max={new Date().getFullYear().toString()}
                disabled={loading}
              />
              {errors.academicYear && <p className="text-red-500 text-xs mt-1">{errors.academicYear}</p>}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="ACCIDENTE">Accidente</option>
                <option value="CONFLICTO">Conflicto</option>
                <option value="COMPORTAMIENTO">Comportamiento</option>
                <option value="EMOCIONAL">Emocional</option>
                <option value="SALUD">Salud</option>
              </select>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="LEVE">Leve</option>
                <option value="MODERADO">Moderado</option>
                <option value="GRAVE">Grave</option>
              </select>
            </div>
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
              }`}
              placeholder="Ingrese la ubicación donde ocurrió el incidente (mínimo 5 caracteres)"
              maxLength={200}
              disabled={loading}
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            {formData.location && !errors.location && (
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
              }`}
              rows={4}
              placeholder="Describa detalladamente el incidente (mínimo 5 caracteres)"
              maxLength={1000}
              disabled={loading}
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
              }`}
              rows={2}
              placeholder="Mencione los testigos del incidente (opcional, mínimo 5 caracteres)"
              maxLength={500}
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.witnesses && <p className="text-red-500 text-xs">{errors.witnesses}</p>}
              {formData.witnesses && !errors.witnesses && (
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
              {formData.otherStudentsInvolved.map((studentId, index) => {
                // Crear lista de IDs a excluir: estudiante principal + otros estudiantes ya seleccionados (excepto el actual)
                const excludeIds = [
                  formData.studentId,
                  ...formData.otherStudentsInvolved.filter((id, i) => i !== index && id.trim() !== '')
                ];
                
                return (
                  <div key={index} className="flex gap-2">
                    <StudentSelector
                      value={studentId}
                      onChange={(id) => updateStudentInvolved(index, id)}
                      disabled={loading}
                      placeholder="Seleccionar estudiante involucrado"
                      className="flex-1"
                      excludeStudentIds={excludeIds}
                    />
                    <button
                      type="button"
                      onClick={() => removeStudentInvolved(index)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex-shrink-0"
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addStudentInvolved}
                className="text-orange-600 hover:text-orange-800 text-sm flex items-center gap-1"
                disabled={loading}
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
              }`}
              rows={3}
              placeholder="Describa las acciones inmediatas tomadas (mínimo 5 caracteres)"
              maxLength={500}
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.immediateAction && <p className="text-red-500 text-xs">{errors.immediateAction}</p>}
              {formData.immediateAction && !errors.immediateAction && (
                <p className={`text-xs ${
                  getFieldValidationState('immediateAction') === 'valid' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formData.immediateAction.trim().length >= 5 ? '✓ Válido' : `${formData.immediateAction.trim().length}/5 caracteres mínimos`}
                </p>
              )}
              <p className="text-gray-500 text-xs ml-auto">{formData.immediateAction.length}/500 caracteres</p>
            </div>
          </div>

          {/* Follow Up Required */}
          <div className="flex items-center space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <input
              type="checkbox"
              id="followUpRequired"
              checked={formData.followUpRequired}
              onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
              className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
              disabled={loading}
            />
            <label htmlFor="followUpRequired" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
              📋 Requiere Seguimiento
            </label>
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
              disabled={loading}
              placeholder="Seleccionar usuario que reporta"
              allowedRoles={['PROFESOR', 'AUXILIAR', 'DIRECTOR']}
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creando...
                </>
              ) : (
                'Crear Incidente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIncidentModal;