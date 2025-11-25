import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupportById, updateSupport } from '../../service/SpecialNeedsSupport.service';
import psychologyService from '../../service/Psychology.service';
import type { SpecialNeedsSupport } from '../../models/specialNeedSupport';
import { showErrorAlert, showSuccessAlert } from '../../../../shared/utils/sweetAlert';
import { Stepper } from '../../components/Stepper';

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

export function SpecialNeedsSupportEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState<Omit<SpecialNeedsSupport, 'status'> | null>(null);
  const [originalStatus, setOriginalStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [adaptation, setAdaptation] = useState('');
  const [material, setMaterial] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const steps = [
    'Información Básica',
    'Diagnóstico',
    'Adaptaciones y Materiales',
    'Información Adicional'
  ];

  // ---------------------- Cargar datos del soporte ----------------------
  useEffect(() => {
    if (id) {
      loadReferenceData();
      loadSupport(id);
    }
  }, [id]);


  // Obtiene todas las opciones necesarias para los selectores del formulario
  const loadReferenceData = async () => {
    try {
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
    }
  };

  
  // Obtiene los datos del soporte a editar y los establece en el estado del formulario
  const loadSupport = async (supportId: string) => {
    try {
      const support = await getSupportById(supportId);
      const { status, ...data } = support;
      setFormData(data);
      setOriginalStatus(status);
    } catch (error) {
      console.error('Error loading support:', error);
      showErrorAlert('Error al cargar', 'No se pudo cargar la información del soporte.');
      navigate('/psychology/supports');
    } finally {
      setLoading(false);
    }
  };

  // Validar los campos requeridos en cada paso
  // Retorna true si todos los campos requeridos están completos, false en caso contrario
  const validateStep = (step: number): boolean => {
    if (!formData) return false;
    
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

  // ---------------------- Manejo de cambios ----------------------
  // Actualiza el estado del formulario cuando cambian los valores de los campos
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev!,
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

  // ---------------------- Adaptaciones ----------------------
  // Añade una nueva adaptación al estado del formulario y limpia el campo de entrada
  const handleAddAdaptation = () => {
    if (!formData || !adaptation.trim()) return;

    if (formData.adaptationsRequired.includes(adaptation.trim())) {
      showErrorAlert('Advertencia', 'Esta adaptación ya fue agregada.');
      return;
    }

    setFormData(prev => ({
      ...prev!,
      adaptationsRequired: [...prev!.adaptationsRequired, adaptation.trim()],
    }));
    setAdaptation('');
  };

  // Eliminar una adaptación de la lista

  const handleRemoveAdaptation = (index: number) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      adaptationsRequired: prev!.adaptationsRequired.filter((_, i) => i !== index),
    }));
  };

  // ---------------------- Materiales ----------------------
  // Agregar un material de soporte a la lista
  
  const handleAddMaterial = () => {
    if (!formData || !material.trim()) return;

    if (formData.supportMaterials.includes(material.trim())) {
      showErrorAlert('Advertencia', 'Este material ya fue agregado.');
      return;
    }

    setFormData(prev => ({
      ...prev!,
      supportMaterials: [...prev!.supportMaterials, material.trim()],
    }));
    setMaterial('');
  };

  const handleRemoveMaterial = (index: number) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      supportMaterials: prev!.supportMaterials.filter((_, i) => i !== index),
    }));
  };

  // ---------------------- Guardar Cambios ----------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !id) return;
    
    // Validar todos los pasos antes de enviar
    const isStep1Valid = validateStep(1);
    const isStep2Valid = validateStep(2);
    
    // Si alguno de los pasos requeridos no es válido, mostrar error
    if (!isStep1Valid || !isStep2Valid) {
      showErrorAlert('Validación', 'Por favor complete todos los campos requeridos en todos los pasos.');
      return;
    }

    setSaving(true);

    try {
      const supportData: SpecialNeedsSupport = {
        ...formData,
        status: originalStatus,
      };

      await updateSupport(id, supportData);

      await showSuccessAlert('Actualizado', 'El soporte ha sido actualizado correctamente.');

      navigate('/psychology/supports');
    } catch (error) {
      console.error('Error updating support:', error);
      showErrorAlert('Error al actualizar', 'No se pudo actualizar el soporte.');
    } finally {
      setSaving(false);
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

  // ---------------------- Renderizado ----------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md border">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h3 className="font-semibold text-gray-900">Cargando soporte</h3>
              <p className="text-gray-600 text-sm">Obteniendo datos del servidor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center border border-red-300">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700 mb-4">No se pudo cargar la información del soporte.</p>
          <button
            onClick={() => navigate('/psychology/supports')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // ---------------------- Formulario ----------------------
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <style>{formStyles}</style>
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Editar Apoyo para Necesidades Especiales
          </h1>
          <button
            onClick={() => navigate('/psychology/supports')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Volver
          </button>
        </div>

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
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estudiante</label>
                  <select
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccione un estudiante</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Aula</label>
                  <select
                    name="classroomId"
                    value={formData.classroomId}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccione un aula</option>
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.classroomId && <p className="mt-1 text-sm text-red-600">{errors.classroomId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Institución</label>
                  <select
                    name="institutionId"
                    value={formData.institutionId}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccione una institución</option>
                    {institutions.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                  {errors.institutionId && <p className="mt-1 text-sm text-red-600">{errors.institutionId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Año Académico</label>
                  <input
                    type="number"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.academicYear && <p className="mt-1 text-sm text-red-600">{errors.academicYear}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Diagnóstico */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnóstico</label>
                  <input
                    type="text"
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.diagnosis && <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Diagnóstico</label>
                  <input
                    type="date"
                    name="diagnosisDate"
                    value={formData.diagnosisDate}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.diagnosisDate && <p className="mt-1 text-sm text-red-600">{errors.diagnosisDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnosticado por</label>
                  <select
                    name="diagnosedBy"
                    value={formData.diagnosedBy}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Seleccione un evaluador</option>
                    {evaluators.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  {errors.diagnosedBy && <p className="mt-1 text-sm text-red-600">{errors.diagnosedBy}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Soporte</label>
                  <select
                    name="supportType"
                    value={formData.supportType}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="COGNITIVO">Cognitivo</option>
                    <option value="MOTOR">Motor</option>
                    <option value="SENSORIAL">Sensorial</option>
                    <option value="EMOCIONAL">Emocional</option>
                    <option value="LENGUAJE">Lenguaje</option>
                    <option value="CONDUCTUAL">Conductual</option>
                  </select>
                  {errors.supportType && <p className="mt-1 text-sm text-red-600">{errors.supportType}</p>}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Paso 3: Adaptaciones y Materiales */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Adaptaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adaptaciones requeridas</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={adaptation}
                      onChange={e => setAdaptation(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddAdaptation())}
                      className="flex-1 border border-gray-300 rounded-l-md p-2"
                      placeholder="Agregar adaptación"
                    />
                    <button
                      type="button"
                      onClick={handleAddAdaptation}
                      className="bg-indigo-600 text-white px-4 rounded-r-md hover:bg-indigo-700"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.adaptationsRequired.map((item, index) => (
                      <span
                        key={index}
                        className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full flex items-center"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveAdaptation(index)}
                          className="ml-2 text-indigo-600 hover:text-indigo-900 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Materiales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materiales de soporte</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={material}
                      onChange={e => setMaterial(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddMaterial())}
                      className="flex-1 border border-gray-300 rounded-l-md p-2"
                      placeholder="Agregar material"
                    />
                    <button
                      type="button"
                      onClick={handleAddMaterial}
                      className="bg-green-600 text-white px-4 rounded-r-md hover:bg-green-700"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.supportMaterials.map((item, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(index)}
                          className="ml-2 text-green-600 hover:text-green-900 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paso 4: Información Adicional */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Especialista Involucrado</label>
                  <input
                    type="text"
                    name="specialistInvolved"
                    value={formData.specialistInvolved}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Última Revisión</label>
                  <input
                    type="date"
                    name="lastReviewDate"
                    value={formData.lastReviewDate}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Próxima Revisión</label>
                  <input
                    type="date"
                    name="nextReviewDate"
                    value={formData.nextReviewDate}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Notas de Progreso</label>
                <textarea
                  name="progressNotes"
                  value={formData.progressNotes}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
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
                  disabled={saving}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}