import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { attendanceService } from "../../service/Attendance.service";
import type { AttendanceRecord } from "../../models/attendance.model";
import { getStatusLabel, getStatusColor } from "../../models/attendance.model";
import { showErrorAlert } from "../../../../shared/utils/sweetAlert";

export function AttendanceRecordsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    const loadRecord = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // El backend ya enriquece los datos con nombres
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

  const formatDate = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${day} de ${months[month - 1]} del ${year}`;
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
      success: "bg-green-100 text-green-800 border-green-200",
      error: "bg-red-100 text-red-800 border-red-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
      info: "bg-blue-100 text-blue-800 border-blue-200",
      default: "bg-gray-100 text-gray-800 border-gray-200",
    };
    const color = getStatusColor(status as AttendanceRecord['attendanceStatus']);
    return colorMap[color] || colorMap.default;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 text-lg">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/asistencias")}
            className="group flex items-center gap-2 text-gray-600 hover:text-indigo-600 mb-6 transition-all duration-200"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Volver a Asistencias</span>
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Detalle de Asistencia</h1>
                    <p className="text-indigo-100 text-sm mt-1">Información completa del registro</p>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate(`/asistencias/${id}/editar`)}
                  className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-medium transition-all duration-200 border border-white/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Status Badge */}
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Estado de Asistencia</span>
              <span className={`px-4 py-2 text-sm font-bold rounded-lg ${getStatusBadgeClass(record.attendanceStatus)}`}>
                {getStatusLabel(record.attendanceStatus)}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Estudiante */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <label className="block text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wide">Estudiante</label>
                <p className="text-xl font-bold text-gray-900">
                  {record.studentName || "Nombre no disponible"}
                </p>
              </div>

              {/* Aula */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                <label className="block text-xs font-semibold text-purple-600 mb-2 uppercase tracking-wide">Aula</label>
                <p className="text-xl font-bold text-gray-900">
                  {record.classroomName || "Aula no disponible"}
                </p>
              </div>

              {/* Institución */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                <label className="block text-xs font-semibold text-green-600 mb-2 uppercase tracking-wide">Institución</label>
                <p className="text-xl font-bold text-gray-900">
                  {record.institutionName || "Institución no disponible"}
                </p>
              </div>

              {/* Fecha */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
                <label className="block text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">Fecha</label>
                <p className="text-xl font-bold text-gray-900">{formatDate(record.attendanceDate)}</p>
              </div>

              {/* Año Académico */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-slate-100">
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Año Académico</label>
                <p className="text-xl font-bold text-gray-900">{record.academicYear}</p>
              </div>

              {/* Hora de Llegada */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-5 border border-cyan-100">
                <label className="block text-xs font-semibold text-cyan-600 mb-2 uppercase tracking-wide">Hora de Llegada</label>
                <p className="text-xl font-bold text-gray-900">{formatTime(record.arrivalTime)}</p>
              </div>

              {/* Hora de Salida */}
              <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-xl p-5 border border-rose-100">
                <label className="block text-xs font-semibold text-rose-600 mb-2 uppercase tracking-wide">Hora de Salida</label>
                <p className="text-xl font-bold text-gray-900">{formatTime(record.departureTime)}</p>
              </div>

              {/* Justificado */}
              <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-5 border border-teal-100">
                <label className="block text-xs font-semibold text-teal-600 mb-2 uppercase tracking-wide">Justificado</label>
                <p className="text-xl font-bold">
                  {record.justified ? (
                    <span className="text-green-600">Sí</span>
                  ) : (
                    <span className="text-gray-600">No</span>
                  )}
                </p>
              </div>
            </div>

            {/* Justification Details */}
            {record.justified && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Detalles de Justificación
                </h3>
                
                <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                  {record.justificationReason && (
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">Razón</label>
                      <p className="text-gray-900 leading-relaxed">{record.justificationReason}</p>
                    </div>
                  )}

                  {record.justificationDocumentUrl && (
                    <div>
                      <label className="block text-xs font-semibold text-amber-600 mb-2 uppercase tracking-wide">Documento</label>
                      <a
                        href={record.justificationDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Ver documento adjunto
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Información del Registro
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Registrado por</label>
                  <p className="text-lg font-semibold text-gray-900">{record.registeredByName || record.registeredBy}</p>
                </div>

                {record.registeredAt && (
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Fecha de registro</label>
                    <p className="text-lg font-semibold text-gray-900">{new Date(record.registeredAt).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
                  </div>
                )}

                {record.updatedAt && (
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Última actualización</label>
                    <p className="text-lg font-semibold text-gray-900">{new Date(record.updatedAt).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
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
