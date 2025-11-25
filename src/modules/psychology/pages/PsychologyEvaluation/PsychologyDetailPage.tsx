import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { showSuccessAlert, showErrorAlert, showDeleteConfirm, showRestoreConfirm } from "../../../../shared/utils/sweetAlert";
import { psychologyService } from "../../service/Psychology.service";
import type { PsychologicalEvaluation } from "../../models/psychology.model";

export function PsychologyDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [evaluation, setEvaluation] = useState<PsychologicalEvaluation | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvaluation = async () => {
      if (!id) {
        navigate("/psychology");
        return;
      }

      try {
        setIsLoading(true);
        const data = await psychologyService.getEvaluationById(id);

        // Enriquecer con nombres reales
        const [studentName, classroomName, institutionName, evaluatorName] =
          await Promise.all([
            psychologyService
              .getStudentName(data.studentId)
              .catch(() => `Estudiante ${data.studentId.substring(0, 8)}`),
            psychologyService
              .getClassroomName(data.classroomId)
              .catch(() => `Aula ${data.classroomId.substring(0, 8)}`),
            psychologyService
              .getInstitutionName(data.institutionId)
              .catch(() => `Institución ${data.institutionId.substring(0, 8)}`),
            psychologyService
              .getEvaluatorName(data.evaluatedBy)
              .catch(() => `Evaluador ${data.evaluatedBy.substring(0, 8)}`),
          ]);

        setEvaluation({
          ...data,
          studentName,
          classroomName,
          institutionName,
          evaluatedByName: evaluatorName,
        });
      } catch (error) {
        console.error("Error loading evaluation:", error);
        setError("No se pudo cargar la evaluación");
      } finally {
        setIsLoading(false);
      }
    };

    loadEvaluation();
  }, [id, navigate]);

  const formatDate = (dateString: string) => {
    // Parsear la fecha como fecha local para evitar problemas de zona horaria
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
    return date.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    // Para fechas con hora, usar la zona horaria de Perú
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Lima"
    });
  };

  // Función para editar evaluación
  const handleEdit = () => {
    navigate(`/psychology/${id}/edit`);
  };

  // Función para desactivar evaluación
  const handleDeactivate = async () => {
    const result = await showDeleteConfirm("evaluación psicológica");
    
    if (result.isConfirmed) {
      try {
        await psychologyService.deactivateEvaluation(id!);
        showSuccessAlert("¡Evaluación desactivada!", "La evaluación ha sido desactivada correctamente");
        // Recargar la evaluación para mostrar el nuevo estado
        window.location.reload();
      } catch {
        showErrorAlert("Error", "No se pudo desactivar la evaluación. Inténtalo nuevamente.");
      }
    }
  };

  // Función para reactivar evaluación
  const handleReactivate = async () => {
    const result = await showRestoreConfirm("evaluación psicológica");
    
    if (result.isConfirmed) {
      try {
        await psychologyService.reactivateEvaluation(id!);
        showSuccessAlert("¡Evaluación reactivada!", "La evaluación ha sido reactivada correctamente");
        // Recargar la evaluación para mostrar el nuevo estado
        window.location.reload();
      } catch {
        showErrorAlert("Error", "No se pudo reactivar la evaluación. Inténtalo nuevamente.");
      }
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      INICIAL: "Inicial",
      SEGUIMIENTO: "Seguimiento",
      ESPECIAL: "Especial",
      DERIVACION: "Derivación",
    };
    return types[type as keyof typeof types] || type;
  };

  const getDevelopmentLabel = (level?: string) => {
    if (!level) return "No evaluado";
    const levels = {
      ESPERADO: "Esperado",
      EN_PROCESO: "En Proceso",
      REQUIERE_APOYO: "Requiere Apoyo",
      NO_EVALUADO: "No Evaluado",
    };
    return levels[level as keyof typeof levels] || level;
  };

  const getDevelopmentColor = (level?: string) => {
    if (!level) return "bg-slate-100 text-slate-600 border-slate-200";
    const colors = {
      ESPERADO: "bg-emerald-100 text-emerald-700 border-emerald-200",
      EN_PROCESO: "bg-amber-100 text-amber-700 border-amber-200",
      REQUIERE_APOYO: "bg-red-100 text-red-700 border-red-200",
      NO_EVALUADO: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return (
      colors[level as keyof typeof colors] ||
      "bg-slate-100 text-slate-600 border-slate-200"
    );
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Cargando evaluación
              </h3>
              <p className="text-gray-600 text-sm">
                Obteniendo información detallada...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-700 mb-6">
            {error || "Evaluación no encontrada"}
          </p>
          <button
            onClick={() => navigate("/psychology")}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-6 py-4">
        {/* Header */}
        <div className="mb-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <button
              onClick={() => navigate("/psychology")}
              className="flex items-center gap-1 hover:text-blue-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Evaluaciones
            </button>
            <span>/</span>
            <span className="text-gray-900">Detalle</span>
          </nav>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Evaluación Psicológica
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {evaluation.studentName || "Estudiante no identificado"}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        evaluation.evaluationType === "INICIAL" ? "bg-blue-100 text-blue-700"
                        : evaluation.evaluationType === "SEGUIMIENTO" ? "bg-green-100 text-green-700"
                        : evaluation.evaluationType === "ESPECIAL" ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700"
                      }`}>
                      {getTypeLabel(evaluation.evaluationType)}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        evaluation.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                      {evaluation.status === "ACTIVE" ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {evaluation.status === "ACTIVE" ? (
                  <>
                    <button onClick={handleEdit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                    <button onClick={handleDeactivate} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Desactivar
                    </button>
                  </>
                ) : (
                  <button onClick={handleReactivate} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reactivar
                  </button>
                )}
                <button onClick={() => navigate("/psychology")} className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 space-y-4">
            {/* Información del estudiante */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Estudiante</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Estudiante</label>
                  <p className="text-gray-900 font-semibold">{evaluation.studentName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Aula</label>
                  <p className="text-gray-900">{evaluation.classroomName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Institución</label>
                  <p className="text-gray-900">{evaluation.institutionName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Año Académico</label>
                  <p className="text-gray-900 font-mono">{evaluation.academicYear}</p>
                </div>
              </div>
            </div>

            {/* Áreas de desarrollo */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Áreas de Desarrollo</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Desarrollo Emocional</h3>
                      <p className="text-sm text-gray-600">Gestión de emociones</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDevelopmentColor(evaluation.emotionalDevelopment)}`}>
                      {getDevelopmentLabel(evaluation.emotionalDevelopment)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Desarrollo Social</h3>
                      <p className="text-sm text-gray-600">Interacción social</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDevelopmentColor(evaluation.socialDevelopment)}`}>
                      {getDevelopmentLabel(evaluation.socialDevelopment)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Desarrollo Cognitivo</h3>
                      <p className="text-sm text-gray-600">Capacidades mentales</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDevelopmentColor(evaluation.cognitiveDevelopment)}`}>
                      {getDevelopmentLabel(evaluation.cognitiveDevelopment)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Desarrollo Motor</h3>
                      <p className="text-sm text-gray-600">Habilidades físicas</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDevelopmentColor(evaluation.motorDevelopment)}`}>
                      {getDevelopmentLabel(evaluation.motorDevelopment)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Observaciones</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {evaluation.observations}
                </p>
              </div>
            </div>

            {/* Recomendaciones */}
            {evaluation.recommendations && (
              <div className="bg-white rounded-lg border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recomendaciones</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {evaluation.recommendations}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Detalles */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles de Evaluación</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Fecha de Evaluación</label>
                  <p className="text-gray-900 font-semibold">{formatDate(evaluation.evaluationDate)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Evaluador</label>
                  <p className="text-gray-900 font-semibold">{evaluation.evaluatedByName}</p>
                </div>

                {evaluation.evaluationReason && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Motivo</label>
                    <p className="text-gray-900 text-sm leading-relaxed">{evaluation.evaluationReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Seguimiento */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seguimiento</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Requiere Seguimiento</label>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                      evaluation.requiresFollowUp ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                    }`}>
                    {evaluation.requiresFollowUp ? "Sí" : "No"}
                  </span>
                </div>

                {evaluation.requiresFollowUp && evaluation.followUpFrequency && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Frecuencia</label>
                    <p className="text-gray-900 font-semibold">{evaluation.followUpFrequency}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Registro */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Registro</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Fecha de Creación</label>
                  <p className="text-gray-900 font-mono text-sm">{formatDateTime(evaluation.evaluatedAt)}</p>
                </div>

                {evaluation.updatedAt && evaluation.updatedAt !== evaluation.evaluatedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Última Actualización</label>
                    <p className="text-gray-900 font-mono text-sm">{formatDateTime(evaluation.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
