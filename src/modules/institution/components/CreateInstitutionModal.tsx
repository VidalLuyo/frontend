import React, { useState } from 'react';
import { institutionService } from '../service/Institution.service';
import { showSuccessAlert, showErrorAlert, showLoadingAlert, closeAlert, showConfirmDialog } from '../../../shared/utils/sweetAlert';
import { type InstitutionCreateWithUsersRequest } from '../models/Institution.interface';
import { type CreateInstitutionModalProps } from '../models/CreateInstitutionModalProps';
import { type InstitutionFormData as FormData } from '../models/InstitutionFormData';

const CreateInstitutionModal: React.FC<CreateInstitutionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<FormData>({
    institutionInformation: {
      institutionName: '',
      codeInstitution: '',
      modularCode: '',
      institutionType: '',
      institutionLevel: '',
      gender: '',
      slogan: '',
      logoUrl: ''
    },
    address: {
      street: '',
      district: '',
      province: '',
      department: '',
      postalCode: ''
    },
    contactMethods: [{ type: '', value: '' }],
    gradingType: '',
    classroomType: '',
    schedules: [{ type: '', entryTime: '', exitTime: '' }],
    classrooms: [{ classroomName: '', classroomAge: '', capacity: 0, color: '' }],
    director: {
      firstName: '',
      lastName: '',
      documentType: '',
      documentNumber: '',
      phone: '',
      email: '',
      role: 'DIRECTOR'
    },
    auxiliaries: [],
    ugel: '',
    dre: ''
  });

  const steps = [
    'Información Básica',
    'Dirección y Contacto',
    'Configuración Académica',
    'Director',
    'Configuración Final'
  ];

  // Funciones de validación en tiempo real
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
    if (!slogan) return null; // Opcional
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
    if (!code) return null; // Opcional
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

  // Función para obtener clases de error
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

  // Marcar campo como tocado
  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
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
      classrooms: { classroomName: '', classroomAge: '', capacity: 0, color: '' },
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

  // Validar paso actual
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !validateInstitutionName(formData.institutionInformation.institutionName) &&
               !validateCodeInstitution(formData.institutionInformation.codeInstitution) &&
               !validateModularCode(formData.institutionInformation.modularCode) &&
               !validateInstitutionType(formData.institutionInformation.institutionType) &&
               !validateInstitutionLevel(formData.institutionInformation.institutionLevel) &&
               !validateGender(formData.institutionInformation.gender) &&
               !validateLogoUrl(formData.institutionInformation.logoUrl) &&
               (formData.institutionInformation.slogan === '' || !validateSlogan(formData.institutionInformation.slogan));
      case 2:
        return !validateDepartment(formData.address.department) &&
               !validateProvince(formData.address.province) &&
               !validateDistrict(formData.address.district) &&
               !validateStreet(formData.address.street) &&
               (formData.address.postalCode === '' || !validatePostalCode(formData.address.postalCode)) &&
               validateAtLeastOneContact() &&
               formData.contactMethods.every(cm => 
                 !cm.type || (!validateContactMethodType(cm.type) && !validateContactMethodValue(cm.type, cm.value))
               );
      case 3:
        // Validar campos básicos
        const hasBasicFields = !!(formData.gradingType && formData.classroomType);
        if (!hasBasicFields) return false;
        
        // Validar horarios
        const scheduleValidation = validateSchedules();
        return scheduleValidation.valid;
      case 4:
        return !!(formData.director.firstName &&
                 formData.director.lastName &&
                 formData.director.documentType &&
                 formData.director.documentNumber &&
                 formData.director.phone &&
                 formData.director.email);
      case 5:
        return !!(formData.ugel && formData.dre);
      default:
        return true;
    }
  };

  // Navegar entre pasos
  const nextStep = () => {
    // Marcar todos los campos como tocados para mostrar errores
    touchAllFieldsInCurrentStep();
    
    // Validar el paso actual
    if (!validateStep(currentStep)) {
      setError('Por favor, corrija los errores antes de continuar');
      return;
    }
    
    // Si todo está bien, avanzar al siguiente paso
    setError(null);
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos los pasos antes de enviar
    if (!validateStep(1)) {
      setError('Hay errores en el Paso 1: Información Básica. Por favor, revise los campos.');
      setCurrentStep(1);
      return;
    }
    
    if (!validateStep(2)) {
      setError('Hay errores en el Paso 2: Dirección y Contacto. Por favor, revise los campos.');
      setCurrentStep(2);
      return;
    }
    
    if (!validateStep(3)) {
      setError('Hay errores en el Paso 3: Configuración Académica. Por favor, complete los campos.');
      setCurrentStep(3);
      return;
    }
    
    if (!validateStep(4)) {
      setError('Hay errores en el Paso 4: Director. Por favor, complete todos los campos.');
      setCurrentStep(4);
      return;
    }
    
    if (!validateStep(5)) {
      setError('Hay errores en el Paso 5: Configuración Final. Por favor, complete los campos.');
      setCurrentStep(5);
      return;
    }

    // Mostrar confirmación antes de crear
    const result = await showConfirmDialog(
      '¿Crear nueva institución?',
      `Se creará la institución "${formData.institutionInformation.institutionName}" con todos los datos proporcionados.`
    );

    if (!result.isConfirmed) {
      return; // Si el usuario cancela, no hacer nada
    }
    
    setLoading(true);
    setError(null);

    try {
      showLoadingAlert('Creando institución...');
      
      // Mapear el formData al formato esperado por el backend
      const requestData: InstitutionCreateWithUsersRequest = {
        institutionInformation: formData.institutionInformation,
        address: formData.address,
        contactMethods: formData.contactMethods.filter(cm => cm.type && cm.value),
        gradingType: formData.gradingType,
        classroomType: formData.classroomType,
        schedules: formData.schedules.filter(s => s.type && s.entryTime && s.exitTime),
        classrooms: formData.classrooms.filter(c => c.classroomName && c.classroomAge && c.capacity > 0),
        ugel: formData.ugel,
        dre: formData.dre,
        director: {
          firstName: formData.director.firstName,
          lastName: formData.director.lastName,
          documentType: formData.director.documentType,
          documentNumber: formData.director.documentNumber,
          phone: formData.director.phone,
          email: formData.director.email,
          role: formData.director.role
        },
        auxiliaries: [] // Los auxiliares no se crean aquí, se gestionan desde el microservicio de usuarios
      };

      await institutionService.createInstitutionWithUsers(requestData);
      
      closeAlert();
      await showSuccessAlert(
        '¡Institución creada!', 
        `La institución "${formData.institutionInformation.institutionName}" ha sido creada exitosamente`
      );
      
      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      closeAlert();
      await showErrorAlert(
        'Error al crear institución',
        err instanceof Error ? err.message : 'No se pudo crear la institución'
      );
      setError(err instanceof Error ? err.message : 'Error al crear la institución');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      institutionInformation: {
        institutionName: '',
        codeInstitution: '',
        modularCode: '',
        institutionType: '',
        institutionLevel: '',
        gender: '',
        slogan: '',
        logoUrl: ''
      },
      address: {
        street: '',
        district: '',
        province: '',
        department: '',
        postalCode: ''
      },
      contactMethods: [{ type: '', value: '' }],
      gradingType: '',
      classroomType: '',
      schedules: [{ type: '', entryTime: '', exitTime: '' }],
      classrooms: [{ classroomName: '', classroomAge: '', capacity: 0, color: '' }],
      director: {
        firstName: '',
        lastName: '',
        documentType: '',
        documentNumber: '',
        phone: '',
        email: '',
        role: 'DIRECTOR'
      },
      auxiliaries: [],
      ugel: '',
      dre: ''
    });
  };

  if (!isOpen) {
    console.log('Modal no se muestra porque isOpen =', isOpen);
    return null;
  }

  console.log('Renderizando CreateInstitutionModal con isOpen =', isOpen);

  return (
    <div className="fixed inset-0 bg-gray-900/50 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Crear Nueva Institución
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paso 1: Información Básica */}
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
                    Código de Institución * <span className="text-xs text-gray-500">(8 dígitos)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    className={getInputClasses(
                      !!validateCodeInstitution(formData.institutionInformation.codeInstitution),
                      touched['codeInstitution']
                    )}
                    value={formData.institutionInformation.codeInstitution}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      handleInputChange('institutionInformation', 'codeInstitution', value);
                    }}
                    onBlur={() => handleBlur('codeInstitution')}
                    placeholder="12345678"
                  />
                  {touched['codeInstitution'] && validateCodeInstitution(formData.institutionInformation.codeInstitution) && (
                    <p className="text-red-500 text-xs mt-1">{validateCodeInstitution(formData.institutionInformation.codeInstitution)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Modular * <span className="text-xs text-gray-500">(7 dígitos)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={7}
                    className={getInputClasses(
                      !!validateModularCode(formData.institutionInformation.modularCode),
                      touched['modularCode']
                    )}
                    value={formData.institutionInformation.modularCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      handleInputChange('institutionInformation', 'modularCode', value);
                    }}
                    onBlur={() => handleBlur('modularCode')}
                    placeholder="1234567"
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
                    <option value="PUBLICA">Pública</option>
                    <option value="PRIVADA">Privada</option>
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
                    Lema/Slogan <span className="text-xs text-gray-500">(min. 5 caracteres)</span>
                  </label>
                  <input
                    type="text"
                    className={getInputClasses(
                      formData.institutionInformation.slogan !== '' && !!validateSlogan(formData.institutionInformation.slogan),
                      touched['slogan']
                    )}
                    value={formData.institutionInformation.slogan}
                    onChange={(e) => handleInputChange('institutionInformation', 'slogan', e.target.value)}
                    onBlur={() => handleBlur('slogan')}
                    placeholder="Ej: Educación con excelencia"
                  />
                  {touched['slogan'] && formData.institutionInformation.slogan !== '' && validateSlogan(formData.institutionInformation.slogan) && (
                    <p className="text-red-500 text-xs mt-1">{validateSlogan(formData.institutionInformation.slogan)}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL del Logo *
                </label>
                <input
                  type="url"
                  required
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
          )}

          {/* Paso 2: Dirección y Contacto */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h4 className="text-md font-semibold text-gray-800">Dirección</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento * <span className="text-xs text-gray-500">(solo letras)</span>
                  </label>
                  <input
                    type="text"
                    required
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
                    Provincia * <span className="text-xs text-gray-500">(solo letras)</span>
                  </label>
                  <input
                    type="text"
                    required
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
                    Distrito * <span className="text-xs text-gray-500">(solo letras)</span>
                  </label>
                  <input
                    type="text"
                    required
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
                    Código Postal <span className="text-xs text-gray-500">(solo números)</span>
                  </label>
                  <input
                    type="text"
                    className={getInputClasses(
                      formData.address.postalCode !== '' && !!validatePostalCode(formData.address.postalCode),
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
                  {touched['postalCode'] && formData.address.postalCode !== '' && validatePostalCode(formData.address.postalCode) && (
                    <p className="text-red-500 text-xs mt-1">{validatePostalCode(formData.address.postalCode)}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección Completa * <span className="text-xs text-gray-500">(letras y números)</span>
                </label>
                <input
                  type="text"
                  required
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

              <h4 className="text-md font-semibold text-gray-800 mt-6">
                Métodos de Contacto * <span className="text-sm text-red-500">(mínimo 1 requerido)</span>
              </h4>
              {!validateAtLeastOneContact() && touched['contactMethod_0'] && (
                <p className="text-red-500 text-sm mb-2">Debe agregar al menos un método de contacto válido</p>
              )}
              
              {formData.contactMethods.map((contact, index) => {
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                      <select
                        className={getSelectClasses(
                          !!validateContactMethodType(contact.type),
                          touched[`contactType_${index}`]
                        )}
                        value={contact.type}
                        onChange={(e) => handleArrayChange('contactMethods', index, 'type', e.target.value)}
                        onBlur={() => handleBlur(`contactType_${index}`)}
                      >
                        <option value="">Seleccionar</option>
                        <option value="TELEFONO">Teléfono</option>
                        <option value="CELULAR">Celular</option>
                        <option value="EMAIL">Email</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="WEBSITE">Sitio Web</option>
                      </select>
                      {touched[`contactType_${index}`] && validateContactMethodType(contact.type) && (
                        <p className="text-red-500 text-xs mt-1">{validateContactMethodType(contact.type)}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor * 
                        {contact.type === 'TELEFONO' && <span className="text-xs text-gray-500"> (9 dígitos, inicia con 9)</span>}
                        {contact.type === 'CELULAR' && <span className="text-xs text-gray-500"> (9 dígitos, inicia con 9)</span>}
                        {contact.type === 'WHATSAPP' && <span className="text-xs text-gray-500"> (9 dígitos, inicia con 9)</span>}
                        {contact.type === 'EMAIL' && <span className="text-xs text-gray-500"> (email válido)</span>}
                        {contact.type === 'WEBSITE' && <span className="text-xs text-gray-500"> (URL válida)</span>}
                      </label>
                      <input
                        type="text"
                        className={getInputClasses(
                          !!validateContactMethodValue(contact.type, contact.value),
                          touched[`contactValue_${index}`]
                        )}
                        value={contact.value}
                        onChange={(e) => handleContactValueChange(e.target.value)}
                        onBlur={() => handleBlur(`contactValue_${index}`)}
                        placeholder={
                          contact.type === 'TELEFONO' ? '987654321' :
                          contact.type === 'CELULAR' ? '987654321' :
                          contact.type === 'WHATSAPP' ? '987654321' :
                          contact.type === 'EMAIL' ? 'correo@ejemplo.com' :
                          contact.type === 'WEBSITE' ? 'https://ejemplo.com' :
                          'Ingrese el valor'
                        }
                        maxLength={contact.type === 'TELEFONO' || contact.type === 'CELULAR' || contact.type === 'WHATSAPP' ? 9 : undefined}
                      />
                      {touched[`contactValue_${index}`] && validateContactMethodValue(contact.type, contact.value) && (
                        <p className="text-red-500 text-xs mt-1">{validateContactMethodValue(contact.type, contact.value)}</p>
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

          {/* Paso 3: Configuración Académica */}
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

              <h4 className="text-md font-semibold text-gray-800 mt-6">Aulas Iniciales</h4>
              
              {formData.classrooms.map((classroom, index) => (
                <div key={index} className="border p-4 rounded-md bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Aula {index + 1}</span>
                    {formData.classrooms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('classrooms', index)}
                        className="text-red-500 hover:text-red-700"
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

          {/* Paso 4: Director */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-800">Información del Director</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.director.firstName}
                    onChange={(e) => handleInputChange('director', 'firstName', e.target.value)}
                    placeholder="Nombres del director"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.director.lastName}
                    onChange={(e) => handleInputChange('director', 'lastName', e.target.value)}
                    placeholder="Apellidos del director"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.director.documentType}
                    onChange={(e) => handleInputChange('director', 'documentType', e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    <option value="DNI">DNI</option>
                    <option value="CARNET_EXTRANJERIA">Carnet de Extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.director.documentNumber}
                    onChange={(e) => handleInputChange('director', 'documentNumber', e.target.value)}
                    placeholder="Número de documento"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.director.phone}
                    onChange={(e) => handleInputChange('director', 'phone', e.target.value)}
                    placeholder="Número de teléfono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.director.email}
                    onChange={(e) => handleInputChange('director', 'email', e.target.value)}
                    placeholder="email@ejemplo.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paso 5: Configuración Final */}
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
                  <p><strong>Director:</strong> {formData.director.firstName} {formData.director.lastName}</p>
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
              onClick={prevStep}
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
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    validateStep(currentStep)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !validateStep(currentStep)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    loading || !validateStep(currentStep)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {loading ? 'Creando...' : 'Crear Institución'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInstitutionModal;
