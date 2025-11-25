import React, { useState } from 'react';
import { institutionService } from '../service/Institution.service';
import { showSuccessAlert, showErrorAlert, showLoadingAlert, closeAlert, showConfirmDialog } from '../../../shared/utils/sweetAlert';
import { 
  type InstitutionUpdateRequest,
  type Classroom,
  type UserResponse
} from '../models/Institution.interface';
import { type EditInstitutionModalProps } from '../models/EditInstitutionModalProps';
import { type InstitutionFormData as FormData } from '../models/InstitutionFormData';
import ChangeDirectorModal from './ChangeDirectorModal';

const EditInstitutionModal: React.FC<EditInstitutionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  institution
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingMessage] = useState<string | null>(null);
  const [editingClassroomId, setEditingClassroomId] = useState<string | null>(null);
  const [editedClassroomIds, setEditedClassroomIds] = useState<Set<string>>(new Set());
  const [deletedClassroomIds, setDeletedClassroomIds] = useState<Set<string>>(new Set());
  const [restoredClassroomIds, setRestoredClassroomIds] = useState<Set<string>>(new Set());
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showChangeDirectorModal, setShowChangeDirectorModal] = useState(false);
  const [newDirectorId, setNewDirectorId] = useState<string | null>(null); // Guardar temporalmente el nuevo director
  const [newDirectorData, setNewDirectorData] = useState<any>(null); // Datos del nuevo director seleccionado

  // Pre-cargar datos existentes de la institución
  const [formData, setFormData] = useState<FormData>({
    institutionInformation: { ...institution.institutionInformation },
    address: { ...institution.address },
    contactMethods: institution.contactMethods.length > 0 ? [...institution.contactMethods] : [{ type: '', value: '' }],
    gradingType: institution.gradingType,
    classroomType: institution.classroomType,
    schedules: institution.schedules.length > 0 ? [...institution.schedules] : [{ type: '', entryTime: '', exitTime: '' }],
    classrooms: institution.classrooms.map((c: Classroom) => ({
      classroomId: c.classroomId,
      classroomName: c.classroomName,
      classroomAge: c.classroomAge,
      capacity: c.capacity,
      color: c.color,
      status: c.status
    })),
    director: institution.director ? {
      firstName: institution.director.firstName,
      lastName: institution.director.lastName,
      documentType: institution.director.documentType,
      documentNumber: institution.director.documentNumber,
      phone: institution.director.phone,
      email: institution.director.email,
      role: 'DIRECTOR'
    } : {
      firstName: '',
      lastName: '',
      documentType: '',
      documentNumber: '',
      phone: '',
      email: '',
      role: 'DIRECTOR'
    },
    auxiliaries: [], // Los auxiliares no se editan desde aquí, solo se visualizan
    ugel: institution.ugel,
    dre: institution.dre
  });

  const steps = [
    'Información Básica',
    'Dirección y Contacto',
    'Configuración Académica',
    'Director',
    'Configuración Final'
  ];

  // Funciones de validación en tiempo real (copiadas del CreateModal)
  const validateInstitutionName = (name: string): string | null => {
    if (!name) return 'El nombre es requerido';
    if (name.length < 5) return 'El nombre debe tener al menos 5 caracteres';
    return null;
  };

  const validateCodeInstitution = (code: string): string | null => {
    if (!code) return 'El código de institución es requerido';
    if (!/^\d{8}$/.test(code)) return 'El código debe tener exactamente 8 dígitos';
    return null;
  };

  const validateModularCode = (code: string): string | null => {
    if (!code) return 'El código modular es requerido';
    if (!/^\d{7}$/.test(code)) return 'El código modular debe tener exactamente 7 dígitos';
    return null;
  };

  const validateInstitutionType = (type: string): string | null => {
    if (!type) return 'Debe seleccionar un tipo de institución';
    return null;
  };

  const validateInstitutionLevel = (level: string): string | null => {
    if (!level) return 'Debe seleccionar un nivel de institución';
    return null;
  };

  const validateGender = (gender: string): string | null => {
    if (!gender) return 'Debe seleccionar un género';
    return null;
  };

  const validateSlogan = (slogan: string): string | null => {
    if (!slogan) return null;
    if (slogan.length < 5) return 'El lema debe tener al menos 5 caracteres';
    return null;
  };

  const validateLogoUrl = (url: string): string | null => {
    if (!url) return 'La URL del logo es requerida';
    // Validación flexible que acepta cualquier tipo de URL válida sin límite de tamaño
    try {
      new URL(url);
      return null;
    } catch {
      // Si no es una URL completa, verificar si al menos tiene un formato de URL básico
      const basicUrlPattern = /^(https?:\/\/|www\.|[a-zA-Z0-9])/;
      if (!basicUrlPattern.test(url)) {
        return 'URL inválida. Debe comenzar con http://, https:// o www.';
      }
      return null;
    }
  };

  const validateDepartment = (dept: string): string | null => {
    if (!dept) return 'El departamento es requerido';
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(dept)) return 'Solo se permiten letras';
    return null;
  };

  const validateProvince = (prov: string): string | null => {
    if (!prov) return 'La provincia es requerida';
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(prov)) return 'Solo se permiten letras';
    return null;
  };

  const validateDistrict = (dist: string): string | null => {
    if (!dist) return 'El distrito es requerido';
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(dist)) return 'Solo se permiten letras';
    return null;
  };

  const validatePostalCode = (code: string): string | null => {
    if (!code) return null;
    if (!/^\d+$/.test(code)) return 'Solo se permiten números';
    return null;
  };

  const validateStreet = (street: string): string | null => {
    if (!street) return 'La dirección es requerida';
    if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,#-]+$/.test(street)) return 'Caracteres inválidos en la dirección';
    return null;
  };

  const validateContactMethodType = (type: string): string | null => {
    if (!type) return 'Debe seleccionar un tipo de contacto';
    return null;
  };

  const validateContactMethodValue = (type: string, value: string): string | null => {
    if (!value) return 'El valor es requerido';
    
    switch (type) {
      case 'TELEFONO':
      case 'CELULAR':
      case 'WHATSAPP':
        const cleanValue = value.replace(/[\s-]/g, '');
        if (!/^\d{9}$/.test(cleanValue)) return 'Debe tener exactamente 9 dígitos';
        if (!cleanValue.startsWith('9')) return 'Debe comenzar con 9';
        break;
      case 'EMAIL':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
        break;
      case 'WEBSITE':
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (!urlPattern.test(value)) return 'URL inválida';
        break;
    }
    return null;
  };

  const validateAtLeastOneContact = (): boolean => {
    return formData.contactMethods.some(cm => cm.type && cm.value);
  };

  // Validaciones de horarios
  const validateScheduleTime = (type: string, entryTime: string, exitTime: string): string | null => {
    if (!entryTime || !exitTime) return 'Debe ingresar ambas horas';

    // Convertir horas a minutos para comparación más fácil
    const [entryHour, entryMinute] = entryTime.split(':').map(Number);
    const [exitHour, exitMinute] = exitTime.split(':').map(Number);
    const entryMinutes = entryHour * 60 + entryMinute;
    const exitMinutes = exitHour * 60 + exitMinute;

    // Validar que la hora de entrada sea antes que la de salida
    if (entryMinutes >= exitMinutes) {
      return 'La hora de entrada debe ser antes que la de salida';
    }

    // Validaciones específicas por turno
    if (type === 'MAÑANA') {
      // Turno mañana: 7:00 AM (07:00) hasta 1:00 PM (13:00)
      const minMorning = 7 * 60; // 7:00 AM
      const maxMorning = 13 * 60; // 1:00 PM

      if (entryMinutes < minMorning) {
        return 'El turno mañana debe iniciar desde las 07:00';
      }
      if (exitMinutes > maxMorning) {
        return 'El turno mañana debe terminar hasta las 13:00';
      }
      if (entryMinutes >= maxMorning) {
        return 'La hora de entrada debe ser antes de las 13:00';
      }
    } else if (type === 'TARDE') {
      // Turno tarde: 1:00 PM (13:00) hasta 6:00 PM (18:00)
      const minAfternoon = 13 * 60; // 1:00 PM
      const maxAfternoon = 18 * 60; // 6:00 PM

      if (entryMinutes < minAfternoon) {
        return 'El turno tarde debe iniciar desde las 13:00';
      }
      if (exitMinutes > maxAfternoon) {
        return 'El turno tarde debe terminar hasta las 18:00';
      }
      if (entryMinutes >= maxAfternoon) {
        return 'La hora de entrada debe ser antes de las 18:00';
      }
    }

    return null;
  };

  const validateSchedules = (): { valid: boolean; error: string | null } => {
    const validSchedules = formData.schedules.filter(s => s.type && s.entryTime && s.exitTime);
    
    if (validSchedules.length === 0) {
      return { valid: false, error: 'Debe agregar al menos un horario' };
    }

    // Verificar que no haya más de 2 horarios
    if (validSchedules.length > 2) {
      return { valid: false, error: 'Solo se permiten máximo 2 turnos (Mañana y Tarde)' };
    }

    // Verificar que no haya turnos duplicados
    const types = validSchedules.map(s => s.type);
    const hasDuplicates = types.some((type, index) => types.indexOf(type) !== index);
    
    if (hasDuplicates) {
      return { valid: false, error: 'No puede haber turnos duplicados. Solo un turno Mañana y/o un turno Tarde' };
    }

    // Validar cada horario individualmente
    for (const schedule of validSchedules) {
      const timeError = validateScheduleTime(schedule.type, schedule.entryTime, schedule.exitTime);
      if (timeError) {
        return { valid: false, error: `Turno ${schedule.type}: ${timeError}` };
      }
    }

    return { valid: true, error: null };
  };

  const getInputClasses = (hasError: boolean, fieldTouched: boolean = false) => {
    const baseClasses = 'w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white';
    if (!fieldTouched) return `${baseClasses} border-gray-300`;
    if (hasError) return `${baseClasses} border-red-500`;
    return `${baseClasses} border-green-500`;
  };

  const getSelectClasses = (hasError: boolean, fieldTouched: boolean = false) => {
    const baseClasses = 'w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white';
    if (!fieldTouched) return `${baseClasses} border-gray-300`;
    if (hasError) return `${baseClasses} border-red-500`;
    return `${baseClasses} border-green-500`;
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  // Validar si el paso actual tiene errores
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Información Básica
        return !validateInstitutionName(formData.institutionInformation.institutionName) &&
               !validateCodeInstitution(formData.institutionInformation.codeInstitution) &&
               !validateModularCode(formData.institutionInformation.modularCode) &&
               !validateInstitutionType(formData.institutionInformation.institutionType) &&
               !validateInstitutionLevel(formData.institutionInformation.institutionLevel) &&
               !validateGender(formData.institutionInformation.gender) &&
               !validateSlogan(formData.institutionInformation.slogan) &&
               !validateLogoUrl(formData.institutionInformation.logoUrl);
      
      case 2: // Dirección y Contacto
        const hasAddressErrors = 
          !!validateDepartment(formData.address.department) ||
          !!validateProvince(formData.address.province) ||
          !!validateDistrict(formData.address.district) ||
          !!validatePostalCode(formData.address.postalCode) ||
          !!validateStreet(formData.address.street);
        
        const hasContactErrors = formData.contactMethods.some(contact => 
          !!validateContactMethodType(contact.type) ||
          !!validateContactMethodValue(contact.type, contact.value)
        );
        
        return !hasAddressErrors && !hasContactErrors && validateAtLeastOneContact();
      
      case 3: // Configuración Académica
      case 4: // Director
      case 5: // Configuración Final
        // Estos pasos no tienen validaciones críticas por ahora
        return true;
      
      default:
        return true;
    }
  };

  // Marcar todos los campos del paso actual como tocados
  const touchAllFieldsInCurrentStep = () => {
    const newTouched: Record<string, boolean> = { ...touched };
    
    switch (currentStep) {
      case 1:
        newTouched['institutionName'] = true;
        newTouched['codeInstitution'] = true;
        newTouched['modularCode'] = true;
        newTouched['institutionType'] = true;
        newTouched['institutionLevel'] = true;
        newTouched['gender'] = true;
        newTouched['slogan'] = true;
        newTouched['logoUrl'] = true;
        break;
      
      case 2:
        newTouched['department'] = true;
        newTouched['province'] = true;
        newTouched['district'] = true;
        newTouched['postalCode'] = true;
        newTouched['street'] = true;
        formData.contactMethods.forEach((_, index) => {
          newTouched[`contactType_${index}`] = true;
          newTouched[`contactValue_${index}`] = true;
        });
        break;
    }
    
    setTouched(newTouched);
  };

  // Manejar navegación al siguiente paso
  const handleNextStep = () => {
    // Marcar todos los campos como tocados para mostrar errores
    touchAllFieldsInCurrentStep();
    
    // Validar el paso actual
    if (!validateCurrentStep()) {
      setError('Por favor, corrija los errores antes de continuar');
      return;
    }
    
    // Si todo está bien, avanzar al siguiente paso
    setError(null);
    setCurrentStep(prev => Math.min(steps.length, prev + 1));
  };

  // Manejar cambios en los campos
  const handleInputChange = (section: keyof FormData, field: string, value: string | number) => {
    if (section === 'gradingType' || section === 'classroomType' || section === 'ugel' || section === 'dre') {
      setFormData(prev => ({
        ...prev,
        [section]: value as string
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section] as object),
          [field]: value
        }
      }));
    }
  };

  // Manejar arrays dinámicos
  const handleArrayChange = (section: 'contactMethods' | 'schedules' | 'classrooms' | 'auxiliaries', index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (section: 'contactMethods' | 'schedules' | 'classrooms' | 'auxiliaries') => {
    const newItem = {
      contactMethods: { type: '', value: '' },
      schedules: { type: '', entryTime: '', exitTime: '' },
      classrooms: { classroomName: '', classroomAge: '', capacity: 0, color: '#3B82F6' },
      auxiliaries: { firstName: '', lastName: '', documentType: '', documentNumber: '', phone: '', email: '', role: 'AUXILIAR' }
    };

    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], newItem[section]]
    }));
  };

  const removeArrayItem = (section: 'contactMethods' | 'schedules' | 'classrooms' | 'auxiliaries', index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  // Prevenir envío del formulario con Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStep !== steps.length) {
      e.preventDefault();
      e.stopPropagation();
      // Si no estamos en el último paso, navegar al siguiente paso
      if (currentStep < steps.length) {
        setCurrentStep(prev => prev + 1);
      }
    } else if (e.key === 'Enter' && currentStep === steps.length) {
      e.preventDefault();
      e.stopPropagation();
      // En el último paso, ejecutar el envío
      handleFormSubmit();
    }
  };

  // Manejar envío del formulario de forma explícita
  const handleFormSubmit = async () => {
    if (currentStep !== steps.length || loading) {
      return;
    }
    
    // Validar todos los pasos críticos antes de enviar
    const step1Valid = 
      !validateInstitutionName(formData.institutionInformation.institutionName) &&
      !validateCodeInstitution(formData.institutionInformation.codeInstitution) &&
      !validateModularCode(formData.institutionInformation.modularCode) &&
      !validateInstitutionType(formData.institutionInformation.institutionType) &&
      !validateInstitutionLevel(formData.institutionInformation.institutionLevel) &&
      !validateGender(formData.institutionInformation.gender) &&
      !validateSlogan(formData.institutionInformation.slogan) &&
      !validateLogoUrl(formData.institutionInformation.logoUrl);
    
    const hasAddressErrors = 
      !!validateDepartment(formData.address.department) ||
      !!validateProvince(formData.address.province) ||
      !!validateDistrict(formData.address.district) ||
      !!validatePostalCode(formData.address.postalCode) ||
      !!validateStreet(formData.address.street);
    
    const hasContactErrors = formData.contactMethods.some(contact => 
      !!validateContactMethodType(contact.type) ||
      !!validateContactMethodValue(contact.type, contact.value)
    );
    
    const step2Valid = !hasAddressErrors && !hasContactErrors && validateAtLeastOneContact();
    
    // Validar paso 3: Configuración Académica y Horarios
    const hasBasicConfigFields = !!(formData.gradingType && formData.classroomType);
    const scheduleValidation = validateSchedules();
    const step3Valid = hasBasicConfigFields && scheduleValidation.valid;
    
    if (!step1Valid) {
      setError('Hay errores en el Paso 1: Información Básica. Por favor, revise los campos.');
      setCurrentStep(1);
      return;
    }
    
    if (!step2Valid) {
      setError('Hay errores en el Paso 2: Dirección y Contacto. Por favor, revise los campos.');
      setCurrentStep(2);
      return;
    }

    if (!step3Valid) {
      setError(`Hay errores en el Paso 3: Configuración Académica. ${scheduleValidation.error || 'Por favor, revise los campos.'}`);
      setCurrentStep(3);
      return;
    }

    // Mostrar confirmación antes de actualizar
    const result = await showConfirmDialog(
      '¿Actualizar institución?',
      `Se actualizará la institución "${formData.institutionInformation.institutionName}" con todos los cambios realizados.`
    );

    if (!result.isConfirmed) {
      return; // Si el usuario cancela, no hacer nada
    }
    
    setLoading(true);
    setError(null);

    try {
      showLoadingAlert('Actualizando institución...');
      
      // 1. Actualizar la información de la institución
      const updateData: InstitutionUpdateRequest = {
        institutionInformation: formData.institutionInformation,
        address: formData.address,
        contactMethods: formData.contactMethods,
        gradingType: formData.gradingType,
        classroomType: formData.classroomType,
        schedules: formData.schedules,
        // Si se seleccionó un nuevo director, usar ese ID, sino usar el actual
        directorId: newDirectorId || institution.director?.userId || '',
        auxiliaryIds: institution.auxiliaries?.map((aux: UserResponse) => aux.userId) || [],
        ugel: formData.ugel,
        dre: formData.dre
      };
      
      await institutionService.updateInstitution(institution.institutionId, updateData);
      console.log('✅ Institución actualizada');
      
      if (newDirectorId) {
        console.log(`✅ Director cambiado de ${institution.director?.userId} a ${newDirectorId}`);
      }
      
      // 2. Eliminar aulas marcadas para eliminación
      for (const classroomId of deletedClassroomIds) {
        try {
          await institutionService.deleteClassroom(institution.institutionId, classroomId);
          console.log(`✅ Aula eliminada: ${classroomId}`);
        } catch (classroomError) {
          console.error(`❌ Error al eliminar aula ${classroomId}:`, classroomError);
        }
      }
      
      // 3. Restaurar aulas marcadas para restauración
      for (const classroomId of restoredClassroomIds) {
        try {
          await institutionService.restoreClassroom(institution.institutionId, classroomId);
          console.log(`✅ Aula restaurada: ${classroomId}`);
        } catch (classroomError) {
          console.error(`❌ Error al restaurar aula ${classroomId}:`, classroomError);
        }
      }
      
      // 4. Actualizar SOLO las aulas que fueron editadas (no eliminadas ni restauradas)
      const classroomsToUpdate = formData.classrooms.filter(
        c => c.classroomId && 
             editedClassroomIds.has(c.classroomId) &&
             !deletedClassroomIds.has(c.classroomId) &&
             !restoredClassroomIds.has(c.classroomId)
      );
      
      console.log('Aulas a actualizar:', classroomsToUpdate.map(c => c.classroomName));
      
      for (const classroom of classroomsToUpdate) {
        try {
          await institutionService.updateClassroom(classroom.classroomId!, {
            classroomName: classroom.classroomName,
            classroomAge: classroom.classroomAge,
            capacity: classroom.capacity,
            color: classroom.color
          });
          console.log(`✅ Aula "${classroom.classroomName}" actualizada exitosamente`);
        } catch (classroomError) {
          console.error(`❌ Error al actualizar aula ${classroom.classroomName}:`, classroomError);
          // Continuar con las demás aulas aunque una falle
        }
      }
      
      // 5. Crear nuevas aulas (las que no tienen classroomId)
      const newClassrooms = formData.classrooms.filter(c => !c.classroomId);
      
      console.log('Aulas nuevas a crear:', newClassrooms.map(c => c.classroomName));
      
      for (const classroom of newClassrooms) {
        try {
          await institutionService.createClassroom({
            classroomName: classroom.classroomName,
            classroomAge: classroom.classroomAge,
            capacity: classroom.capacity,
            color: classroom.color,
            institutionId: institution.institutionId
          });
          console.log(`✅ Aula "${classroom.classroomName}" creada exitosamente`);
        } catch (classroomError) {
          console.error(`❌ Error al crear aula ${classroom.classroomName}:`, classroomError);
          // Continuar con las demás aulas aunque una falle
        }
      }
      
      // 6. Limpiar todos los conjuntos de cambios
      setEditedClassroomIds(new Set());
      setDeletedClassroomIds(new Set());
      setRestoredClassroomIds(new Set());
      
      closeAlert();
      await showSuccessAlert(
        '¡Institución actualizada!',
        `La institución "${formData.institutionInformation.institutionName}" ha sido actualizada exitosamente`
      );
      
      onSuccess();
    } catch (err) {
      closeAlert();
      await showErrorAlert(
        'Error al actualizar institución',
        err instanceof Error ? err.message : 'No se pudo actualizar la institución'
      );
      setError(err instanceof Error ? err.message : 'Error al actualizar institución');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de director
  const handleChangeDirector = (selectedDirectorId: string, directorData: any) => {
    // Solo guardar el ID y datos del nuevo director temporalmente
    setNewDirectorId(selectedDirectorId);
    setNewDirectorData(directorData);
    setSuccessMessage('Director seleccionado. Se aplicará el cambio al actualizar la institución.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Editar Institución
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 mb-6">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index + 1 < currentStep ? 'bg-green-500 text-white' :
                  index + 1 === currentStep ? 'bg-blue-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <span className="mt-1 text-xs text-gray-500">{step}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Content */}
        <div onKeyDown={handleKeyDown} className="space-y-6">
          {/* Mensaje de Error */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Mensaje de Procesamiento */}
          {processingMessage && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium">{processingMessage}</span>
            </div>
          )}

          {/* Mensaje de Éxito */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Step 1: Información Básica */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-800">Información de la Institución</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Institución *
                  </label>
                  <input
                    type="text"
                    required
                    className={getInputClasses(
                      !!validateInstitutionName(formData.institutionInformation.institutionName),
                      touched['institutionName']
                    )}
                    value={formData.institutionInformation.institutionName}
                    onChange={(e) => handleInputChange('institutionInformation', 'institutionName', e.target.value)}
                    onBlur={() => handleBlur('institutionName')}
                    placeholder="Ej: I.E. José María Arguedas"
                  />
                  {touched['institutionName'] && validateInstitutionName(formData.institutionInformation.institutionName) && (
                    <p className="text-red-500 text-xs mt-1">{validateInstitutionName(formData.institutionInformation.institutionName)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Institución *
                  </label>
                  <input
                    type="text"
                    required
                    className={getInputClasses(
                      !!validateCodeInstitution(formData.institutionInformation.codeInstitution),
                      touched['codeInstitution']
                    )}
                    value={formData.institutionInformation.codeInstitution}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                      handleInputChange('institutionInformation', 'codeInstitution', value);
                    }}
                    onBlur={() => handleBlur('codeInstitution')}
                    placeholder="Ej: 12345678"
                    maxLength={8}
                  />
                  {touched['codeInstitution'] && validateCodeInstitution(formData.institutionInformation.codeInstitution) && (
                    <p className="text-red-500 text-xs mt-1">{validateCodeInstitution(formData.institutionInformation.codeInstitution)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Modular *
                  </label>
                  <input
                    type="text"
                    required
                    className={getInputClasses(
                      !!validateModularCode(formData.institutionInformation.modularCode),
                      touched['modularCode']
                    )}
                    value={formData.institutionInformation.modularCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 7);
                      handleInputChange('institutionInformation', 'modularCode', value);
                    }}
                    onBlur={() => handleBlur('modularCode')}
                    placeholder="Ej: 0123456"
                    maxLength={7}
                  />
                  {touched['modularCode'] && validateModularCode(formData.institutionInformation.modularCode) && (
                    <p className="text-red-500 text-xs mt-1">{validateModularCode(formData.institutionInformation.modularCode)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Institución *
                  </label>
                  <select
                    required
                    className={getSelectClasses(
                      !!validateInstitutionType(formData.institutionInformation.institutionType),
                      touched['institutionType']
                    )}
                    value={formData.institutionInformation.institutionType}
                    onChange={(e) => handleInputChange('institutionInformation', 'institutionType', e.target.value)}
                    onBlur={() => handleBlur('institutionType')}
                  >
                    <option value="">Seleccionar</option>
                    <option value="PUBLICO">Público</option>
                    <option value="PRIVADO">Privado</option>
                    <option value="PARROQUIAL">Parroquial</option>
                  </select>
                  {touched['institutionType'] && validateInstitutionType(formData.institutionInformation.institutionType) && (
                    <p className="text-red-500 text-xs mt-1">{validateInstitutionType(formData.institutionInformation.institutionType)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel de Institución *
                  </label>
                  <select
                    required
                    className={getSelectClasses(
                      !!validateInstitutionLevel(formData.institutionInformation.institutionLevel),
                      touched['institutionLevel']
                    )}
                    value={formData.institutionInformation.institutionLevel}
                    onChange={(e) => handleInputChange('institutionInformation', 'institutionLevel', e.target.value)}
                    onBlur={() => handleBlur('institutionLevel')}
                  >
                    <option value="">Seleccionar</option>
                    <option value="INICIAL">Inicial</option>
                    <option value="INICIAL_PRIMARIA">Inicial - Primaria</option>
                    <option value="INICIAL_PRIMARIA_SECUNDARIA">Inicial - Primaria - Secundaria</option>
                  </select>
                  {touched['institutionLevel'] && validateInstitutionLevel(formData.institutionInformation.institutionLevel) && (
                    <p className="text-red-500 text-xs mt-1">{validateInstitutionLevel(formData.institutionInformation.institutionLevel)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Género *
                  </label>
                  <select
                    required
                    className={getSelectClasses(
                      !!validateGender(formData.institutionInformation.gender),
                      touched['gender']
                    )}
                    value={formData.institutionInformation.gender}
                    onChange={(e) => handleInputChange('institutionInformation', 'gender', e.target.value)}
                    onBlur={() => handleBlur('gender')}
                  >
                    <option value="">Seleccionar</option>
                    <option value="MIXTO">Mixto</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMENINO">Femenino</option>
                  </select>
                  {touched['gender'] && validateGender(formData.institutionInformation.gender) && (
                    <p className="text-red-500 text-xs mt-1">{validateGender(formData.institutionInformation.gender)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lema/Slogan
                  </label>
                  <input
                    type="text"
                    className={getInputClasses(
                      !!validateSlogan(formData.institutionInformation.slogan),
                      touched['slogan']
                    )}
                    value={formData.institutionInformation.slogan}
                    onChange={(e) => handleInputChange('institutionInformation', 'slogan', e.target.value)}
                    onBlur={() => handleBlur('slogan')}
                    placeholder="Ej: Educación con excelencia"
                  />
                  {touched['slogan'] && validateSlogan(formData.institutionInformation.slogan) && (
                    <p className="text-red-500 text-xs mt-1">{validateSlogan(formData.institutionInformation.slogan)}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL del Logo
                  </label>
                  <input
                    type="url"
                    className={getInputClasses(
                      !!validateLogoUrl(formData.institutionInformation.logoUrl),
                      touched['logoUrl']
                    )}
                    value={formData.institutionInformation.logoUrl}
                    onChange={(e) => handleInputChange('institutionInformation', 'logoUrl', e.target.value)}
                    onBlur={() => handleBlur('logoUrl')}
                    placeholder="https://ejemplo.com/logo.png"
                  />
                  {touched['logoUrl'] && validateLogoUrl(formData.institutionInformation.logoUrl) && (
                    <p className="text-red-500 text-xs mt-1">{validateLogoUrl(formData.institutionInformation.logoUrl)}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Dirección y Contacto */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h4 className="text-md font-semibold text-gray-800">Dirección</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento *
                  </label>
                  <input
                    type="text"
                    className={getInputClasses(
                      !!validateDepartment(formData.address.department),
                      touched['department']
                    )}
                    value={formData.address.department}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                      handleInputChange('address', 'department', value);
                    }}
                    onBlur={() => handleBlur('department')}
                    placeholder="Ej: Lima"
                  />
                  {touched['department'] && validateDepartment(formData.address.department) && (
                    <p className="text-red-500 text-xs mt-1">{validateDepartment(formData.address.department)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    className={getInputClasses(
                      !!validateProvince(formData.address.province),
                      touched['province']
                    )}
                    value={formData.address.province}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                      handleInputChange('address', 'province', value);
                    }}
                    onBlur={() => handleBlur('province')}
                    placeholder="Ej: Lima"
                  />
                  {touched['province'] && validateProvince(formData.address.province) && (
                    <p className="text-red-500 text-xs mt-1">{validateProvince(formData.address.province)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distrito *
                  </label>
                  <input
                    type="text"
                    className={getInputClasses(
                      !!validateDistrict(formData.address.district),
                      touched['district']
                    )}
                    value={formData.address.district}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                      handleInputChange('address', 'district', value);
                    }}
                    onBlur={() => handleBlur('district')}
                    placeholder="Ej: Miraflores"
                  />
                  {touched['district'] && validateDistrict(formData.address.district) && (
                    <p className="text-red-500 text-xs mt-1">{validateDistrict(formData.address.district)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    className={getInputClasses(
                      !!validatePostalCode(formData.address.postalCode),
                      touched['postalCode']
                    )}
                    value={formData.address.postalCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      handleInputChange('address', 'postalCode', value);
                    }}
                    onBlur={() => handleBlur('postalCode')}
                    placeholder="Ej: 15074"
                  />
                  {touched['postalCode'] && validatePostalCode(formData.address.postalCode) && (
                    <p className="text-red-500 text-xs mt-1">{validatePostalCode(formData.address.postalCode)}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección Completa *
                </label>
                <input
                  type="text"
                  className={getInputClasses(
                    !!validateStreet(formData.address.street),
                    touched['street']
                  )}
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                  onBlur={() => handleBlur('street')}
                  placeholder="Ej: Av. Principal 123"
                />
                {touched['street'] && validateStreet(formData.address.street) && (
                  <p className="text-red-500 text-xs mt-1">{validateStreet(formData.address.street)}</p>
                )}
              </div>

              <h4 className="text-md font-semibold text-gray-800 mt-6">Métodos de Contacto</h4>
              
              {formData.contactMethods.map((contact, index) => {
                const typeError = validateContactMethodType(contact.type);
                const valueError = validateContactMethodValue(contact.type, contact.value);
                const typeTouched = touched[`contactType_${index}`];
                const valueTouched = touched[`contactValue_${index}`];

                const getPlaceholder = (type: string) => {
                  switch (type) {
                    case 'TELEFONO':
                    case 'CELULAR':
                    case 'WHATSAPP':
                      return '999999999';
                    case 'EMAIL':
                      return 'ejemplo@correo.com';
                    case 'WEBSITE':
                      return 'https://ejemplo.com';
                    default:
                      return 'Ingrese valor';
                  }
                };

                const handleContactValueChange = (value: string) => {
                  // Si es teléfono, celular o whatsapp, solo permitir números y limitar a 9 dígitos
                  if (contact.type === 'TELEFONO' || contact.type === 'CELULAR' || contact.type === 'WHATSAPP') {
                    const cleanValue = value.replace(/\D/g, '').slice(0, 9);
                    handleArrayChange('contactMethods', index, 'value', cleanValue);
                  } else {
                    handleArrayChange('contactMethods', index, 'value', value);
                  }
                };

                return (
                  <div key={index} className="border p-4 rounded-md bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Contacto {index + 1}</span>
                      {formData.contactMethods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem('contactMethods', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                          className={getSelectClasses(!!typeError, typeTouched)}
                          value={contact.type}
                          onChange={(e) => handleArrayChange('contactMethods', index, 'type', e.target.value)}
                          onBlur={() => handleBlur(`contactType_${index}`)}
                        >
                          <option value="">Seleccionar</option>
                          <option value="TELEFONO">Teléfono</option>
                          <option value="CELULAR">Celular</option>
                          <option value="EMAIL">Email</option>
                          <option value="WHATSAPP">WhatsApp</option>
                        </select>
                        {typeTouched && typeError && (
                          <p className="text-red-500 text-xs mt-1">{typeError}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                        <input
                          type="text"
                          className={getInputClasses(!!valueError, valueTouched)}
                          value={contact.value}
                          onChange={(e) => handleContactValueChange(e.target.value)}
                          onBlur={() => handleBlur(`contactValue_${index}`)}
                          placeholder={getPlaceholder(contact.type)}
                          maxLength={contact.type === 'TELEFONO' || contact.type === 'CELULAR' || contact.type === 'WHATSAPP' ? 9 : undefined}
                        />
                        {valueTouched && valueError && (
                          <p className="text-red-500 text-xs mt-1">{valueError}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <button
                type="button"
                onClick={() => addArrayItem('contactMethods')}
                className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800"
              >
                + Agregar Método de Contacto
              </button>
            </div>
          )}

          {/* Step 3: Configuración Académica */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h4 className="text-md font-semibold text-gray-800">Configuración Académica</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Calificación *
                  </label>
                  <select
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.gradingType}
                    onChange={(e) => handleInputChange('gradingType' as any, '', e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    <option value="NUMERICO">Numérico (0-20)</option>
                    <option value="ALFABETICO">Alfabético (C, B, A)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Aula *
                  </label>
                  <select
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.classroomType}
                    onChange={(e) => handleInputChange('classroomType' as any, '', e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    <option value="POR_GRADO">Por Grado</option>
                    <option value="POR_EDAD">Por Edad</option>
                    <option value="MIXTO">Mixto</option>
                  </select>
                </div>
              </div>

              <h4 className="text-md font-semibold text-gray-800 mt-6">Horarios</h4>
              <p className="text-sm text-gray-600 mb-3">
                <strong>Turno Mañana:</strong> De 07:00 a 13:00 | <strong>Turno Tarde:</strong> De 13:00 a 18:00
                <br />
                Máximo 2 turnos diferentes (uno de mañana y/o uno de tarde)
              </p>
              
              {formData.schedules.map((schedule, index) => {
                const scheduleError = schedule.type && schedule.entryTime && schedule.exitTime 
                  ? validateScheduleTime(schedule.type, schedule.entryTime, schedule.exitTime)
                  : null;
                
                return (
                  <div key={index} className="border p-4 rounded-md bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Horario {index + 1}</span>
                      {formData.schedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem('schedules', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                          className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                            scheduleError ? 'border-red-500' : 'border-gray-300'
                          }`}
                          value={schedule.type}
                          onChange={(e) => handleArrayChange('schedules', index, 'type', e.target.value)}
                        >
                          <option value="">Seleccionar</option>
                          <option value="MAÑANA">Mañana</option>
                          <option value="TARDE">Tarde</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Entrada</label>
                        <input
                          type="time"
                          className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                            scheduleError ? 'border-red-500' : 'border-gray-300'
                          }`}
                          value={schedule.entryTime}
                          onChange={(e) => handleArrayChange('schedules', index, 'entryTime', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Salida</label>
                        <input
                          type="time"
                          className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                            scheduleError ? 'border-red-500' : 'border-gray-300'
                          }`}
                          value={schedule.exitTime}
                          onChange={(e) => handleArrayChange('schedules', index, 'exitTime', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {scheduleError && (
                      <p className="text-red-500 text-xs mt-2">
                        {scheduleError}
                      </p>
                    )}
                  </div>
                );
              })}
              
              <button
                type="button"
                onClick={() => addArrayItem('schedules')}
                disabled={formData.schedules.length >= 2}
                className={`w-full py-2 px-4 border border-dashed rounded-md text-sm ${
                  formData.schedules.length >= 2
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800'
                }`}
              >
                + Agregar Horario {formData.schedules.length >= 2 && '(Máximo 2)'}
              </button>
              
              {(() => {
                const validation = validateSchedules();
                return !validation.valid && validation.error ? (
                  <p className="text-red-500 text-sm mt-2 font-medium">
                    {validation.error}
                  </p>
                ) : null;
              })()}

              {/* Aulas Existentes */}
              <h4 className="text-md font-semibold text-gray-800 mt-6">Gestión de Aulas</h4>
              
              {/* Aulas Activas */}
              {formData.classrooms.filter(c => c.classroomId && c.status === 'ACTIVE').length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Aulas Activas ({formData.classrooms.filter(c => c.classroomId && c.status === 'ACTIVE').length})
                  </h5>
                  
                  {formData.classrooms
                    .map((classroom, index) => ({ classroom, index }))
                    .filter(({ classroom }) => classroom.classroomId && classroom.status === 'ACTIVE')
                    .map(({ classroom, index }) => (
                      <div key={classroom.classroomId || index} className="border-2 border-green-200 p-4 rounded-md bg-green-50 mb-3">
                        {editingClassroomId === classroom.classroomId ? (
                          // Modo edición
                          <div className="space-y-3">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-semibold text-gray-700">Editando Aula</span>
                              <button
                                type="button"
                                onClick={() => setEditingClassroomId(null)}
                                className="text-gray-500 hover:text-gray-700 text-xs"
                              >
                                Cancelar
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del Aula</label>
                                <input
                                  type="text"
                                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                  value={classroom.classroomName}
                                  onChange={(e) => {
                                    const updatedClassrooms = [...formData.classrooms];
                                    updatedClassrooms[index].classroomName = e.target.value;
                                    setFormData({ ...formData, classrooms: updatedClassrooms });
                                  }}
                                  placeholder="Ej: Aula A1"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Edad/Grado</label>
                                <select
                                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                  value={classroom.classroomAge}
                                  onChange={(e) => {
                                    const updatedClassrooms = [...formData.classrooms];
                                    updatedClassrooms[index].classroomAge = e.target.value;
                                    setFormData({ ...formData, classrooms: updatedClassrooms });
                                  }}
                                >
                                  <option value="">Seleccione edad</option>
                                  <option value="3 años">3 años</option>
                                  <option value="4 años">4 años</option>
                                  <option value="5 años">5 años</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Capacidad</label>
                                <input
                                  type="number"
                                  min="1"
                                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                  value={classroom.capacity}
                                  onChange={(e) => {
                                    const updatedClassrooms = [...formData.classrooms];
                                    updatedClassrooms[index].capacity = parseInt(e.target.value) || 0;
                                    setFormData({ ...formData, classrooms: updatedClassrooms });
                                  }}
                                  placeholder="30"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                                <input
                                  type="color"
                                  className="w-full h-10 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                  value={classroom.color || '#3B82F6'}
                                  onChange={(e) => {
                                    const updatedClassrooms = [...formData.classrooms];
                                    updatedClassrooms[index].color = e.target.value;
                                    setFormData({ ...formData, classrooms: updatedClassrooms });
                                  }}
                                />
                              </div>
                            </div>
                            
                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingClassroomId(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs font-medium transition duration-200"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  // Marcar el aula como editada
                                  if (classroom.classroomId) {
                                    setEditedClassroomIds(prev => new Set(prev).add(classroom.classroomId!));
                                  }
                                  // Cerrar el modo edición
                                  setEditingClassroomId(null);
                                  setSuccessMessage(`Cambios guardados localmente para el aula "${classroom.classroomName}"`);
                                  setTimeout(() => setSuccessMessage(null), 2000);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition duration-200"
                              >
                                Aplicar
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Modo vista
                          <>
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: classroom.color }}></span>
                                <span className="text-sm font-medium text-gray-700">
                                  {classroom.classroomName}
                                </span>
                                {editedClassroomIds.has(classroom.classroomId!) && (
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                    Editado
                                  </span>
                                )}
                                {deletedClassroomIds.has(classroom.classroomId!) && (
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    A Eliminar
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingClassroomId(classroom.classroomId!)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition duration-200"
                                  disabled={!!processingMessage}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`¿Estás seguro de eliminar el aula "${classroom.classroomName}"?`)) {
                                      // Marcar como eliminada localmente
                                      setDeletedClassroomIds(prev => new Set(prev).add(classroom.classroomId!));
                                      // Remover de restauradas si estaba ahí
                                      setRestoredClassroomIds(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(classroom.classroomId!);
                                        return newSet;
                                      });
                                      
                                      // Actualizar el estado local
                                      const updatedClassrooms = [...formData.classrooms];
                                      updatedClassrooms[index].status = 'INACTIVE';
                                      setFormData({ ...formData, classrooms: updatedClassrooms });
                                      
                                      setSuccessMessage(`Aula "${classroom.classroomName}" marcada para eliminación`);
                                      setTimeout(() => setSuccessMessage(null), 2000);
                                    }
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition duration-200"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <span className="text-gray-600">Edad/Grado:</span>
                                <span className="ml-2 font-medium text-gray-900">{classroom.classroomAge}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Capacidad:</span>
                                <span className="ml-2 font-medium text-gray-900">{classroom.capacity}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Estado:</span>
                                <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Activa
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Aulas Inactivas */}
              {formData.classrooms.filter(c => c.classroomId && c.status === 'INACTIVE').length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-red-700 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Aulas Inactivas ({formData.classrooms.filter(c => c.classroomId && c.status === 'INACTIVE').length})
                  </h5>
                  
                  {formData.classrooms
                    .map((classroom, index) => ({ classroom, index }))
                    .filter(({ classroom }) => classroom.classroomId && classroom.status === 'INACTIVE')
                    .map(({ classroom, index }) => (
                      <div key={classroom.classroomId || index} className="border-2 border-red-200 p-4 rounded-md bg-red-50 mb-3 opacity-75">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: classroom.color }}></span>
                            <span className="text-sm font-medium text-gray-700">
                              {classroom.classroomName}
                            </span>
                            {restoredClassroomIds.has(classroom.classroomId!) && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                                A Restaurar
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de restaurar el aula "${classroom.classroomName}"?`)) {
                                // Marcar como restaurada localmente
                                setRestoredClassroomIds(prev => new Set(prev).add(classroom.classroomId!));
                                // Remover de eliminadas si estaba ahí
                                setDeletedClassroomIds(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(classroom.classroomId!);
                                  return newSet;
                                });
                                
                                // Actualizar el estado local
                                const updatedClassrooms = [...formData.classrooms];
                                updatedClassrooms[index].status = 'ACTIVE';
                                setFormData({ ...formData, classrooms: updatedClassrooms });
                                
                                setSuccessMessage(`Aula "${classroom.classroomName}" marcada para restauración`);
                                setTimeout(() => setSuccessMessage(null), 2000);
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition duration-200"
                          >
                            Restaurar
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Edad/Grado:</span>
                            <span className="ml-2 font-medium text-gray-900">{classroom.classroomAge}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Capacidad:</span>
                            <span className="ml-2 font-medium text-gray-900">{classroom.capacity}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Estado:</span>
                            <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Inactiva
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Aulas Nuevas (sin ID) */}
              <h5 className="text-sm font-semibold text-blue-700 mb-2 flex items-center mt-4">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Agregar Nuevas Aulas
              </h5>
              
              {formData.classrooms
                .map((classroom, index) => ({ classroom, index }))
                .filter(({ classroom }) => !classroom.classroomId)
                .map(({ classroom, index }) => (
                <div key={index} className="border-2 border-blue-200 p-4 rounded-md bg-blue-50 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Nueva Aula {index + 1}</span>
                    {formData.classrooms.filter(c => !c.classroomId).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('classrooms', index)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Aula</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={classroom.classroomName}
                        onChange={(e) => handleArrayChange('classrooms', index, 'classroomName', e.target.value)}
                        placeholder="Ej: Aula A1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Edad/Grado</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={classroom.classroomAge}
                        onChange={(e) => handleArrayChange('classrooms', index, 'classroomAge', e.target.value)}
                      >
                        <option value="">Seleccione edad</option>
                        <option value="3 años">3 años</option>
                        <option value="4 años">4 años</option>
                        <option value="5 años">5 años</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={classroom.capacity}
                        onChange={(e) => handleArrayChange('classrooms', index, 'capacity', parseInt(e.target.value) || 0)}
                        placeholder="30"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="color"
                        className="w-full h-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={classroom.color || '#3B82F6'}
                        onChange={(e) => handleArrayChange('classrooms', index, 'color', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => addArrayItem('classrooms')}
                className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800"
              >
                + Agregar Aula
              </button>
            </div>
          )}

          {/* Step 4: Director */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-800 mb-4">Información del Director</h4>
              
              {/* Carta del Director Actual */}
              {institution.director ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                  {/* Header con Avatar */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                        {institution.director.firstName.charAt(0)}{institution.director.lastName.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold text-gray-900">
                          {institution.director.firstName} {institution.director.lastName}
                        </h3>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mt-1">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                          Director
                        </span>
                      </div>
                    </div>
                    
                    {/* Botón de Cambiar Director */}
                    <button
                      type="button"
                      onClick={() => setShowChangeDirectorModal(true)}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Cambiar Director
                    </button>
                  </div>

                  {/* Información del Director */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-500 uppercase">Email</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{institution.director.email}</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-500 uppercase">Teléfono</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{institution.director.phone}</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        <span className="text-xs font-medium text-gray-500 uppercase">Documento</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {institution.director.documentType}: {institution.director.documentNumber}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-500 uppercase">Estado</span>
                      </div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        institution.director.status === 'ACTIVE' || institution.director.status === 'A'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {institution.director.status === 'ACTIVE' || institution.director.status === 'A' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Información Adicional */}
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">ID de Usuario:</span>
                        <span className="ml-2 font-mono text-gray-900 text-xs">{institution.director.userId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fecha de Registro:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(institution.director.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mensaje si no hay director asignado */
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-yellow-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay director asignado</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Esta institución no tiene un director asignado actualmente.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowChangeDirectorModal(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Asignar Director
                  </button>
                </div>
              )}

              {/* Nuevo Director Seleccionado (pendiente de aplicar) */}
              {newDirectorData && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-6 shadow-lg mt-4 relative">
                  {/* Badge de "Nuevo" */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white animate-pulse">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      NUEVO DIRECTOR SELECCIONADO
                    </span>
                  </div>

                  {/* Header con Avatar */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                        {newDirectorData.firstName.charAt(0)}{newDirectorData.lastName.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold text-gray-900">
                          {newDirectorData.firstName} {newDirectorData.lastName}
                        </h3>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 mt-1">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                          Director (Pendiente)
                        </span>
                      </div>
                    </div>
                    
                    {/* Botón de Cancelar Cambio */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewDirectorId(null);
                        setNewDirectorData(null);
                        setSuccessMessage('Cambio de director cancelado');
                        setTimeout(() => setSuccessMessage(null), 2000);
                      }}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancelar Cambio
                    </button>
                  </div>

                  {/* Información del Nuevo Director */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-500 uppercase">Email</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{newDirectorData.email}</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-500 uppercase">Teléfono</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{newDirectorData.phone}</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        <span className="text-xs font-medium text-gray-500 uppercase">Documento</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {newDirectorData.documentType}: {newDirectorData.documentNumber}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-500 uppercase">Estado</span>
                      </div>
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Activo
                      </span>
                    </div>
                  </div>

                  {/* Mensaje de advertencia */}
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-amber-800">
                        <strong>Cambio pendiente:</strong> Este director reemplazará al actual cuando completes todos los pasos y hagas clic en "Actualizar Institución".
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nota Informativa */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Información sobre el cambio de director</h4>
                    <p className="text-sm text-blue-800">
                      Al cambiar el director, el usuario actual dejará de estar vinculado a esta institución. 
                      Solo podrás seleccionar directores que no tengan una institución asignada actualmente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Configuración Final */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-800">Configuración Final</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UGEL *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.ugel}
                    onChange={(e) => handleInputChange('ugel' as any, '', e.target.value)}
                    placeholder="Ej: UGEL 01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DRE *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.dre}
                    onChange={(e) => handleInputChange('dre' as any, '', e.target.value)}
                    placeholder="Ej: DRE Lima Metropolitana"
                  />
                </div>
              </div>

              {/* Resumen */}
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h5 className="font-semibold text-gray-800 mb-2">Resumen de la Institución</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Nombre:</strong> {formData.institutionInformation.institutionName}</p>
                  <p><strong>Código Institución:</strong> {formData.institutionInformation.codeInstitution}</p>
                  <p><strong>Código Modular:</strong> {formData.institutionInformation.modularCode}</p>
                  <p><strong>Tipo:</strong> {formData.institutionInformation.institutionType}</p>
                  <p><strong>Nivel:</strong> {formData.institutionInformation.institutionLevel}</p>
                  
                  {/* Mostrar cambio de director si existe */}
                  {newDirectorData ? (
                    <div className="bg-green-100 border border-green-300 rounded p-2 mt-2">
                      <p className="font-semibold text-green-800">
                        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Cambio de Director Pendiente
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        <span className="line-through">{institution.director.firstName} {institution.director.lastName}</span>
                        <span className="mx-2">→</span>
                        <span className="font-semibold">{newDirectorData.firstName} {newDirectorData.lastName}</span>
                      </p>
                    </div>
                  ) : (
                    <p><strong>Director:</strong> {institution.director?.firstName} {institution.director?.lastName}</p>
                  )}
                  
                  <p><strong>Auxiliares:</strong> {institution.auxiliaries?.length || 0} (solo lectura)</p>
                  <p><strong>Ubicación:</strong> {formData.address.district}, {formData.address.province}, {formData.address.department}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setCurrentStep(prev => Math.max(1, prev - 1));
              }}
              disabled={currentStep === 1}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Anterior
            </button>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              
              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={loading}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {loading ? 'Actualizando...' : 'Actualizar Institución'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cambiar Director */}
      <ChangeDirectorModal
        isOpen={showChangeDirectorModal}
        onClose={() => setShowChangeDirectorModal(false)}
        onSelectDirector={handleChangeDirector}
        currentDirectorId={institution.director?.userId || ''}
        institutionName={institution.institutionInformation.institutionName}
      />
    </div>
  );
};

export default EditInstitutionModal;
