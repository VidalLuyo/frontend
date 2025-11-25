import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showSuccessAlert, showErrorAlert } from '../../../../shared/utils/sweetAlert';
import { createSupport } from '../../service/SpecialNeedsSupport.service';
import psychologyService from '../../service/Psychology.service';
import type { SpecialNeedsSupport } from '../../models/specialNeedSupport';
import { Stepper } from '../../components/Stepper';
// FormStyles.css classes are now integrated directly into the component

// ---------- CSS Styles ----------
const formStyles = `
  /* Blue color classes */
  .bg-blue-100 { background-color: #dbeafe; }
  .text-blue-800 { color: #1e40af; }
  .text-blue-600 { color: #2563eb; }
  .text-blue-900 { color: #1e3a8a; }
  .hover\\:text-blue-900:hover { color: #1e3a8a; }
  
  /* Green color classes */
  .bg-green-100 { background-color: #dcfce7; }
  .text-green-800 { color: #166534; }
  .text-green-600 { color: #16a34a; }
  .text-green-900 { color: #14532d; }
  .hover\\:text-green-900:hover { color: #14532d; }
`;

// ---------- Inicialización del formulario ----------
// Estado inicial del formulario con valores por defecto
const initialFormState: Omit<SpecialNeedsSupport, 'status'> = {
  id: '',
  studentId: '',
  classroomId: '',
  institutionId: '',
  academicYear: new Date().getFullYear(),
  diagnosis: '',
  diagnosisDate: new Date().toISOString().split('T')[0],
  diagnosedBy: '',
  supportType: 'MOTOR',
  description: '',
  adaptationsRequired: [],
  supportMaterials: [],
  specialistInvolved: '',
  progressNotes: '',
  lastReviewDate: new Date().toISOString().split('T')[0],
  nextReviewDate: new Date().toISOString().split('T')[0],
};

// ---------- Componentes reutilizables ----------
// Interfaz para definir las props de los campos de formulario reutilizables
interface FieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  rows?: number;
  options?: { label: string; value: string }[];
  disabled?: boolean;
}

// Componente reutilizable para campos de entrada de texto
const InputField = ({ label, name, value, onChange, type = 'text', required, disabled }: FieldProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
    />
  </div>
);

// Componente reutilizable para campos de área de texto
const TextAreaField = ({ label, name, value, onChange, rows = 3 }: FieldProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
    />
  </div>
);

// Componente reutilizable para campos de selección
const SelectField = ({ label, name, value, onChange, options = [], required, disabled }: FieldProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
    >
      <option value="">Seleccione una opción</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// Interfaz para definir las props del componente de lista de etiquetas
interface TagListFieldProps {
  label: string;
  items: string[];
  value: string;
  setValue: (val: string) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  colorClass?: string;
}

// Componente reutilizable para listas de etiquetas con funcionalidad de agregar y eliminar
const TagListField = ({ label, items, value, setValue, addItem, removeItem, colorClass = 'blue' }: TagListFieldProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="flex mt-1">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
        className="flex-1 border border-gray-300 rounded-l-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder={`Agregar ${label.toLowerCase()}`}
      />
      <button type="button" onClick={addItem} className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700">
        Agregar
      </button>
    </div>
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span key={index} className={`bg-${colorClass}-100 text-${colorClass}-800 px-3 py-1 rounded-full text-sm flex items-center`}>
          {item}
          <button
            type="button"
            onClick={() => removeItem(index)}
            className={`ml-2 text-${colorClass}-600 hover:text-${colorClass}-900 font-bold`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  </div>
);

// ---------- Componente Principal ----------
export function SpecialNeedsSupportCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [adaptation, setAdaptation] = useState('');
  const [material, setMaterial] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  // Estados para manejar errores de validación
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estados para las opciones de los selectores
  // Almacenan las opciones disponibles para los campos de selección
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [classrooms, setClassrooms] = useState<Array<{ id: string; name: string }>>([]);
  const [institutions, setInstitutions] = useState<Array<{ id: string; name: string }>>([]);
  const [evaluators, setEvaluators] = useState<Array<{ id: string; name: string }>>([]);

  // Definición de pasos
  // Configuración de los pasos del formulario multinivel
  const steps = [
    'Información Básica',
    'Diagnóstico',
    'Adaptaciones y Materiales',
    'Información Adicional'
  ];

  // Cargar datos de referencia al montar el componente
  // Efecto que se ejecuta una vez al montar el componente para cargar datos iniciales
  useEffect(() => {
    loadReferenceData();
  }, []);

  // Cargar datos de referencia desde el servicio
  // Obtiene todas las opciones necesarias para los selectores del formulario
  const loadReferenceData = async () => {
    try {
      setLoadingData(true);
      const [studentsData, classroomsData, institutionsData, evaluatorsData] = await Promise.all([
        psychologyService.getAllStudents(),
        psychologyService.getAllClassrooms(),
        psychologyService.getAllInstitutions(),
        psychologyService.getAllEvaluators(),
      ]);

      setStudents(studentsData);
      setClassrooms(classroomsData);
      setInstitutions(institutionsData);
      setEvaluators(evaluatorsData);
    } catch (error) {
      console.error('Error loading reference data:', error);
      showErrorAlert('Error', 'No se pudieron cargar los datos de referencia');
    } finally {
      setLoadingData(false);
    }
  };

  // Validar los campos requeridos en cada paso
  // Retorna true si todos los campos requeridos están completos, false en caso contrario
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validación para el paso 1: Información Básica
    if (step === 1) {
      // Validar que se haya seleccionado un estudiante
      if (!formData.studentId) {
        newErrors.studentId = 'El estudiante es obligatorio';
      }
      
      // Validar que se haya seleccionado un aula
      if (!formData.classroomId) {
        newErrors.classroomId = 'El aula es obligatoria';
      }
      
      // Validar que se haya seleccionado una institución
      if (!formData.institutionId) {
        newErrors.institutionId = 'La institución es obligatoria';
      }
      
      // Validar que el año académico sea un número válido
      if (!formData.academicYear || formData.academicYear <= 0) {
        newErrors.academicYear = 'El año académico es obligatorio y debe ser un número positivo';
      }
    }
    
    // Validación para el paso 2: Diagnóstico
    if (step === 2) {
      // Validar que se haya ingresado un diagnóstico
      if (!formData.diagnosis.trim()) {
        newErrors.diagnosis = 'El diagnóstico es obligatorio';
      }
      
      // Validar que se haya ingresado una fecha de diagnóstico
      if (!formData.diagnosisDate) {
        newErrors.diagnosisDate = 'La fecha de diagnóstico es obligatoria';
      }
      
      // Validar que se haya seleccionado quién realizó el diagnóstico
      if (!formData.diagnosedBy) {
        newErrors.diagnosedBy = 'El evaluador es obligatorio';
      }
      
      // Validar que se haya seleccionado un tipo de soporte
      if (!formData.supportType) {
        newErrors.supportType = 'El tipo de soporte es obligatorio';
      }
    }
    
    // Para los pasos 3 y 4 no hay validaciones requeridas ya que son opcionales
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Mostrar mensaje de error si la validación falla
  const showValidationError = () => {
    showErrorAlert('Validación', 'Por favor complete todos los campos requeridos antes de continuar.');
  };

  // Manejar cambios en los campos del formulario
  // Actualiza el estado del formulario cuando cambian los valores de los campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'academicYear' ? parseInt(value) || 0 : value,
    }));
    
    // Limpiar el error del campo cuando el usuario lo modifica
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Añade una nueva adaptación al estado del formulario y limpia el campo de entrada
  const handleAddAdaptation = () => {
    if (adaptation.trim()) {
      setFormData((prev) => ({ ...prev, adaptationsRequired: [...prev.adaptationsRequired, adaptation.trim()] }));
      setAdaptation('');
    }
  };

  // Eliminar una adaptación de la lista
  const handleRemoveAdaptation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      adaptationsRequired: prev.adaptationsRequired.filter((_, i) => i !== index),
    }));
  };

  // Añade un nuevo material al estado del formulario y limpia el campo de entrada
  const handleAddMaterial = () => {
    if (material.trim()) {
      setFormData((prev) => ({ ...prev, supportMaterials: [...prev.supportMaterials, material.trim()] }));
      setMaterial('');
    }
  };

  // Eliminar un material de soporte de la lista
  const handleRemoveMaterial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      supportMaterials: prev.supportMaterials.filter((_, i) => i !== index),
    }));
  };

  // Manejar el envío del formulario
  // Crea un nuevo registro de soporte y redirige al listado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos los pasos antes de enviar
    const isStep1Valid = validateStep(1);
    const isStep2Valid = validateStep(2);
    
    // Si alguno de los pasos requeridos no es válido, mostrar error
    if (!isStep1Valid || !isStep2Valid) {
      showErrorAlert('Validación', 'Por favor complete todos los campos requeridos en todos los pasos.');
      return;
    }
    
    setLoading(true);

    try {
      await createSupport({ ...formData, status: 'ACTIVE' });
      showSuccessAlert('Éxito', 'Soporte creado correctamente');
      navigate('/psychology/supports');
    } catch (error) {
      console.error('Error creating support:', error);
      showErrorAlert('Error', 'No se pudo crear el soporte');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    // Validar el paso actual antes de avanzar
    const isValid = validateStep(currentStep);
    
    if (!isValid) {
      showValidationError();
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Función para ir directamente a un paso específico
  const goToStep = (step: number) => {
    // Validar el paso actual antes de permitir navegar a otro paso
    const isValid = validateStep(currentStep);
    
    if (!isValid) {
      showValidationError();
      return;
    }
    
    setCurrentStep(step);
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md border">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h3 className="font-semibold text-gray-900">Cargando datos</h3>
              <p className="text-gray-600 text-sm">Preparando formulario...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <style>{formStyles}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Crear Apoyo para Necesidades Especiales</h1>
              <p className="mt-1 text-sm text-gray-500">Agregar un nuevo apoyo para un estudiante</p>
            </div>
            <button
              onClick={() => navigate('/psychology/supports')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Volver
            </button>
          </div>
          <div className="p-6">
            <Stepper steps={steps} currentStep={currentStep} />
            
            {/* Botones para saltar a cualquier paso */}
            <div className="flex flex-wrap gap-2 mb-6">
              {steps.map((step, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToStep(index + 1)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    currentStep === index + 1
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Paso 1: Información Básica */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <SelectField
                        label="Estudiante"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleChange}
                        options={students.map(s => ({ label: s.name, value: s.id }))}
                        required
                      />
                      {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>}
                    </div>
                    <div>
                      <SelectField
                        label="Aula"
                        name="classroomId"
                        value={formData.classroomId}
                        onChange={handleChange}
                        options={classrooms.map(c => ({ label: c.name, value: c.id }))}
                        required
                      />
                      {errors.classroomId && <p className="mt-1 text-sm text-red-600">{errors.classroomId}</p>}
                    </div>
                    <div>
                      <SelectField
                        label="Institución"
                        name="institutionId"
                        value={formData.institutionId}
                        onChange={handleChange}
                        options={institutions.map(i => ({ label: i.name, value: i.id }))}
                        required
                      />
                      {errors.institutionId && <p className="mt-1 text-sm text-red-600">{errors.institutionId}</p>}
                    </div>
                    <div>
                      <InputField
                        label="Año Académico"
                        name="academicYear"
                        type="number"
                        value={formData.academicYear}
                        onChange={handleChange}
                        required
                      />
                      {errors.academicYear && <p className="mt-1 text-sm text-red-600">{errors.academicYear}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 2: Diagnóstico */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <InputField
                        label="Diagnóstico"
                        name="diagnosis"
                        value={formData.diagnosis}
                        onChange={handleChange}
                        required
                      />
                      {errors.diagnosis && <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>}
                    </div>
                    <div>
                      <InputField
                        label="Fecha de Diagnóstico"
                        name="diagnosisDate"
                        type="date"
                        value={formData.diagnosisDate}
                        onChange={handleChange}
                        required
                      />
                      {errors.diagnosisDate && <p className="mt-1 text-sm text-red-600">{errors.diagnosisDate}</p>}
                    </div>
                    <div>
                      <SelectField
                        label="Diagnosticado Por"
                        name="diagnosedBy"
                        value={formData.diagnosedBy}
                        onChange={handleChange}
                        options={evaluators.map(e => ({ label: e.name, value: e.id }))}
                        required
                      />
                      {errors.diagnosedBy && <p className="mt-1 text-sm text-red-600">{errors.diagnosedBy}</p>}
                    </div>
                    <div>
                      <SelectField
                        label="Tipo de Soporte"
                        name="supportType"
                        value={formData.supportType}
                        onChange={handleChange}
                        options={[
                          { label: 'Cognitivo', value: 'COGNITIVE' },
                          { label: 'Motor', value: 'MOTOR' },
                          { label: 'Sensorial', value: 'SENSORIAL' },
                          { label: 'Emocional', value: 'EMOCIONAL' },
                          { label: 'Lenguaje', value: 'LENGUAJE' },
                          { label: 'Conductual', value: 'CONDUCTUAL' },
                        ]}
                        required
                      />
                      {errors.supportType && <p className="mt-1 text-sm text-red-600">{errors.supportType}</p>}
                    </div>
                  </div>

                  <TextAreaField
                    label="Descripción"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* Paso 3: Adaptaciones y Materiales */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <TagListField
                    label="Adaptaciones Requeridas"
                    items={formData.adaptationsRequired}
                    value={adaptation}
                    setValue={setAdaptation}
                    addItem={handleAddAdaptation}
                    removeItem={handleRemoveAdaptation}
                    colorClass="blue"
                  />

                  <TagListField
                    label="Materiales de Soporte"
                    items={formData.supportMaterials}
                    value={material}
                    setValue={setMaterial}
                    addItem={handleAddMaterial}
                    removeItem={handleRemoveMaterial}
                    colorClass="green"
                  />
                </div>
              )}

              {/* Paso 4: Información Adicional */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Especialista Involucrado"
                      name="specialistInvolved"
                      value={formData.specialistInvolved}
                      onChange={handleChange}
                    />
                    <InputField
                      label="Fecha de Última Revisión"
                      name="lastReviewDate"
                      type="date"
                      value={formData.lastReviewDate}
                      onChange={handleChange}
                    />
                    <InputField
                      label="Fecha de Próxima Revisión"
                      name="nextReviewDate"
                      type="date"
                      value={formData.nextReviewDate}
                      onChange={handleChange}
                    />
                  </div>

                  <TextAreaField
                    label="Notas de Progreso"
                    name="progressNotes"
                    value={formData.progressNotes}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* Botones de navegación */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
                    currentStep === 1 
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  Anterior
                </button>
                
                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Siguiente
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => navigate('/psychology/supports')}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Creando...' : 'Crear Soporte'}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}