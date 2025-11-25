/**
 * Formulario Integrado de Matrícula
 * Combina selección de estudiante, institución, aula y validación
 */

import React, { useState, useCallback, useEffect } from 'react';
import { enrollmentService } from '../service/Enrollment.service';
import { academicPeriodService } from '../service/AcademicPeriod.service';
import StudentSelector from './StudentSelector';
import InstitutionSelector from './InstitutionSelector';
import EnrollmentValidation from './EnrollmentValidation';
import type { StudentData, InstitutionWithUsersAndClassroomsResponseDto, Classroom, EnrollmentValidationResponse } from '../models/integration.model';
import type { CreateEnrollmentDto, Enrollment, AcademicPeriod } from '../models/enrollments.model';

interface IntegratedEnrollmentFormProps {
  onEnrollmentCreated?: (enrollment: Enrollment) => void;
  onCancel?: () => void;
  initialData?: Partial<CreateEnrollmentDto>;
}

export const IntegratedEnrollmentForm: React.FC<IntegratedEnrollmentFormProps> = ({
  onEnrollmentCreated,
  onCancel,
  initialData
}) => {
  // Estados para los datos seleccionados
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionWithUsersAndClassroomsResponseDto | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [validationData, setValidationData] = useState<EnrollmentValidationResponse | null>(null);
  const [isValidationComplete, setIsValidationComplete] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState<Partial<CreateEnrollmentDto>>({
    academicYear: new Date().getFullYear().toString(),
    enrollmentStatus: 'PENDING', // Por defecto PENDIENTE
    enrollmentType: 'NUEVA',
    educationalLevel: 'INITIAL', // Corregido a INITIAL
    modality: 'PRESENCIAL',
    shift: 'MAÑANA',
    section: 'UNICA', // Sección única para inicial - se diferencia por aulas
    // Documentos por defecto
    birthCertificate: false,
    studentDni: false,
    guardianDni: false,
    vaccinationCard: false,
    disabilityCertificate: false,
    utilityBill: false,
    psychologicalReport: false,
    studentPhoto: false,
    healthRecord: false,
    signedEnrollmentForm: false,
    dniVerification: false,
    ...initialData
  });

  // Estados de UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Estado para períodos académicos
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);

  // Cargar períodos académicos al montar el componente
  useEffect(() => {
    loadAcademicPeriods();
  }, []);

  const loadAcademicPeriods = async () => {
    setIsLoadingPeriods(true);
    try {
      const periods = await academicPeriodService.getAllAcademicPeriods();
      setAcademicPeriods(periods);
    } catch (error) {
      console.error('Error loading academic periods:', error);
    } finally {
      setIsLoadingPeriods(false);
    }
  };

  // Handlers para selecciones
  const handleStudentSelected = useCallback((student: StudentData) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      studentId: student.studentId,
      studentAge: calculateAge(student.dateOfBirth)
    }));
  }, []);

  const handleInstitutionSelected = useCallback((institution: InstitutionWithUsersAndClassroomsResponseDto) => {
    setSelectedInstitution(institution);
    setFormData(prev => ({
      ...prev,
      institutionId: institution.institutionId
    }));
  }, []);

  const handleClassroomSelected = useCallback((classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setFormData(prev => ({
      ...prev,
      classroomId: classroom.classroomId,
      ageGroup: classroom.classroomAge
    }));
  }, []);

  const handleValidationComplete = useCallback((isValid: boolean, validation?: EnrollmentValidationResponse) => {
    setIsValidationComplete(isValid);
    setValidationData(validation || null);
  }, []);

  // Calcular edad del estudiante
  const calculateAge = (dateOfBirth: string): number => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Calcular progreso de documentos
  const calculateDocumentProgress = () => {
    const documents = [
      formData.birthCertificate,
      formData.studentDni,
      formData.guardianDni,
      formData.vaccinationCard,
      formData.disabilityCertificate,
      formData.utilityBill,
      formData.psychologicalReport,
      formData.studentPhoto,
      formData.healthRecord,
      formData.signedEnrollmentForm,
      formData.dniVerification
    ];
    
    const completed = documents.filter(Boolean).length;
    const total = documents.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  // Manejar cambios en el formulario
  const handleFormChange = (field: keyof CreateEnrollmentDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validar formulario
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!selectedStudent) errors.push('Debe seleccionar un estudiante');
    if (!selectedInstitution) errors.push('Debe seleccionar una institución');
    if (!selectedClassroom) errors.push('Debe seleccionar un aula');
    if (!isValidationComplete) errors.push('Debe completar la validación de datos');
    if (!formData.academicYear) errors.push('Año académico es requerido');
    if (!formData.academicPeriodId) errors.push('Período académico es requerido');

    return errors;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setSubmitError(errors.join(', '));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validación previa: verificar si ya existe una matrícula para este estudiante en el período académico
      try {
        const existingEnrollments = await enrollmentService.getEnrollmentsByStudent(formData.studentId!);
        const duplicateEnrollment = existingEnrollments.find(enrollment => 
          enrollment.academicPeriodId === formData.academicPeriodId && 
          enrollment.academicYear === formData.academicYear &&
          (enrollment.enrollmentStatus === 'ACTIVE' || enrollment.enrollmentStatus === 'PENDING')
        );

        if (duplicateEnrollment) {
          throw new Error(`Ya existe una matrícula ${duplicateEnrollment.enrollmentStatus === 'ACTIVE' ? 'activa' : 'pendiente'} para este estudiante en el período académico seleccionado (Código: ${duplicateEnrollment.enrollmentCode || duplicateEnrollment.id}). Por favor, seleccione un período diferente o contacte al administrador.`);
        }
      } catch (validationError) {
        // Si es un error de validación (matrícula duplicada), lanzarlo
        if (validationError instanceof Error && validationError.message.includes('Ya existe una matrícula')) {
          throw validationError;
        }
        // Si es un error de red al verificar, continuar con la creación (el backend manejará la validación)
        console.warn('No se pudo verificar matrículas existentes, continuando con la creación:', validationError);
      }
      const enrollmentData: CreateEnrollmentDto = {
        studentId: formData.studentId!,
        institutionId: formData.institutionId!,
        classroomId: formData.classroomId!,
        academicYear: formData.academicYear!,
        academicPeriodId: formData.academicPeriodId!,
        ageGroup: formData.ageGroup!,
        shift: formData.shift!,
        section: 'UNICA', // Sección única para inicial - se diferencia por aulas
        modality: formData.modality!,
        educationalLevel: formData.educationalLevel,
        studentAge: formData.studentAge,
        enrollmentType: formData.enrollmentType,
        enrollmentStatus: formData.enrollmentStatus,

        observations: formData.observations,
        previousInstitution: formData.previousInstitution,
        enrollmentCode: formData.enrollmentCode,
        // Documentos
        birthCertificate: formData.birthCertificate || false,
        studentDni: formData.studentDni || false,
        guardianDni: formData.guardianDni || false,
        vaccinationCard: formData.vaccinationCard || false,
        disabilityCertificate: formData.disabilityCertificate || false,
        utilityBill: formData.utilityBill || false,
        psychologicalReport: formData.psychologicalReport || false,
        studentPhoto: formData.studentPhoto || false,
        healthRecord: formData.healthRecord || false,
        signedEnrollmentForm: formData.signedEnrollmentForm || false,
        dniVerification: formData.dniVerification || false
      };

      const createdEnrollment = await enrollmentService.createEnrollment(enrollmentData);
      
      if (onEnrollmentCreated) {
        onEnrollmentCreated(createdEnrollment);
      }
    } catch (error) {
      console.error('Error creating enrollment:', error);
      
      let errorMessage = 'Error al crear la matrícula';
      
      if (error instanceof Error) {
        // Manejar errores específicos de manera más amigable
        if (error.message.includes('Ya existe una matrícula para este estudiante')) {
          errorMessage = `⚠️ ${error.message}\n\n💡 Sugerencias:\n• Verifique si ya existe una matrícula activa\n• Seleccione un período académico diferente\n• Contacte al administrador si necesita actualizar la matrícula existente`;
        } else if (error.message.includes('duplicate key value violates unique constraint')) {
          errorMessage = '⚠️ Ya existe un registro con estos datos. Por favor, verifique la información ingresada y asegúrese de que no haya duplicados.';
        } else if (error.message.includes('Validación fallida')) {
          errorMessage = `❌ ${error.message}\n\nPor favor, revise los campos marcados en rojo y complete la información requerida.`;
        } else if (error.message.includes('Network')) {
          errorMessage = '🌐 Error de conexión. Verifique su conexión a internet y vuelva a intentar.';
        } else {
          errorMessage = `❌ ${error.message}`;
        }
      }
      
      setSubmitError(errorMessage);
      
      // Scroll hacia arriba para mostrar el error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navegación entre pasos
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2: return !!selectedStudent;
      case 3: return !!selectedStudent && !!selectedInstitution;
      case 4: return !!selectedStudent && !!selectedInstitution && !!selectedClassroom;
      case 5: return !!selectedStudent && !!selectedInstitution && !!selectedClassroom && 
                     !!formData.academicYear && !!formData.shift && !!formData.modality && !!formData.academicPeriodId;
      default: return true;
    }
  };

  return (
    <div className="integrated-enrollment-form">
      <div className="form-header">
        <h2>
          <i className="fas fa-user-plus"></i>
          Nueva Matrícula
        </h2>
        <div className="step-indicator">
          {[1, 2, 3, 4, 5].map(step => (
            <div 
              key={step}
              className={`step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            >
              <span className="step-number">{step}</span>
              <span className="step-label">
                {step === 1 && 'Estudiante'}
                {step === 2 && 'Institución'}
                {step === 3 && 'Aula'}
                {step === 4 && 'Datos'}
                {step === 5 && 'Documentos'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="enrollment-form">
        {/* Paso 1: Selección de Estudiante */}
        {currentStep === 1 && (
          <div className="form-step">
            <StudentSelector
              onStudentSelected={handleStudentSelected}
              selectedStudent={selectedStudent}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Paso 2: Selección de Institución */}
        {currentStep === 2 && (
          <div className="form-step">
            <InstitutionSelector
              onInstitutionSelected={handleInstitutionSelected}
              onClassroomSelected={handleClassroomSelected}
              selectedInstitution={selectedInstitution}
              selectedClassroom={selectedClassroom}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Paso 3: Validación */}
        {currentStep === 3 && (
          <div className="form-step">
            <EnrollmentValidation
              studentId={selectedStudent?.studentId}
              institutionId={selectedInstitution?.institutionId}
              classroomId={selectedClassroom?.classroomId}
              onValidationComplete={handleValidationComplete}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Paso 4: Datos Adicionales */}
        {currentStep === 4 && (
          <div className="form-step">
            <div className="additional-data-section">
              <h3>
                <i className="fas fa-clipboard-list"></i>
                Datos Adicionales de Matrícula
              </h3>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="academicYear">Año Académico *</label>
                  <input
                    type="text"
                    id="academicYear"
                    value={formData.academicYear || ''}
                    onChange={(e) => handleFormChange('academicYear', e.target.value)}
                    placeholder="2025"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="academicPeriodId">Período Académico *</label>
                  <select
                    id="academicPeriodId"
                    value={formData.academicPeriodId || ''}
                    onChange={(e) => handleFormChange('academicPeriodId', e.target.value)}
                    required
                    disabled={isSubmitting || isLoadingPeriods}
                  >
                    <option value="">
                      {isLoadingPeriods ? 'Cargando períodos...' : 'Seleccione un período académico'}
                    </option>
                    {academicPeriods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.periodName} - {period.academicYear}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="shift">Turno *</label>
                  <select
                    id="shift"
                    value={formData.shift || ''}
                    onChange={(e) => handleFormChange('shift', e.target.value)}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="MAÑANA">Mañana</option>
                    <option value="TARDE">Tarde</option>
                  </select>
                </div>

                {/* Campo de sección eliminado - se diferencia por aulas en inicial */}

                <div className="form-group">
                  <label htmlFor="modality">Modalidad *</label>
                  <select
                    id="modality"
                    value={formData.modality || ''}
                    onChange={(e) => handleFormChange('modality', e.target.value)}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="VIRTUAL">Virtual</option>
                    <option value="HIBRIDA">Híbrida</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="enrollmentType">Tipo de Matrícula</label>
                  <select
                    id="enrollmentType"
                    value={formData.enrollmentType || ''}
                    onChange={(e) => handleFormChange('enrollmentType', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="NUEVA">Nueva</option>
                    <option value="REINSCRIPCION">Reinscripción</option>
                  </select>
                </div>

                {/* Campo de código de matrícula eliminado - se genera automáticamente */}

                <div className="form-group">
                  <label>Nivel Educativo</label>
                  <div className="readonly-field">
                    <span>🎓 Inicial</span>
                    <small>(Por defecto para educación inicial)</small>
                  </div>
                  <input type="hidden" name="educationalLevel" value="INITIAL" />
                </div>

                <div className="form-group">
                  <label>Estado de Matrícula</label>
                  <div className="readonly-field">
                    <span>⏳ Pendiente</span>
                    <small>(Se puede activar posteriormente)</small>
                  </div>
                  <input type="hidden" name="enrollmentStatus" value="PENDING" />
                </div>
              </div>

              {formData.enrollmentType === 'REINSCRIPCION' && (
                <div className="form-group">
                  <label htmlFor="previousInstitution">Institución Anterior</label>
                  <input
                    type="text"
                    id="previousInstitution"
                    value={formData.previousInstitution || ''}
                    onChange={(e) => handleFormChange('previousInstitution', e.target.value)}
                    placeholder="Nombre de la institución anterior"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="observations">Observaciones</label>
                <textarea
                  id="observations"
                  value={formData.observations || ''}
                  onChange={(e) => handleFormChange('observations', e.target.value)}
                  placeholder="Observaciones adicionales sobre la matrícula..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Sección de Documentos */}
            <div className="documents-section">
              <h3>
                <i className="fas fa-file-alt"></i>
                Documentos Requeridos
              </h3>
              
              <div className="documents-progress">
                <div className="progress-header">
                  <span className="progress-text">
                    {calculateDocumentProgress().completed}/{calculateDocumentProgress().total} completados
                  </span>
                  <span className="progress-percentage">
                    {calculateDocumentProgress().percentage}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${calculateDocumentProgress().percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Documentos movidos al paso 5 */}
            </div>

            {/* Resumen de la matrícula */}
            {validationData && (
              <div className="enrollment-summary">
                <h3>
                  <i className="fas fa-clipboard-check"></i>
                  Resumen de Matrícula
                </h3>
                <div className="summary-content">
                  <div className="summary-item">
                    <strong>Estudiante:</strong> {validationData.studentName}
                  </div>
                  <div className="summary-item">
                    <strong>Institución:</strong> {validationData.institutionName}
                  </div>
                  <div className="summary-item">
                    <strong>Aula:</strong> {validationData.classroomName}
                  </div>
                  <div className="summary-item">
                    <strong>Año Académico:</strong> {formData.academicYear}
                  </div>
                  <div className="summary-item">
                    <strong>Turno:</strong> {formData.shift}
                  </div>
                  <div className="summary-item">
                    <strong>Modalidad:</strong> {formData.modality}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paso 5: Documentos */}
        {currentStep === 5 && (
          <div className="form-step">
            <div className="documents-section">
              <h3>
                <i className="fas fa-file-alt"></i>
                Documentos Requeridos
              </h3>
              
              <p className="documents-description">
                Marque los documentos que han sido entregados por el estudiante o apoderado.
              </p>

              <div className="documents-grid">
                {[
                  { key: 'birthCertificate', label: 'Certificado de Nacimiento', icon: '📄', required: true },
                  { key: 'studentDni', label: 'DNI del Estudiante', icon: '🆔', required: true },
                  { key: 'guardianDni', label: 'DNI del Apoderado', icon: '👤', required: true },
                  { key: 'vaccinationCard', label: 'Carné de Vacunación', icon: '💉', required: true },
                  { key: 'disabilityCertificate', label: 'Certificado de Discapacidad', icon: '♿', required: false },
                  { key: 'utilityBill', label: 'Recibo de Servicios', icon: '🧾', required: true },
                  { key: 'psychologicalReport', label: 'Informe Psicológico', icon: '🧠', required: false },
                  { key: 'studentPhoto', label: 'Foto del Estudiante', icon: '📸', required: true },
                  { key: 'healthRecord', label: 'Ficha de Salud', icon: '🏥', required: true },
                  { key: 'signedEnrollmentForm', label: 'Formulario de Matrícula Firmado', icon: '✍️', required: true },
                  { key: 'dniVerification', label: 'Verificación de DNI', icon: '✅', required: true }
                ].map((doc) => (
                  <div key={doc.key} className={`document-item ${formData[doc.key as keyof typeof formData] ? 'checked' : ''}`}>
                    <label className="document-label">
                      <input
                        type="checkbox"
                        checked={formData[doc.key as keyof typeof formData] as boolean || false}
                        onChange={(e) => handleFormChange(doc.key as keyof CreateEnrollmentDto, e.target.checked)}
                        disabled={isSubmitting}
                      />
                      <div className="document-info">
                        <span className="document-icon">{doc.icon}</span>
                        <div className="document-text">
                          <span className="document-name">{doc.label}</span>
                          {doc.required && <span className="required-badge">Requerido</span>}
                        </div>
                      </div>
                      <div className="checkmark">
                        <i className="fas fa-check"></i>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Progreso de documentos */}
              <div className="documents-progress">
                <div className="progress-header">
                  <span>Progreso de Documentos</span>
                  <span>{(() => {
                    const docs = [
                      formData.birthCertificate, formData.studentDni, formData.guardianDni,
                      formData.vaccinationCard, formData.disabilityCertificate, formData.utilityBill,
                      formData.psychologicalReport, formData.studentPhoto, formData.healthRecord,
                      formData.signedEnrollmentForm, formData.dniVerification
                    ];
                    const completed = docs.filter(Boolean).length;
                    const total = docs.length;
                    const percentage = Math.round((completed / total) * 100);
                    return `${completed}/${total} (${percentage}%)`;
                  })()}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${(() => {
                        const docs = [
                          formData.birthCertificate, formData.studentDni, formData.guardianDni,
                          formData.vaccinationCard, formData.disabilityCertificate, formData.utilityBill,
                          formData.psychologicalReport, formData.studentPhoto, formData.healthRecord,
                          formData.signedEnrollmentForm, formData.dniVerification
                        ];
                        const completed = docs.filter(Boolean).length;
                        const total = docs.length;
                        return Math.round((completed / total) * 100);
                      })()}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Errores de envío */}
        {submitError && (
          <div className="submit-error">
            <i className="fas fa-exclamation-triangle"></i>
            {submitError}
          </div>
        )}

        {/* Botones de navegación */}
        <div className="form-actions">
          <div className="navigation-buttons">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="prev-button"
                disabled={isSubmitting}
              >
                <i className="fas fa-chevron-left"></i>
                Anterior
              </button>
            )}

            {currentStep < 5 && (
              <button
                type="button"
                onClick={nextStep}
                className="next-button"
                disabled={!canProceedToStep(currentStep + 1) || isSubmitting}
              >
                Siguiente
                <i className="fas fa-chevron-right"></i>
              </button>
            )}
          </div>

          <div className="action-buttons">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="cancel-button"
                disabled={isSubmitting}
              >
                <i className="fas fa-times"></i>
                Cancelar
              </button>
            )}

            {currentStep === 5 && (
              <button
                type="submit"
                className="submit-button"
                disabled={!isValidationComplete || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Creando Matrícula...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Crear Matrícula
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      <style>{`
        .integrated-enrollment-form {
          width: 100%;
          margin: 0;
          padding: 0;
        }

        .form-header {
          margin-bottom: 2rem;
        }

        .form-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: #333;
          font-size: 1.8rem;
        }

        .step-indicator {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.5;
          transition: opacity 0.3s ease;
        }

        .step.active, .step.completed {
          opacity: 1;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e0e0e0;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .step.active .step-number {
          background: #2196F3;
          color: white;
        }

        .step.completed .step-number {
          background: #4CAF50;
          color: white;
        }

        .step-label {
          font-size: 0.9rem;
          font-weight: 500;
          color: #666;
        }

        .step.active .step-label {
          color: #2196F3;
        }

        .step.completed .step-label {
          color: #4CAF50;
        }

        .enrollment-form {
          background: transparent;
          border-radius: 0;
          box-shadow: none;
          overflow: visible;
        }

        .form-step {
          padding: 1rem;
          min-height: 350px;
        }

        .additional-data-section {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .additional-data-section h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          color: #333;
          font-size: 1.2rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 500;
          color: #333;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2196F3;
        }

        .form-group input:disabled,
        .form-group select:disabled,
        .form-group textarea:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .enrollment-summary {
          background: #f8fff8;
          border: 2px solid #4CAF50;
          border-radius: 8px;
          padding: 1.5rem;
          margin-top: 1rem;
        }

        .enrollment-summary h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: #2E7D32;
          font-size: 1.2rem;
        }

        .summary-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 0.75rem;
        }

        .summary-item {
          padding: 0.5rem;
          background: white;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .submit-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: #FFEBEE;
          border: 1px solid #F44336;
          border-radius: 4px;
          color: #D32F2F;
          margin: 1rem 2rem;
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          background: #f8f9fa;
          border-top: 1px solid #e0e0e0;
        }

        .navigation-buttons, .action-buttons {
          display: flex;
          gap: 1rem;
        }

        .prev-button, .next-button, .cancel-button, .submit-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .prev-button {
          background: #6c757d;
          color: white;
        }

        .prev-button:hover:not(:disabled) {
          background: #5a6268;
        }

        .next-button {
          background: #2196F3;
          color: white;
        }

        .next-button:hover:not(:disabled) {
          background: #1976D2;
        }

        .cancel-button {
          background: #f44336;
          color: white;
        }

        .cancel-button:hover:not(:disabled) {
          background: #d32f2f;
        }

        .submit-button {
          background: #4CAF50;
          color: white;
        }

        .submit-button:hover:not(:disabled) {
          background: #45a049;
        }

        .prev-button:disabled,
        .next-button:disabled,
        .cancel-button:disabled,
        .submit-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        /* Estilos para la sección de documentos */
        .documents-section {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .documents-section h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          color: #333;
          font-size: 1.2rem;
        }

        .documents-progress {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .progress-text {
          font-weight: 500;
          color: #495057;
          font-size: 0.9rem;
        }

        .progress-percentage {
          font-weight: bold;
          color: #28a745;
          font-size: 1rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #28a745, #20c997);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .documents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 0.75rem;
        }

        .document-item {
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          padding: 0.75rem;
          transition: all 0.3s ease;
        }

        .document-item:hover {
          border-color: #28a745;
          background: #f1f8e9;
        }

        .document-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          color: #495057;
        }

        .document-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #28a745;
          cursor: pointer;
        }

        .checkmark {
          display: none;
        }

        .document-text {
          flex: 1;
        }

        .required-mark {
          color: #dc3545;
          font-weight: bold;
          margin-left: 0.25rem;
        }

        .document-item:has(input:checked) {
          background: #d4edda;
          border-color: #28a745;
        }

        .document-item:has(input:checked) .document-label {
          color: #155724;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .documents-grid {
            grid-template-columns: 1fr;
          }
          
          .step-indicator {
            gap: 1rem;
          }
          
          .step-label {
            font-size: 0.8rem;
          }
          
          .form-actions {
            flex-direction: column;
            gap: 1rem;
          }
          
          .navigation-buttons, .action-buttons {
            width: 100%;
            justify-content: center;
          }
        }
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .integrated-enrollment-form {
            padding: 0;
          }

          .step-indicator {
            gap: 1rem;
          }

          .step-number {
            width: 30px;
            height: 30px;
            font-size: 0.9rem;
          }

          .step-label {
            font-size: 0.8rem;
          }

          .form-step {
            padding: 0.5rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .navigation-buttons, .action-buttons {
            justify-content: center;
          }

          .summary-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default IntegratedEnrollmentForm;