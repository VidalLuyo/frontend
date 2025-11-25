import { useState, useEffect } from "react";
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

export function AttendanceRecordsEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);

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
        // Solo campos editables
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

    setLoading(true);
    try {
      await attendanceService.updateAttendance(id, formData);
      showSuccessAlert(
        "Registro actualizado",
        "La asistencia ha sido actualizada correctamente"
      );
      navigate("/asistencias");
    } catch {
      showErrorAlert("Error", "No se pudo actualizar la asistencia");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof UpdateAttendanceDto,
    value: string | boolean | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loadingData) {
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
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/asistencias")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
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
            Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Editar Asistencia
          </h1>
          <p className="text-gray-600 mt-2">
            Estudiante: {record.studentName} - Fecha: {record.attendanceDate}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información de solo lectura */}
            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Información del Registro</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Estudiante:</span>
                  <p className="font-medium text-gray-900">{record?.studentName || record?.studentId}</p>
                </div>
                <div>
                  <span className="text-gray-500">Aula:</span>
                  <p className="font-medium text-gray-900">{record?.classroomName || record?.classroomId}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fecha:</span>
                  <p className="font-medium text-gray-900">{record?.attendanceDate}</p>
                </div>
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Hora de Llegada - SOLO LECTURA */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Hora de Llegada (No editable)
              </label>
              <input
                type="time"
                value={record?.arrivalTime || ""}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Hora de Salida - EDITABLE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de Salida
              </label>
              <input
                type="time"
                value={formData.departureTime || ""}
                onChange={(e) => handleChange("departureTime", e.target.value || undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Información de Justificación - Solo Lectura */}
            {record.justified && (
              <div className="md:col-span-2 bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-amber-900">Asistencia Justificada</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-amber-700 mb-1">Razón de Justificación</label>
                    <p className="text-sm text-gray-900 bg-white p-3 rounded border border-amber-200">
                      {record.justificationReason || "No especificada"}
                    </p>
                  </div>
                  
                  {record.justificationDocumentUrl && (
                    <div>
                      <label className="block text-xs font-medium text-amber-700 mb-1">Documento Adjunto</label>
                      <a
                        href={record.justificationDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Ver documento
                      </a>
                    </div>
                  )}
                  
                  <p className="text-xs text-amber-700 italic">
                    Para modificar la justificación, use el botón "Justificar" en la lista de asistencias
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate("/asistencias")}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Actualizar Asistencia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
