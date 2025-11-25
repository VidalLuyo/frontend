import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmDialog as showConfirm,
} from "../../../../shared/utils/sweetAlert";
import {
  User,
  Brain,
  MessageSquare,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { psychologyService } from "../../service/Psychology.service";
import type {
  CreatePsychologicalEvaluationDto,
  EvaluationType,
  DevelopmentLevel,
  Status,
} from "../../models/psychology.model";
import {
  EVALUATION_TYPE_OPTIONS,
  DEVELOPMENT_LEVEL_OPTIONS,
} from "../../models/psychology.model";

interface Student {
  id: string;
  name: string;
}

interface Classroom {
  id: string;
  name: string;
}

interface Institution {
  id: string;
  name: string;
}

interface Evaluator {
  id: string;
  name: string;
}

interface FormStep {
  id: number;
  title: string;
  icon: React.ReactNode;
  fields: string[];
}

export function PsychologyCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Estados para las listas del backend
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);

  const [formData, setFormData] = useState<CreatePsychologicalEvaluationDto>({
    studentId: "",
    classroomId: "",
    institutionId: "",
    evaluationDate: (() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    })(),
    academicYear: new Date().getFullYear(),
    evaluationType: "INICIAL" as EvaluationType,
    evaluationReason: "",
    emotionalDevelopment: undefined,
    socialDevelopment: undefined,
    cognitiveDevelopment: undefined,
    motorDevelopment: undefined,
    observations: "",
    recommendations: "",
    requiresFollowUp: false,
    followUpFrequency: "",
    evaluatedBy: "",
    status: "ACTIVE" as Status,
  });

  const steps: FormStep[] = [
    {
      id: 0,
      title: "Información Básica",
      icon: <User className="w-5 h-5" />,
      fields: [
        "studentId",
        "classroomId",
        "institutionId",
        "evaluationDate",
        "academicYear",
        "evaluationType",
        "evaluationReason",
      ],
    },
    {
      id: 1,
      title: "Desarrollo",
      icon: <Brain className="w-5 h-5" />,
      fields: [
        "emotionalDevelopment",
        "socialDevelopment",
        "cognitiveDevelopment",
        "motorDevelopment",
      ],
    },
    {
      id: 2,
      title: "Observaciones",
      icon: <MessageSquare className="w-5 h-5" />,
      fields: [
        "observations",
        "recommendations",
        "requiresFollowUp",
        "followUpFrequency",
        "evaluatedBy",
      ],
    },
  ];

  // Cargar datos del backend
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setLoadingData(true);

        const [studentsData, classroomsData, institutionsData, evaluatorsData] =
          await Promise.all([
            psychologyService.getAllStudents().catch(() => []),
            psychologyService.getAllClassrooms().catch(() => []),
            psychologyService.getAllInstitutions().catch(() => []),
            psychologyService.getAllEvaluators().catch(() => []),
          ]);

        setStudents(studentsData);
        setClassrooms(classroomsData);
        setInstitutions(institutionsData);
        setEvaluators(evaluatorsData);
      } catch (error) {
        console.error("Error loading reference data:", error);
        setError("Error al cargar los datos de referencia");
      } finally {
        setLoadingData(false);
      }
    };

    loadReferenceData();
  }, []);

  // Funciones de validación
  const validateField = (
    field: keyof CreatePsychologicalEvaluationDto,
    value: string | number | boolean | undefined
  ): string | null => {
    switch (field) {
      case "studentId":
        return !value ? "Debe seleccionar un estudiante" : null;
      case "classroomId":
        return !value ? "Debe seleccionar un aula" : null;
      case "institutionId":
        return !value ? "Debe seleccionar una institución" : null;
      case "evaluationDate": {
        if (!value) return "La fecha de evaluación es requerida";
        const selectedDate = new Date(String(value));
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        if (selectedDate > today) return "La fecha no puede ser futura";
        if (selectedDate < oneYearAgo)
          return "La fecha no puede ser mayor a un año atrás";
        return null;
      }
      case "academicYear":
        // Campo readonly, no necesita validación
        return null;
      case "evaluationReason": {
        if (!value) return "El motivo de evaluación es requerido";
        const stringValue = String(value);
        const trimmedValue = stringValue.trim();
        if (trimmedValue.length === 0)
          return "No se permiten solo espacios en blanco";
        if (stringValue !== trimmedValue)
          return "No debe iniciar o terminar con espacios en blanco";
        if (trimmedValue.length < 10)
          return `Mínimo 10 caracteres requeridos (${trimmedValue.length}/10)`;
        if (stringValue.length > 500)
          return `Máximo 500 caracteres permitidos (${stringValue.length}/500)`;
        return null;
      }
      case "observations": {
        if (!value) return "Las observaciones son requeridas";
        const stringValue = String(value);
        const trimmedValue = stringValue.trim();
        if (trimmedValue.length === 0)
          return "No se permiten solo espacios en blanco";
        if (stringValue !== trimmedValue)
          return "No debe iniciar o terminar con espacios en blanco";
        if (trimmedValue.length < 20)
          return `Mínimo 20 caracteres requeridos (${trimmedValue.length}/20)`;
        if (stringValue.length > 1000)
          return `Máximo 1000 caracteres permitidos (${stringValue.length}/1000)`;
        return null;
      }
      case "recommendations": {
        if (!value) return "Las recomendaciones son requeridas";
        const stringValue = String(value);
        const trimmedValue = stringValue.trim();
        if (trimmedValue.length === 0)
          return "No se permiten solo espacios en blanco";
        if (stringValue !== trimmedValue)
          return "No debe iniciar o terminar con espacios en blanco";
        if (trimmedValue.length < 20)
          return `Mínimo 20 caracteres requeridos (${trimmedValue.length}/20)`;
        if (stringValue.length > 1000)
          return `Máximo 1000 caracteres permitidos (${stringValue.length}/1000)`;
        return null;
      }
      case "followUpFrequency":
        return formData.requiresFollowUp && !value
          ? "Debe especificar la frecuencia de seguimiento"
          : null;
      case "evaluatedBy":
        return !value ? "Debe seleccionar un evaluador" : null;
      case "emotionalDevelopment":
      case "socialDevelopment":
      case "cognitiveDevelopment":
      case "motorDevelopment":
        return !value ? "Debe seleccionar un nivel de desarrollo" : null;
      default:
        return null;
    }
  };

  const validateCurrentStep = (): boolean => {
    const step = steps[currentStep];
    const errors: Record<string, string> = {};
    let hasErrors = false;

    step.fields.forEach((field) => {
      const value = formData[field as keyof CreatePsychologicalEvaluationDto];
      const error = validateField(
        field as keyof CreatePsychologicalEvaluationDto,
        value
      );
      if (error) {
        errors[field] = error;
        hasErrors = true;
      }
    });

    setFieldErrors(errors);
    return !hasErrors;
  };

  const handleInputChange = (
    field: keyof CreatePsychologicalEvaluationDto,
    value: string | number | boolean | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setIsDirty(true);

    // Validar campo en tiempo real
    const error = validateField(field, value);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: error || "",
    }));
  };

  const isStepComplete = (stepIndex: number): boolean => {
    const step = steps[stepIndex];
    return step.fields.every((field) => {
      const value = formData[field as keyof CreatePsychologicalEvaluationDto];
      if (field === "requiresFollowUp") return true;
      if (field === "followUpFrequency")
        return !formData.requiresFollowUp || value !== "";
      return value !== "" && value !== undefined && value !== null;
    });
  };

  const canProceedToNext = (): boolean => {
    return isStepComplete(currentStep);
  };

  const canAccessStep = (stepIndex: number): boolean => {
    for (let i = 0; i < stepIndex; i++) {
      if (!isStepComplete(i)) {
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      if (validateCurrentStep()) {
        setValidationMessage(null);
        setCurrentStep(currentStep + 1);
      } else {
        showErrorAlert(
          "Campos incompletos",
          "Por favor, completa todos los campos requeridos antes de continuar al siguiente paso."
        );
        setValidationMessage(
          "Por favor, corrige los errores antes de continuar."
        );
        setTimeout(() => setValidationMessage(null), 5000);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (canAccessStep(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  const handleSubmit = async () => {
    // Validar todos los pasos antes de enviar
    let allValid = true;
    const allErrors: Record<string, string> = {};

    steps.forEach((step) => {
      step.fields.forEach((field) => {
        const value = formData[field as keyof CreatePsychologicalEvaluationDto];
        const error = validateField(
          field as keyof CreatePsychologicalEvaluationDto,
          value
        );
        if (error) {
          allErrors[field] = error;
          allValid = false;
        }
      });
    });

    if (!allValid) {
      setFieldErrors(allErrors);
      showErrorAlert(
        "Formulario incompleto",
        "Por favor, corrige todos los errores antes de guardar la evaluación."
      );
      setValidationMessage(
        "Por favor, corrige todos los errores antes de guardar."
      );
      setTimeout(() => setValidationMessage(null), 5000);
      return;
    }

    // Confirmación antes de guardar
    const result = await showConfirm(
      "¿Guardar evaluación?",
      "Se creará una nueva evaluación psicológica con la información proporcionada."
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      setIsLoading(true);
      await psychologyService.createEvaluation(formData);
      showSuccessAlert(
        "¡Evaluación creada!",
        "La evaluación psicológica ha sido guardada correctamente."
      );
      setIsDirty(false);
      navigate("/psychology");
    } catch (error) {
      console.error("Error saving evaluation:", error);
      showErrorAlert(
        "Error al guardar",
        "No se pudo guardar la evaluación. Por favor, intenta nuevamente."
      );
      setError(
        "Error al guardar la evaluación. Por favor, intenta nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    if (isDirty) {
      const result = await showConfirm(
        "¿Salir sin guardar?",
        "Tienes cambios sin guardar. Si sales ahora, se perderán todos los datos ingresados."
      );

      if (result.isConfirmed) {
        navigate("/psychology");
      }
    } else {
      navigate("/psychology");
    }
  };

  const confirmExit = () => {
    setShowConfirmDialog(false);
    navigate("/psychology");
  };

  const cancelExit = () => {
    setShowConfirmDialog(false);
  };

  // Función para formatear fecha en español
  const formatDateToSpanish = (dateString: string): string => {
    if (!dateString) return "No especificada";

    // Parsear la fecha como fecha local para evitar problemas de zona horaria
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11

    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];

    const dayNumber = date.getDate();
    const monthName = months[date.getMonth()];
    const yearNumber = date.getFullYear();

    return `${dayNumber} de ${monthName} de ${yearNumber}`;
  };

  const getFieldDisplayValue = (field: string): string => {
    const value = formData[field as keyof CreatePsychologicalEvaluationDto];

    switch (field) {
      case "studentId":
        return students.find((s) => s.id === value)?.name || "No seleccionado";
      case "classroomId":
        return (
          classrooms.find((c) => c.id === value)?.name || "No seleccionado"
        );
      case "institutionId":
        return (
          institutions.find((i) => i.id === value)?.name || "No seleccionado"
        );
      case "evaluatedBy":
        return (
          evaluators.find((e) => e.id === value)?.name || "No seleccionado"
        );
      case "evaluationType": {
        const evalType = EVALUATION_TYPE_OPTIONS.find(
          (opt) => opt.value === value
        );
        return evalType ? evalType.label : String(value);
      }
      case "requiresFollowUp":
        return value ? "Sí" : "No";
      case "emotionalDevelopment":
      case "socialDevelopment":
      case "cognitiveDevelopment":
      case "motorDevelopment": {
        const devLevel = DEVELOPMENT_LEVEL_OPTIONS.find(
          (opt) => opt.value === value
        );
        return devLevel ? devLevel.label : "No evaluado";
      }
      default:
        return value?.toString() || "No especificado";
    }
  };

  if (loadingData) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cargando formulario
          </h3>
          <p className="text-gray-600">Obteniendo datos del sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">
                Nueva Evaluación Psicológica
              </h1>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showPreview ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>{showPreview ? "Ocultar" : "Vista Previa"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar de navegación */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Progreso del Formulario
              </h3>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="relative">
                    <button
                      onClick={() => handleStepClick(index)}
                      disabled={!canAccessStep(index)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${
                        currentStep === index
                          ? "bg-blue-50 text-blue-700"
                          : isStepComplete(index)
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : canAccessStep(index)
                          ? "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          currentStep === index
                            ? "bg-blue-600 text-white"
                            : isStepComplete(index)
                            ? "bg-green-600 text-white"
                            : canAccessStep(index)
                            ? "bg-gray-300 text-gray-600"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {isStepComplete(index) && currentStep !== index ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-medium">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{step.title}</div>
                        <div className="text-sm opacity-75">
                          {isStepComplete(index)
                            ? "Completado"
                            : canAccessStep(index)
                            ? "Disponible"
                            : "Bloqueado"}
                        </div>
                      </div>
                      {step.icon}
                    </button>
                  </div>
                ))}
              </div>

              {/* Barra de progreso */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progreso</span>
                  <span>
                    {Math.round(
                      (steps.filter((_, index) => isStepComplete(index))
                        .length /
                        steps.length) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (steps.filter((_, index) => isStepComplete(index))
                          .length /
                          steps.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1">
            <div className="flex gap-6">
              {/* Formulario */}
              <div
                className={`${
                  showPreview ? "w-1/2" : "w-full"
                } transition-all duration-300`}
              >
                <div className="bg-white rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center space-x-3">
                      {steps[currentStep].icon}
                      <h2 className="text-xl font-semibold text-gray-900">
                        {steps[currentStep].title}
                      </h2>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Mensaje de validación */}
                    {validationMessage && (
                      <div className="mb-6 p-4 bg-amber-50 rounded-lg">
                        <div className="flex items-center">
                          <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
                          <p className="text-amber-800 text-sm font-medium">
                            {validationMessage}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Paso 1: Información Básica */}
                    {currentStep === 0 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Estudiante *
                            </label>
                            <select
                              value={formData.studentId}
                              onChange={(e) =>
                                handleInputChange("studentId", e.target.value)
                              }
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors ${
                                fieldErrors.studentId
                                  ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                                  : formData.studentId
                                  ? "border-green-200 bg-green-50 focus:border-green-400 focus:ring-green-100"
                                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                              }`}
                              required
                            >
                              <option value="">Seleccionar estudiante</option>
                              {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                  {student.name}
                                </option>
                              ))}
                            </select>
                            {fieldErrors.studentId && (
                              <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {fieldErrors.studentId}
                              </p>
                            )}
                            {formData.studentId && !fieldErrors.studentId && (
                              <p className="mt-1 text-sm text-green-600 flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Estudiante seleccionado correctamente
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Aula *
                            </label>
                            <select
                              value={formData.classroomId}
                              onChange={(e) =>
                                handleInputChange("classroomId", e.target.value)
                              }
                              className={`w-full px-3 py-2 rounded-lg focus:ring-2 transition-colors ${
                                fieldErrors.classroomId
                                  ? "border border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                                  : formData.classroomId
                                  ? "border border-green-200 bg-green-50 focus:border-green-400 focus:ring-green-100"
                                  : "bg-gray-50 focus:bg-white focus:ring-blue-200"
                              }`}
                              required
                            >
                              <option value="">Seleccionar aula</option>
                              {classrooms.map((classroom) => (
                                <option key={classroom.id} value={classroom.id}>
                                  {classroom.name}
                                </option>
                              ))}
                            </select>
                            {fieldErrors.classroomId && (
                              <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {fieldErrors.classroomId}
                              </p>
                            )}
                            {formData.classroomId &&
                              !fieldErrors.classroomId && (
                                <p className="mt-1 text-sm text-green-600 flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Aula seleccionada correctamente
                                </p>
                              )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Institución *
                            </label>
                            <select
                              value={formData.institutionId}
                              onChange={(e) =>
                                handleInputChange(
                                  "institutionId",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Seleccionar institución</option>
                              {institutions.map((institution) => (
                                <option
                                  key={institution.id}
                                  value={institution.id}
                                >
                                  {institution.name}
                                </option>
                              ))}
                            </select>
                            {fieldErrors.institutionId && (
                              <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {fieldErrors.institutionId}
                              </p>
                            )}
                            {formData.institutionId &&
                              !fieldErrors.institutionId && (
                                <p className="mt-1 text-sm text-green-600 flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Institución seleccionada correctamente
                                </p>
                              )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Fecha de Evaluación *
                            </label>
                            <input
                              type="date"
                              value={formData.evaluationDate}
                              onChange={(e) =>
                                handleInputChange(
                                  "evaluationDate",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Año Académico *
                            </label>
                            <input
                              type="number"
                              value={formData.academicYear}
                              readOnly
                              className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-not-allowed"
                              title="El año académico se establece automáticamente al año actual"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tipo de Evaluación *
                            </label>
                            <select
                              value={formData.evaluationType}
                              onChange={(e) =>
                                handleInputChange(
                                  "evaluationType",
                                  e.target.value as EvaluationType
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              {EVALUATION_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo de Evaluación *
                          </label>
                          <div className="relative">
                            <textarea
                              value={formData.evaluationReason}
                              onChange={(e) =>
                                handleInputChange(
                                  "evaluationReason",
                                  e.target.value
                                )
                              }
                              rows={4}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                fieldErrors.evaluationReason
                                  ? "border-red-300 bg-red-50"
                                  : (formData.evaluationReason?.length || 0) >=
                                    10
                                  ? "border-green-200 bg-green-50"
                                  : "bg-gray-50"
                              }`}
                              placeholder="Describe claramente el motivo por el cual se realiza esta evaluación psicológica..."
                              required
                            />
                            <div className="flex justify-between items-center mt-2">
                              <div className="text-sm">
                                {fieldErrors.evaluationReason ? (
                                  <span className="text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {fieldErrors.evaluationReason}
                                  </span>
                                ) : (formData.evaluationReason?.length || 0) >=
                                  10 ? (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    Campo completado correctamente
                                  </span>
                                ) : (formData.evaluationReason?.length || 0) >
                                  0 ? (
                                  <span className="text-amber-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Mínimo 10 caracteres requeridos
                                  </span>
                                ) : null}
                              </div>
                              <span
                                className={`text-sm font-mono ${
                                  (formData.evaluationReason?.length || 0) >= 10
                                    ? "text-green-600"
                                    : (formData.evaluationReason?.length || 0) >
                                      0
                                    ? "text-amber-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {formData.evaluationReason?.length || 0}/500
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Paso 2: Desarrollo */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Desarrollo Emocional *
                            </label>
                            <select
                              value={formData.emotionalDevelopment || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "emotionalDevelopment",
                                  e.target.value as DevelopmentLevel
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Seleccionar nivel</option>
                              {DEVELOPMENT_LEVEL_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Desarrollo Social *
                            </label>
                            <select
                              value={formData.socialDevelopment || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "socialDevelopment",
                                  e.target.value as DevelopmentLevel
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Seleccionar nivel</option>
                              {DEVELOPMENT_LEVEL_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Desarrollo Cognitivo *
                            </label>
                            <select
                              value={formData.cognitiveDevelopment || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "cognitiveDevelopment",
                                  e.target.value as DevelopmentLevel
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Seleccionar nivel</option>
                              {DEVELOPMENT_LEVEL_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Desarrollo Motor *
                            </label>
                            <select
                              value={formData.motorDevelopment || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "motorDevelopment",
                                  e.target.value as DevelopmentLevel
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Seleccionar nivel</option>
                              {DEVELOPMENT_LEVEL_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">
                            Niveles de Desarrollo
                          </h4>
                          <div className="text-sm text-blue-800 space-y-1">
                            <p>
                              <strong>Esperado:</strong> El estudiante muestra
                              un desarrollo acorde a su edad
                            </p>
                            <p>
                              <strong>En Proceso:</strong> El estudiante está
                              desarrollando la habilidad gradualmente
                            </p>
                            <p>
                              <strong>Requiere Apoyo:</strong> El estudiante
                              necesita apoyo adicional para desarrollar la
                              habilidad
                            </p>
                            <p>
                              <strong>No Evaluado:</strong> No se pudo evaluar
                              esta área en la sesión
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Paso 3: Observaciones */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observaciones *
                          </label>
                          <div className="relative">
                            <textarea
                              value={formData.observations}
                              onChange={(e) =>
                                handleInputChange(
                                  "observations",
                                  e.target.value
                                )
                              }
                              rows={6}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                fieldErrors.observations
                                  ? "border-red-300 bg-red-50"
                                  : formData.observations.length >= 20
                                  ? "border-green-200 bg-green-50"
                                  : "bg-gray-50"
                              }`}
                              placeholder="Describe detalladamente las observaciones realizadas durante la evaluación..."
                              required
                            />
                            <div className="flex justify-between items-center mt-2">
                              <div className="text-sm">
                                {fieldErrors.observations ? (
                                  <span className="text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {fieldErrors.observations}
                                  </span>
                                ) : formData.observations.length >= 20 ? (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    Campo completado correctamente
                                  </span>
                                ) : formData.observations.length > 0 ? (
                                  <span className="text-amber-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Mínimo 20 caracteres requeridos
                                  </span>
                                ) : null}
                              </div>
                              <span
                                className={`text-sm font-mono ${
                                  formData.observations.length >= 20
                                    ? "text-green-600"
                                    : formData.observations.length > 0
                                    ? "text-amber-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {formData.observations.length}/1000
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Recomendaciones *
                          </label>
                          <div className="relative">
                            <textarea
                              value={formData.recommendations}
                              onChange={(e) =>
                                handleInputChange(
                                  "recommendations",
                                  e.target.value
                                )
                              }
                              rows={6}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                fieldErrors.recommendations
                                  ? "border-red-300 bg-red-50"
                                  : (formData.recommendations?.length || 0) >=
                                    20
                                  ? "border-green-200 bg-green-50"
                                  : "bg-gray-50"
                              }`}
                              placeholder="Proporciona recomendaciones específicas para el estudiante, familia y docentes..."
                              required
                            />
                            <div className="flex justify-between items-center mt-2">
                              <div className="text-sm">
                                {fieldErrors.recommendations ? (
                                  <span className="text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {fieldErrors.recommendations}
                                  </span>
                                ) : (formData.recommendations?.length || 0) >=
                                  20 ? (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    Campo completado correctamente
                                  </span>
                                ) : (formData.recommendations?.length || 0) >
                                  0 ? (
                                  <span className="text-amber-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Mínimo 20 caracteres requeridos
                                  </span>
                                ) : null}
                              </div>
                              <span
                                className={`text-sm font-mono ${
                                  (formData.recommendations?.length || 0) >= 20
                                    ? "text-green-600"
                                    : (formData.recommendations?.length || 0) >
                                      0
                                    ? "text-amber-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {formData.recommendations?.length || 0}/1000
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="requiresFollowUp"
                            checked={formData.requiresFollowUp}
                            onChange={(e) =>
                              handleInputChange(
                                "requiresFollowUp",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor="requiresFollowUp"
                            className="text-sm font-medium text-gray-700"
                          >
                            Requiere seguimiento
                          </label>
                        </div>

                        {formData.requiresFollowUp && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Frecuencia de Seguimiento *
                            </label>
                            <select
                              value={formData.followUpFrequency}
                              onChange={(e) =>
                                handleInputChange(
                                  "followUpFrequency",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Seleccionar frecuencia</option>
                              <option value="SEMANAL">Semanal</option>
                              <option value="QUINCENAL">Quincenal</option>
                              <option value="MENSUAL">Mensual</option>
                              <option value="BIMESTRAL">Bimestral</option>
                              <option value="TRIMESTRAL">Trimestral</option>
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Evaluado por *
                          </label>
                          <select
                            value={formData.evaluatedBy}
                            onChange={(e) =>
                              handleInputChange("evaluatedBy", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Seleccionar evaluador</option>
                            {evaluators.map((evaluator) => (
                              <option key={evaluator.id} value={evaluator.id}>
                                {evaluator.name}
                              </option>
                            ))}
                          </select>
                          {fieldErrors.evaluatedBy && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {fieldErrors.evaluatedBy}
                            </p>
                          )}
                          {formData.evaluatedBy && !fieldErrors.evaluatedBy && (
                            <p className="mt-1 text-sm text-green-600 flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Evaluador seleccionado correctamente
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones de navegación */}
                  <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
                    <button
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        currentStep === 0
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-gray-600 text-white hover:bg-gray-700"
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior</span>
                    </button>

                    {currentStep < steps.length - 1 ? (
                      <button
                        onClick={handleNext}
                        disabled={!canProceedToNext()}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                          canProceedToNext()
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all transform ${
                          isLoading
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:scale-105 shadow-lg hover:shadow-xl"
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        <span>
                          {isLoading
                            ? "Guardando evaluación..."
                            : "Guardar Evaluación"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Panel de Vista Previa */}
              {showPreview && (
                <div className="w-1/2">
                  <div className="bg-white rounded-lg shadow-sm border sticky top-8 h-[calc(100vh-200px)] flex flex-col">
                    <div className="p-6 border-b flex-shrink-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Vista Previa
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Resumen de la evaluación
                      </p>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="h-full overflow-y-auto p-6">
                        <div className="space-y-3">
                          {/* Información Básica */}
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                              <User className="w-4 h-4 text-blue-600" />
                              <h4 className="font-semibold text-blue-900">
                                Información Básica
                              </h4>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-blue-700">
                                  Estudiante:
                                </span>
                                <span className="text-blue-900 font-medium">
                                  {getFieldDisplayValue("studentId")}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Aula:</span>
                                <span className="text-blue-900 font-medium">
                                  {getFieldDisplayValue("classroomId")}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">
                                  Institución:
                                </span>
                                <span className="text-blue-900 font-medium">
                                  {getFieldDisplayValue("institutionId")}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Fecha:</span>
                                <span className="text-blue-900 font-medium">
                                  {formatDateToSpanish(formData.evaluationDate)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Tipo:</span>
                                <span className="text-blue-900 font-medium">
                                  {getFieldDisplayValue("evaluationType")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Desarrollo */}
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Brain className="w-4 h-4 text-green-600" />
                              <h4 className="font-semibold text-green-900">
                                Desarrollo
                              </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-green-700 block">
                                  Emocional:
                                </span>
                                <span className="text-green-900 font-medium">
                                  {getFieldDisplayValue("emotionalDevelopment")}
                                </span>
                              </div>
                              <div>
                                <span className="text-green-700 block">
                                  Social:
                                </span>
                                <span className="text-green-900 font-medium">
                                  {getFieldDisplayValue("socialDevelopment")}
                                </span>
                              </div>
                              <div>
                                <span className="text-green-700 block">
                                  Cognitivo:
                                </span>
                                <span className="text-green-900 font-medium">
                                  {getFieldDisplayValue("cognitiveDevelopment")}
                                </span>
                              </div>
                              <div>
                                <span className="text-green-700 block">
                                  Motor:
                                </span>
                                <span className="text-green-900 font-medium">
                                  {getFieldDisplayValue("motorDevelopment")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Observaciones */}
                          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                            <div className="flex items-center gap-2 mb-3">
                              <MessageSquare className="w-4 h-4 text-orange-600" />
                              <h4 className="font-semibold text-orange-900">
                                Observaciones
                              </h4>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-orange-700 block mb-1">
                                  Observaciones:
                                </span>
                                <div className="text-orange-900 bg-white rounded p-2 border max-h-20 overflow-y-auto">
                                  {formData.observations || "Sin observaciones"}
                                </div>
                              </div>
                              <div>
                                <span className="text-orange-700 block mb-1">
                                  Recomendaciones:
                                </span>
                                <div className="text-orange-900 bg-white rounded p-2 border max-h-20 overflow-y-auto">
                                  {formData.recommendations ||
                                    "Sin recomendaciones"}
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-orange-700">
                                  Seguimiento:
                                </span>
                                <span className="text-orange-900 font-medium">
                                  {getFieldDisplayValue("requiresFollowUp")}
                                </span>
                              </div>
                              {formData.requiresFollowUp && (
                                <div className="flex justify-between">
                                  <span className="text-orange-700">
                                    Frecuencia:
                                  </span>
                                  <span className="text-orange-900 font-medium">
                                    {formData.followUpFrequency ||
                                      "No especificada"}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-orange-700">
                                  Evaluador:
                                </span>
                                <span className="text-orange-900 font-medium">
                                  {getFieldDisplayValue("evaluatedBy")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Progreso */}
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-3">
                              Progreso del Formulario
                            </h4>
                            <div className="space-y-2">
                              {steps.map((step, stepIndex) => (
                                <div
                                  key={step.id}
                                  className="flex items-center gap-2"
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                                      isStepComplete(stepIndex)
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-300 text-gray-600"
                                    }`}
                                  >
                                    {isStepComplete(stepIndex)
                                      ? "✓"
                                      : stepIndex + 1}
                                  </div>
                                  <span
                                    className={`text-sm ${
                                      isStepComplete(stepIndex)
                                        ? "text-green-700 font-medium"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {step.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Completado</span>
                                <span>
                                  {Math.round(
                                    (steps.filter((_, index) =>
                                      isStepComplete(index)
                                    ).length /
                                      steps.length) *
                                      100
                                  )}
                                  %
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${
                                      (steps.filter((_, index) =>
                                        isStepComplete(index)
                                      ).length /
                                        steps.length) *
                                      100
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación para salir */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-amber-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                ¿Salir sin guardar?
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Tienes cambios sin guardar. Si sales ahora, perderás toda la
              información ingresada.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelExit}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmExit}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
