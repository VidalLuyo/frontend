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
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/asistencias")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
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
                <span>Volver</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">
                Registrar Asistencia
              </h1>
            </div>
            <button
              type="button"
              onClick={() => navigate("/asistencias/nuevo/masivo")}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Registro Masivo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Información de Asistencia
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Los campos marcados con <span className="text-red-500">*</span>{" "}
                son obligatorios
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Institución */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Institución Educativa <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.institutionId}
                  onChange={(e) =>
                    handleChange("institutionId", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm hover:border-gray-400"
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

              {/* Aula */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Aula <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.classroomId}
                  onChange={(e) => handleChange("classroomId", e.target.value)}
                  disabled={!formData.institutionId}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed hover:border-gray-400"
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

              {/* Estudiante */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estudiante <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.studentId}
                  disabled={!isStudentSelectEnabled}
                  onChange={(e) => handleChange("studentId", e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed hover:border-gray-400"
                >
                  <option value="">
                    {!formData.classroomId
                      ? "Primero seleccione aula"
                      : studentsInClassroom.length === 0
                      ? "No hay ningún estudiante en esta aula"
                      : "Seleccione estudiante"}
                  </option>
                  {studentsInClassroom.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed hover:border-gray-400"
                />
              </div>

              {/* Año Académico */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Año Académico
                </label>
                <input
                  type="number"
                  value={formData.academicYear}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-sm text-gray-700 cursor-not-allowed"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed hover:border-gray-400"
                >
                  {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hora de Llegada */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hora Llegada (Automática)
                </label>
                <input
                  type="time"
                  value={formData.arrivalTime || ""}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg text-sm text-gray-700 cursor-not-allowed"
                />
              </div>

              {/* Hora de Salida - Info */}
              <div className="md:col-span-2 lg:col-span-2 bg-blue-50 rounded-xl p-5 border-2 border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-blue-600"
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
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-800">
                      Hora de Salida
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      La hora de salida se registra posteriormente al editar la
                      asistencia
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/asistencias")}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-sm shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
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
    </div>
  );
}
