import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { attendanceService } from "../../service/Attendance.service";
import type {
  UpdateAttendanceDto,
  AttendanceStatus,
  AttendanceRecord,
} from "../../models/attendance.model";
import { ATTENDANCE_STATUS_OPTIONS } from "../../models/attendance.model";
import {
  showSuccessAlert,
  showErrorAlert,
} from "../../../../shared/utils/sweetAlert";
import { DocumentViewer } from "../../components/DocumentViewer";
import { fileService } from "../../service/File.service";

export function AttendanceRecordsEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UpdateAttendanceDto>({
    attendanceStatus: "PRESENTE",
    departureTime: undefined,
    justified: false,
    justificationReason: undefined,
    justificationDocumentUrl: undefined,
  });

  useEffect(() => {
    const loadRecord = async () => {
      if (!id) return;
      try {
        setLoadingData(true);
        const data = await attendanceService.getAttendanceById(id);
        setRecord(data);
        setFormData({
          attendanceStatus: data.attendanceStatus,
          departureTime: data.departureTime,
          justified: data.justified || false,
          justificationReason: data.justificationReason,
          justificationDocumentUrl: data.justificationDocumentUrl,
        });
      } catch {
        showErrorAlert("Error", "No se pudo cargar el registro");
        navigate("/asistencias");
      } finally {
        setLoadingData(false);
      }
    };
    loadRecord();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Validar que si está justificado, debe tener documento
    if (record?.justified && !formData.justificationDocumentUrl && !newFile) {
      showErrorAlert(
        "Documento requerido",
        "La asistencia está justificada y debe tener un documento adjunto. Por favor, suba un nuevo documento."
      );
      return;
    }

    setLoading(true);
    try {
      const updatedFormData = { ...formData };

      if (newFile) {
        setUploadingFile(true);

        if (formData.justificationDocumentUrl) {
          try {
            await fileService.deleteFile(formData.justificationDocumentUrl);
          } catch (error) {
            console.error("Error deleting old file:", error);
          }
        }

        const response = await fileService.uploadFile(newFile);
        updatedFormData.justificationDocumentUrl = response.url;
        setUploadingFile(false);
      }

      await attendanceService.updateAttendance(id, updatedFormData);
      showSuccessAlert(
        "Registro actualizado",
        "La asistencia ha sido actualizada correctamente"
      );
      navigate("/asistencias");
    } catch {
      showErrorAlert("Error", "No se pudo actualizar la asistencia");
    } finally {
      setLoading(false);
      setUploadingFile(false);
    }
  };

  const handleChange = (
    field: keyof UpdateAttendanceDto,
    value: string | boolean | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      showErrorAlert(
        "Archivo no válido",
        "Solo se permiten imágenes (JPG, PNG) o PDF"
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showErrorAlert(
        "Archivo muy grande",
        "El archivo no debe superar los 5MB"
      );
      return;
    }

    setNewFile(file);
  };

  const handleRemoveNewFile = () => {
    setNewFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveExistingFile = async () => {
    if (!formData.justificationDocumentUrl) return;

    try {
      await fileService.deleteFile(formData.justificationDocumentUrl);
      setFormData((prev) => ({ ...prev, justificationDocumentUrl: undefined }));
      showSuccessAlert(
        "Archivo eliminado",
        "Recuerde subir un nuevo documento antes de guardar los cambios"
      );
    } catch {
      showErrorAlert("Error", "No se pudo eliminar el archivo");
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-12">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate("/asistencias")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-5 h-5"
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
              <span className="font-medium">Volver</span>
            </button>
            <div className="h-6 w-px bg-gray-300 mx-4" />
            <h1 className="text-xl font-semibold text-gray-900">
              Editar Asistencia
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 lg:px-12 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Editar Registro
                  </h2>
                  <p className="text-sm text-gray-500 mb-5">
                    Modifique los datos de la asistencia
                  </p>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Información del Registro
                      </h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Estudiante:</span>
                          <p className="font-medium text-gray-900">
                            {record?.studentName || record?.studentId}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Aula:</span>
                          <p className="font-medium text-gray-900">
                            {record?.classroomName || record?.classroomId}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Fecha:</span>
                          <p className="font-medium text-gray-900">
                            {record?.attendanceDate}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Estado <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.attendanceStatus}
                          onChange={(e) =>
                            handleChange(
                              "attendanceStatus",
                              e.target.value as AttendanceStatus
                            )
                          }
                          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                          {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1.5">
                          Hora de Llegada (No editable)
                        </label>
                        <input
                          type="time"
                          value={record?.arrivalTime || ""}
                          disabled
                          className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Hora de Salida
                      </label>
                      <input
                        type="time"
                        value={formData.departureTime || ""}
                        onChange={(e) =>
                          handleChange(
                            "departureTime",
                            e.target.value || undefined
                          )
                        }
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>

                    {record.justified && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-2 mb-3">
                          <svg
                            className="w-5 h-5 text-amber-600"
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
                          <h3 className="text-sm font-semibold text-amber-900">
                            Asistencia Justificada
                          </h3>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-amber-700 mb-1">
                              Razón de Justificación
                            </label>
                            <p className="text-sm text-gray-900 bg-white p-3 rounded border border-amber-200">
                              {record.justificationReason || "No especificada"}
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-amber-700 mb-2">
                              Documento Adjunto{" "}
                              {!formData.justificationDocumentUrl &&
                                !newFile && (
                                  <span className="text-red-500">*</span>
                                )}
                            </label>

                            {!formData.justificationDocumentUrl && !newFile && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                                <div className="flex items-start gap-2">
                                  <svg
                                    className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                  </svg>
                                  <p className="text-xs text-red-700">
                                    <strong>Documento requerido:</strong> Debe
                                    subir un documento para poder guardar los
                                    cambios.
                                  </p>
                                </div>
                              </div>
                            )}

                            {newFile ? (
                              <div className="bg-white p-3 rounded border border-amber-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-5 h-5 text-green-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span className="text-sm text-gray-900">
                                      {newFile.name}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleRemoveNewFile}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              formData.justificationDocumentUrl && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowDocumentViewer(true)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 bg-white border border-blue-200 rounded-lg font-medium"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                    Ver documento actual
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleRemoveExistingFile}
                                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700 bg-white border border-red-200 rounded-lg font-medium"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              )
                            )}

                            {!newFile && (
                              <div className="mt-2">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                                  onChange={handleFileSelect}
                                  className="hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-200 rounded-lg font-medium"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                    />
                                  </svg>
                                  {formData.justificationDocumentUrl
                                    ? "Cambiar documento"
                                    : "Subir documento"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/asistencias")}
                    className="flex-1 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadingFile}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 shadow-sm text-sm"
                  >
                    {loading || uploadingFile ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        {uploadingFile ? "Subiendo archivo..." : "Guardando..."}
                      </span>
                    ) : (
                      "Actualizar Asistencia"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    Información
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Puede modificar el estado, hora de salida y cambiar el
                    documento de justificación si es necesario.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDocumentViewer && record?.justificationDocumentUrl && (
        <DocumentViewer
          url={record.justificationDocumentUrl}
          onClose={() => setShowDocumentViewer(false)}
        />
      )}
    </div>
  );
}
