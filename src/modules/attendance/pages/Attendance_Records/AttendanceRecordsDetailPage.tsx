import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { attendanceService } from "../../service/Attendance.service";
import type { AttendanceRecord } from "../../models/attendance.model";
import { getStatusLabel, getStatusColor } from "../../models/attendance.model";
import { showErrorAlert } from "../../../../shared/utils/sweetAlert";
import { DocumentViewer } from "../../components/DocumentViewer";

export function AttendanceRecordsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  useEffect(() => {
    const loadRecord = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await attendanceService.getAttendanceById(id);
        setRecord(data);
      } catch {
        showErrorAlert("Error", "No se pudo cargar el registro");
        navigate("/asistencias");
      } finally {
        setLoading(false);
      }
    };
    loadRecord();
  }, [id, navigate]);

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
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

  const formatTime = (time?: string) => {
    if (!time) return "No registrado";
    const [hours, minutes] = time.substring(0, 5).split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const getStatusBadgeClass = (status: string) => {
    const colorMap: Record<string, string> = {
      success: "bg-green-100 text-green-700",
      error: "bg-red-100 text-red-700",
      warning: "bg-yellow-100 text-yellow-700",
      info: "bg-blue-100 text-blue-700",
      default: "bg-gray-100 text-gray-700",
    };
    const color = getStatusColor(status as AttendanceRecord['attendanceStatus']);
    return colorMap[color] || colorMap.default;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h3 className="font-semibold text-gray-900">Cargando registro</h3>
              <p className="text-gray-600 text-sm">Obteniendo información detallada...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-6 py-4">
        {/* Header */}
        <div className="mb-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <button
              onClick={() => navigate("/asistencias")}
              className="flex items-center gap-1 hover:text-blue-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Asistencias
            </button>
            <span>/</span>
            <span className="text-gray-900">Detalle</span>
          </nav>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Registro de Asistencia</h1>
                  <p className="text-gray-600 mt-1">{record.studentName || "Estudiante no identificado"}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(record.attendanceStatus)}`}>
                      {getStatusLabel(record.attendanceStatus)}
                    </span>
                    {record.justified && (
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-amber-100 text-amber-700">
                        Justificado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/asistencias/${id}/editar`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
                {(record.attendanceStatus === "AUSENTE" || record.attendanceStatus === "TARDANZA") && !record.justified && (
                  <button
                    onClick={() => navigate(`/asistencias/${id}/justificar`)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Justificar
                  </button>
                )}
                <button
                  onClick={() => navigate("/asistencias")}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium flex items-center gap-2"
                >
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
                  <p className="text-gray-900 font-semibold">{record.studentName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Aula</label>
                  <p className="text-gray-900">{record.classroomName || "No disponible"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Institución</label>
                  <p className="text-gray-900">{record.institutionName || "No disponible"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Año Académico</label>
                  <p className="text-gray-900 font-mono">{record.academicYear}</p>
                </div>
              </div>
            </div>

            {/* Detalles de asistencia */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles de Asistencia</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Hora de Llegada</h3>
                      <p className="text-sm text-gray-600">Registro de entrada</p>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">{formatTime(record.arrivalTime)}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Hora de Salida</h3>
                      <p className="text-sm text-gray-600">Registro de salida</p>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">{formatTime(record.departureTime)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Justificación */}
            {record.justified && (
              <div className="bg-white rounded-lg border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Detalles de Justificación
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-amber-700 block mb-2 uppercase tracking-wide">Razón</label>
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {record.justificationReason || "No especificada"}
                      </p>
                    </div>
                  </div>

                  {record.justificationDocumentUrl && (
                    <div>
                      <label className="text-sm font-semibold text-amber-700 block mb-2 uppercase tracking-wide">Documento</label>
                      <button
                        onClick={() => setShowDocumentViewer(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver documento adjunto
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Detalles */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Registro</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Fecha de Asistencia</label>
                  <p className="text-gray-900 font-semibold">{formatDate(record.attendanceDate)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Estado</label>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(record.attendanceStatus)}`}>
                    {getStatusLabel(record.attendanceStatus)}
                  </span>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Registrado por</label>
                  <p className="text-gray-900 font-semibold">{record.registeredByName || record.registeredBy}</p>
                </div>
              </div>
            </div>

            {/* Información de registro */}
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Registro</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Fecha de Creación</label>
                  <p className="text-gray-900 font-mono text-sm">{formatDateTime(record.registeredAt)}</p>
                </div>

                {record.updatedAt && record.updatedAt !== record.registeredAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Última Actualización</label>
                    <p className="text-gray-900 font-mono text-sm">{formatDateTime(record.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showDocumentViewer && record?.justificationDocumentUrl && (
        <DocumentViewer
          url={record.justificationDocumentUrl}
          onClose={() => setShowDocumentViewer(false)}
        />
      )}
    </div>
  );
}
