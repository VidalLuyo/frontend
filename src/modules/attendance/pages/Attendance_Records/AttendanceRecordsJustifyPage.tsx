import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { attendanceService } from "../../service/Attendance.service";
import { fileService } from "../../service/File.service";
import type { AttendanceRecord } from "../../models/attendance.model";
import { showSuccessAlert, showErrorAlert } from "../../../../shared/utils/sweetAlert";

export function AttendanceRecordsJustifyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [justificationReason, setJustificationReason] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const loadRecord = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await attendanceService.getAttendanceById(id);
        setRecord(data);
        if (data.justified) {
          setJustificationReason(data.justificationReason || "");
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showErrorAlert("Error", "El archivo no debe superar los 5MB");
        return;
      }
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        showErrorAlert("Error", "Solo se permiten archivos PDF, JPG o PNG");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !justificationReason.trim()) {
      showErrorAlert("Error", "Debe proporcionar una razón de justificación");
      return;
    }

    try {
      setSubmitting(true);
      let finalDocumentUrl = "";
      if (selectedFile) {
        try {
          const data = await fileService.uploadFile(selectedFile);
          finalDocumentUrl = data.url;
        } catch (error) {
          console.error("Error uploading file:", error);
          showErrorAlert("Error", "No se pudo subir el archivo");
          return;
        }
      }

      await attendanceService.justifyAttendance(id, {
        justificationReason: justificationReason.trim(),
        justificationDocumentUrl: finalDocumentUrl?.trim() || undefined,
      });

      await showSuccessAlert("Justificación Registrada", "La asistencia ha sido justificada correctamente");
      navigate("/asistencias");
    } catch {
      showErrorAlert("Error", "No se pudo registrar la justificación");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h3 className="font-semibold text-gray-900">Cargando registro</h3>
              <p className="text-gray-600 text-sm">Obteniendo información...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/asistencias")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Volver</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Justificar Asistencia</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info del estudiante */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{record.studentName}</h2>
                <p className="text-sm text-gray-600">{formatDate(record.attendanceDate)} • {record.classroomName || "Sin aula"}</p>
              </div>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              record.attendanceStatus === "AUSENTE" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
            }`}>
              {record.attendanceStatus === "AUSENTE" ? "Ausente" : "Tardanza"}
            </span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna principal - 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Razón de justificación */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Razón de Justificación</h3>
                <textarea
                  value={justificationReason}
                  onChange={(e) => setJustificationReason(e.target.value)}
                  rows={5}
                  required
                  placeholder="Describa detalladamente el motivo de la ausencia o tardanza..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">Proporcione una explicación clara y detallada</p>
              </div>

              {/* Documento */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documento de Justificación (Opcional)</h3>
                
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-amber-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
                      <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700 mb-1">Haz clic para seleccionar un archivo</span>
                      <span className="text-xs text-gray-500">PDF, JPG o PNG (máx. 5MB)</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mt-3">El archivo se subirá automáticamente al registrar la justificación</p>
              </div>
            </div>

            {/* Sidebar - 1/3 */}
            <div className="space-y-6">
              {/* Información del registro */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Registro</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Aula</label>
                    <p className="text-sm text-gray-900">{record.classroomName || "No disponible"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Institución</label>
                    <p className="text-sm text-gray-900">{record.institutionName || "No disponible"}</p>
                  </div>
                </div>
              </div>

              {/* Ayuda */}
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900 mb-2">Información importante</h4>
                    <ul className="text-xs text-amber-800 space-y-1">
                      <li>• La razón debe ser clara y detallada</li>
                      <li>• El documento es opcional pero recomendado</li>
                      <li>• Formatos aceptados: PDF, JPG, PNG</li>
                      <li>• Tamaño máximo: 5MB</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/asistencias")}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !justificationReason.trim()}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {selectedFile ? "Subiendo y guardando..." : "Guardando..."}
                </span>
              ) : (
                record.justified ? "Actualizar Justificación" : "Registrar Justificación"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
