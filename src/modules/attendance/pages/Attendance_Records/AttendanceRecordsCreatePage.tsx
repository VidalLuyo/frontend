import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { attendanceService } from "../../service/Attendance.service";
import type {
  CreateAttendanceDto,
  AttendanceStatus,
} from "../../models/attendance.model";
import { ATTENDANCE_STATUS_OPTIONS } from "../../models/attendance.model";
import {
  showSuccessAlert,
  showErrorAlert,
} from "../../../../shared/utils/sweetAlert";

export function AttendanceRecordsCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [students, setStudents] = useState<
    Array<{
      id: string;
      name: string;
      classroomId?: string;
      institutionId?: string;
    }>
  >([]);
  const [classrooms, setClassrooms] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [institutions, setInstitutions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [allStudents, setAllStudents] = useState<
    Array<{
      id: string;
      name: string;
      classroomId?: string;
      institutionId?: string;
    }>
  >([]);
  const [allClassrooms, setAllClassrooms] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [formData, setFormData] = useState<CreateAttendanceDto>({
    studentId: "",
    classroomId: "",
    institutionId: "",
    attendanceDate: new Date().toISOString().split("T")[0],
    academicYear: new Date().getFullYear(),
    attendanceStatus: "PRESENTE",
    arrivalTime: new Date().toTimeString().slice(0, 5), // Hora actual automática
    departureTime: undefined,
    justified: false,
    justificationReason: undefined,
    justificationDocumentUrl: undefined,
    registeredBy: "Administrador",
  });

  useEffect(() => {
    const loadReferenceData = async () => {
      setLoadingData(true);
      try {
        const [studentsData, classroomsData, institutionsData] =
          await Promise.all([
            attendanceService.getAllStudents(),
            attendanceService.getAllClassrooms(),
            attendanceService.getAllInstitutions(),
          ]);
        setAllStudents(Array.isArray(studentsData) ? studentsData : []);
        setAllClassrooms(Array.isArray(classroomsData) ? classroomsData : []);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setClassrooms(Array.isArray(classroomsData) ? classroomsData : []);
        setInstitutions(
          Array.isArray(institutionsData) ? institutionsData : []
        );
      } catch (error) {
        console.error("Error loading reference data", error);
        setAllStudents([]);
        setAllClassrooms([]);
        setStudents([]);
        setClassrooms([]);
        setInstitutions([]);
      } finally {
        setLoadingData(false);
      }
    };
    loadReferenceData();
  }, []);

  useEffect(() => {
    const filterByInstitution = async () => {
      if (formData.institutionId) {
        try {
          const [studentsData, classroomsData] = await Promise.all([
            attendanceService.getStudentsByInstitution(formData.institutionId),
            attendanceService.getClassroomsByInstitution(
              formData.institutionId
            ),
          ]);
          setStudents(studentsData);
          setClassrooms(classroomsData);
          // Reset selections if they're not in the filtered lists
          if (
            !studentsData.find(
              (s: { id: string }) => s.id === formData.studentId
            )
          ) {
            handleChange("studentId", "");
          }
          if (
            !classroomsData.find(
              (c: { id: string }) => c.id === formData.classroomId
            )
          ) {
            handleChange("classroomId", "");
          }
        } catch (error) {
          console.error("Error filtering by institution", error);
        }
      } else {
        // Show all if no institution selected
        setStudents(allStudents);
        setClassrooms(allClassrooms);
      }
    };
    filterByInstitution();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.institutionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await attendanceService.createAttendance(formData);
      showSuccessAlert(
        "Registro creado",
        "La asistencia ha sido registrada correctamente"
      );
      navigate("/asistencias");
    } catch {
      showErrorAlert("Error", "No se pudo registrar la asistencia");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof CreateAttendanceDto,
    value: string | boolean | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Filtrar estudiantes por aula seleccionada
  const studentsInClassroom = students.filter(
    (student) =>
      formData.classroomId && student.classroomId === formData.classroomId
  );

  // Determinar si el select de estudiantes debe estar habilitado
  const isStudentSelectEnabled =
    formData.classroomId && studentsInClassroom.length > 0;

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header limpio */}
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
              Registrar Asistencia
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 lg:px-12 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario principal - 2/3 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Información del Registro
                  </h2>
                  <p className="text-sm text-gray-500 mb-5">
                    Complete los datos para registrar la asistencia
                  </p>

                  <div className="space-y-4">
                    {/* Institución */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Institución Educativa{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.institutionId}
                        onChange={(e) =>
                          handleChange("institutionId", e.target.value)
                        }
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      >
                        <option value="">Seleccione institución</option>
                        {Array.isArray(institutions) &&
                          institutions.map((institution) => (
                            <option key={institution.id} value={institution.id}>
                              {institution.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Aula y Estudiante en grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Aula <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.classroomId}
                          onChange={(e) =>
                            handleChange("classroomId", e.target.value)
                          }
                          disabled={!formData.institutionId}
                          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        >
                          <option value="">
                            {formData.institutionId
                              ? "Seleccione aula"
                              : "Primero seleccione institución"}
                          </option>
                          {Array.isArray(classrooms) &&
                            classrooms.map((classroom) => (
                              <option key={classroom.id} value={classroom.id}>
                                {classroom.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Estudiante <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.studentId}
                          disabled={!isStudentSelectEnabled}
                          onChange={(e) =>
                            handleChange("studentId", e.target.value)
                          }
                          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        >
                          <option value="">
                            {!formData.classroomId
                              ? "Primero seleccione aula"
                              : studentsInClassroom.length === 0
                              ? "No hay estudiantes"
                              : "Seleccione estudiante"}
                          </option>
                          {studentsInClassroom.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Fecha, Año y Estado en grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Fecha <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.attendanceDate}
                          onChange={(e) =>
                            handleChange("attendanceDate", e.target.value)
                          }
                          disabled={!formData.institutionId}
                          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm disabled:bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Año Académico
                        </label>
                        <input
                          type="number"
                          value={formData.academicYear}
                          readOnly
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700"
                        />
                      </div>

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
                          disabled={!formData.institutionId}
                          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm disabled:bg-gray-50"
                        >
                          {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Hora de Llegada */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Hora de Llegada (Automática)
                      </label>
                      <input
                        type="time"
                        value={formData.arrivalTime || ""}
                        readOnly
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Botones */}
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
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 shadow-sm text-sm"
                  >
                    {loading ? (
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
                        Guardando...
                      </span>
                    ) : (
                      "Registrar Asistencia"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - 1/3 */}
          <div className="lg:col-span-1 space-y-4">
            {/* Card de ayuda */}
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
                    La hora de llegada se registra automáticamente. La hora de
                    salida se puede agregar posteriormente editando el registro.
                  </p>
                </div>
              </div>
            </div>

            {/* Acceso rápido */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Acceso Rápido
              </h3>
              <button
                type="button"
                onClick={() => navigate("/asistencias/nuevo/masivo")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Registro Masivo
                  </p>
                  <p className="text-xs text-gray-500">
                    Registrar múltiples estudiantes
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
