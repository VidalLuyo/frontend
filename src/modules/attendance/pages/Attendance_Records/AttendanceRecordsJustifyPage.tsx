import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { attendanceService } from "../../service/Attendance.service";
import type { AttendanceRecord } from "../../models/attendance.model";
import { showSuccessAlert, showErrorAlert } from "../../../../shared/utils/sweetAlert";

export function AttendanceRecordsJustifyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [justificationReason, setJustificationReason] = useState("");
  const [justificationDocumentUrl, setJustificationDocumentUrl] = useState("");

  useEffect(() => {
    const loadRecord = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await attendanceService.getAttendanceById(id);
        setRecord(data);
        
        // Si ya está justificado, cargar los datos existentes
        if (data.justified) {
          setJustificationReason(data.justificationReason || "");
          setJustificationDocumentUrl(data.justificationDocumentUrl || "");
        }
      } catch {
        showErrorAlert("Error", "No se pudo cargar el registro");
        navigate("/asistencias");
      } finally {
        setLoading(false);
      }
    };
    loadRecord();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !justificationReason.trim()) {
      showErrorAlert("Error", "Debe proporcionar una razón de justificación");
      return;
    }

    try {
      setSubmitting(true);
      await attendanceService.justifyAttendance(id, {
        justificationReason: justificationReason.trim(),
        justificationDocumentUrl: justificationDocumentUrl.trim() || undefined,
      });
      
      await showSuccessAlert(
        "Justificación Registrada",
        "La asistencia ha sido justificada correctamente"
      );
      navigate("/asistencias");
    } catch {
      showErrorAlert("Error", "No se pudo registrar la justificación");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${day} de ${months[month - 1]} del ${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => navigate("/asistencias")}
            className="group flex items-center gap-2 text-gray-600 hover:text-indigo-600 mb-3 transition-all duration-200"
          >
            <svg
              className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm font-medium">Volver a Asistencias</span>
          </button>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-yellow-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Justificar Asistencia
                  </h1>
                  <p className="text-amber-100 text-xs mt-0.5">
                    {record.justified ? "Actualizar justificación existente" : "Registrar nueva justificación"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Registro */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-4">Información del Registro</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Estudiante</label>
              <p className="text-sm font-medium text-gray-900">{record.studentName}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha</label>
              <p className="text-sm font-medium text-gray-900">{formatDate(record.attendanceDate)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                record.attendanceStatus === "AUSENTE" 
                  ? "bg-red-100 text-red-800" 
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {record.attendanceStatus === "AUSENTE" ? "Ausente" : "Tardanza"}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Aula</label>
              <p className="text-sm font-medium text-gray-900">{record.classroomName || "No disponible"}</p>
            </div>
          </div>
        </div>

        {/* Formulario de Justificación */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-base font-bold text-gray-900">Datos de Justificación</h2>
              <p className="text-xs text-gray-500 mt-0.5">Complete la información para justificar la asistencia</p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Razón de Justificación */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Razón de Justificación <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={justificationReason}
                  onChange={(e) => setJustificationReason(e.target.value)}
                  rows={4}
                  required
                  placeholder="Describa el motivo de la ausencia o tardanza..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm resize-none"
                />
              </div>

              {/* URL del Documento */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  URL del Documento (Opcional)
                </label>
                <input
                  type="url"
                  value={justificationDocumentUrl}
                  onChange={(e) => setJustificationDocumentUrl(e.target.value)}
                  placeholder="https://ejemplo.com/documento.pdf"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Puede adjuntar un enlace a un documento de respaldo</p>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate("/asistencias")}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:border-gray-400 transition-all duration-200 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !justificationReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transform hover:-translate-y-0.5 text-sm"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </span>
                  ) : record.justified ? "Actualizar Justificación" : "Registrar Justificación"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
