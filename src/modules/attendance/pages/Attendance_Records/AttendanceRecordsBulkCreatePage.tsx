import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { attendanceService } from "../../service/Attendance.service";
import type {
  BulkAttendanceDto,
  AttendanceStatus,
} from "../../models/attendance.model";
import {
  showErrorAlert,
  showSuccessAlertHtml,
  showErrorAlertHtml,
} from "../../../../shared/utils/sweetAlert";

interface Student {
  id: string;
  name: string;
  institutionId?: string;
  classroomId?: string;
}

interface Classroom {
  id: string;
  name: string;
  institutionId?: string;
}

export function AttendanceRecordsBulkCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Listas de referencia
  const [institutions, setInstitutions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Filtros
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Estudiantes seleccionados
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );

  // Datos comunes del formulario
  const [formData, setFormData] = useState({
    classroomId: "",
    attendanceDate: new Date().toISOString().split("T")[0],
    academicYear: new Date().getFullYear(),
    attendanceStatus: "PRESENTE" as AttendanceStatus,
    arrivalTime: new Date().toTimeString().slice(0, 5), // Hora actual automática
    registeredBy: "Administrador",
  });

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (selectedInstitution) {
      loadStudentsByInstitution();
      loadClassroomsByInstitution();
    } else {
      setStudents([]);
      setClassrooms([]);
      setFormData({ ...formData, classroomId: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstitution]);

  // Limpiar selecciones cuando cambie el aula
  useEffect(() => {
    setSelectedStudents(new Set());
  }, [formData.classroomId]);

  const loadReferenceData = async () => {
    try {
      const institutionsData = await attendanceService.getAllInstitutions();
      setInstitutions(institutionsData);
    } catch {
      showErrorAlert("Error", "No se pudieron cargar los datos de referencia");
    }
  };

  const loadStudentsByInstitution = async () => {
    if (!selectedInstitution) return;

    try {
      setLoadingStudents(true);
      const studentsData = await attendanceService.getStudentsByInstitution(
        selectedInstitution
      );
      console.log("[Students] Total loaded:", studentsData.length);
      console.log("[Students] Sample:", studentsData[0]);
      console.log(
        "[Students] With classroomId:",
        studentsData.filter((s) => s.classroomId).length
      );
      console.log(
        "[Students] Without classroomId:",
        studentsData.filter((s) => !s.classroomId).length
      );
      setStudents(studentsData);
    } catch {
      showErrorAlert("Error", "No se pudieron cargar los estudiantes");
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadClassroomsByInstitution = async () => {
    if (!selectedInstitution) return;

    try {
      const classroomsData = await attendanceService.getClassroomsByInstitution(
        selectedInstitution
      );
      console.log("[Classrooms] Total loaded:", classroomsData.length);
      console.log("[Classrooms] Sample:", classroomsData[0]);
      setClassrooms(classroomsData);
    } catch {
      showErrorAlert("Error", "No se pudieron cargar las aulas");
    }
  };

  const filteredStudents = students.filter((student) => {
    // NO mostrar estudiantes si no hay aula seleccionada
    if (!formData.classroomId) {
      return false;
    }

    // Filtrar por búsqueda de nombre
    const matchesSearch = student.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // SOLO mostrar estudiantes que pertenecen al aula seleccionada
    const matchesClassroom = student.classroomId === formData.classroomId;

    return matchesSearch && matchesClassroom;
  });

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const handleToggleStudent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    console.log("Student selected:", student);

    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);

      // Auto-seleccionar el aula del estudiante si no hay aula seleccionada
      if (!formData.classroomId && student?.classroomId) {
        console.log("Auto-selecting classroom:", student.classroomId);
        setFormData((prev) => ({ ...prev, classroomId: student.classroomId! }));
      }
    }
    setSelectedStudents(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStudents.size === 0) {
      showErrorAlert("Error", "Debe seleccionar al menos un estudiante");
      return;
    }

    if (!formData.classroomId) {
      showErrorAlert("Error", "Debe seleccionar un aula");
      return;
    }

    if (!selectedInstitution) {
      showErrorAlert("Error", "Debe seleccionar una institución");
      return;
    }

    try {
      setLoading(true);

      const bulkData: BulkAttendanceDto = {
        studentIds: Array.from(selectedStudents),
        classroomId: formData.classroomId,
        institutionId: selectedInstitution,
        attendanceDate: formData.attendanceDate,
        academicYear: formData.academicYear,
        attendanceStatus: formData.attendanceStatus,
        arrivalTime: formData.arrivalTime || undefined,
        registeredBy: formData.registeredBy,
      };

      const response = await attendanceService.createBulkAttendance(bulkData);

      if (response.successCount > 0) {
        if (response.failureCount > 0) {
          // Hay éxitos y fallos - Agrupar duplicados
          const uniqueFailed = new Map();
          response.failedRecords?.forEach((failed) => {
            const key = `${failed.studentName}-${failed.reason}`;
            if (!uniqueFailed.has(key)) {
              uniqueFailed.set(key, failed);
            }
          });

          const failedArray = Array.from(uniqueFailed.values()).slice(0, 8);
          const failedList = failedArray
            .map(
              (failed, index) =>
                `<div style="display: flex; align-items: start; padding: 10px; background: ${
                  index % 2 === 0 ? "#ffffff" : "#f9fafb"
                }; border-radius: 6px; margin-bottom: 6px;">
              <div style="flex-shrink: 0; width: 24px; height: 24px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <span style="color: #dc2626; font-weight: bold; font-size: 12px;">✗</span>
              </div>
              <div style="flex: 1;">
                <p style="font-weight: 600; color: #111827; margin: 0 0 4px 0; font-size: 14px;">${
                  failed.studentName
                }</p>
                <p style="font-size: 13px; color: #dc2626; margin: 0; line-height: 1.4;">${
                  failed.reason
                }</p>
              </div>
            </div>`
            )
            .join("");

          const moreCount = uniqueFailed.size - failedArray.length;
          const moreText =
            moreCount > 0
              ? `<div style="text-align: center; padding: 12px; color: #6b7280; font-size: 13px; background: #f3f4f6; border-radius: 6px; margin-top: 8px;">
                <span style="font-weight: 500;">+ ${moreCount} estudiante${
                  moreCount > 1 ? "s" : ""
                } más con errores similares</span>
              </div>`
              : "";

          const htmlMessage = `
            <div style="text-align: center; margin-bottom: 24px; padding: 16px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px;">
              <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 32px;">✓</span>
                <span style="font-size: 28px; font-weight: 700; color: #10b981;">${response.successCount}</span>
              </div>
              <p style="font-size: 14px; color: #059669; margin: 0; font-weight: 500;">Registros exitosos</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 20px; border: 2px solid #fecaca;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <div style="width: 40px; height: 40px; background: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 20px; font-weight: bold;">${response.failureCount}</span>
                </div>
                <div>
                  <p style="font-weight: 700; color: #991b1b; margin: 0; font-size: 16px;">Registros no agregados</p>
                  <p style="font-size: 12px; color: #b91c1c; margin: 4px 0 0 0;">Revise los siguientes estudiantes</p>
                </div>
              </div>
              
              <div style="background: white; border-radius: 10px; padding: 12px; max-height: 350px; overflow-y: auto; box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);">
                ${failedList}
                ${moreText}
              </div>
            </div>
          `;

          await showSuccessAlertHtml("Registro Masivo Completado", htmlMessage);
        } else {
          // Todos exitosos
          const htmlMessage = `
            <div style="text-align: center; padding: 24px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <span style="color: white; font-size: 48px;">✓</span>
              </div>
              <p style="font-size: 24px; font-weight: 700; color: #10b981; margin: 0 0 8px 0;">${response.successCount} Registros</p>
              <p style="font-size: 16px; color: #059669; margin: 0;">Todas las asistencias fueron registradas correctamente</p>
            </div>
          `;
          await showSuccessAlertHtml("¡Registro Exitoso!", htmlMessage);
        }
        navigate("/asistencias");
      } else {
        // Todos fallaron - Agrupar duplicados
        const uniqueFailed = new Map();
        response.failedRecords?.forEach((failed) => {
          const key = `${failed.studentName}-${failed.reason}`;
          if (!uniqueFailed.has(key)) {
            uniqueFailed.set(key, failed);
          }
        });

        const failedArray = Array.from(uniqueFailed.values()).slice(0, 10);
        const failedList = failedArray
          .map(
            (failed, index) =>
              `<div style="display: flex; align-items: start; padding: 12px; background: ${
                index % 2 === 0 ? "#ffffff" : "#fef2f2"
              }; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #dc2626;">
            <div style="flex-shrink: 0; width: 28px; height: 28px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
              <span style="color: #dc2626; font-weight: bold;">✗</span>
            </div>
            <div style="flex: 1;">
              <p style="font-weight: 600; color: #111827; margin: 0 0 6px 0; font-size: 15px;">${
                failed.studentName
              }</p>
              <p style="font-size: 13px; color: #dc2626; margin: 0; line-height: 1.5; background: white; padding: 6px 10px; border-radius: 4px;">${
                failed.reason
              }</p>
            </div>
          </div>`
          )
          .join("");

        const moreCount = uniqueFailed.size - failedArray.length;
        const moreText =
          moreCount > 0
            ? `<div style="text-align: center; padding: 14px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 8px; margin-top: 12px; border: 1px dashed #d1d5db;">
              <span style="font-weight: 600;">+ ${moreCount} estudiante${
                moreCount > 1 ? "s" : ""
              } más</span>
            </div>`
            : "";

        const htmlMessage = `
          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 24px; border: 2px solid #fca5a5;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="width: 60px; height: 60px; background: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
                <span style="color: white; font-size: 32px;">✗</span>
              </div>
              <p style="color: #991b1b; font-weight: 700; margin: 0; font-size: 18px;">No se pudo registrar ninguna asistencia</p>
              <p style="color: #b91c1c; font-size: 14px; margin: 8px 0 0 0;">Todos los estudiantes seleccionados tienen problemas</p>
            </div>
            
            <div style="background: white; border-radius: 10px; padding: 16px; max-height: 450px; overflow-y: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
              ${failedList}
              ${moreText}
            </div>
          </div>
        `;

        showErrorAlertHtml("Error en Registro Masivo", htmlMessage);
      }
    } catch {
      showErrorAlert("Error", "No se pudo completar el registro masivo");
    } finally {
      setLoading(false);
    }
  };

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
                Registro Masivo de Asistencia
              </h1>
            </div>
            <button
              type="button"
              onClick={() => navigate("/asistencias/nuevo")}
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Registro Individual</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Configuration */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header del panel */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Configuración de Registro
                  </h2>
                  <p className="text-indigo-100 text-xs mt-1">
                    Complete los datos para el registro masivo
                  </p>
                </div>

                <div className="p-4">
                  {/* Campos del formulario */}
                  <div className="space-y-3 mb-4">
                    {/* Institución */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Institución Educativa
                      </label>
                      <select
                        value={selectedInstitution}
                        onChange={(e) => {
                          setSelectedInstitution(e.target.value);
                          setSelectedStudents(new Set());
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        required
                      >
                        <option value="">Seleccione institución</option>
                        {institutions.map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Aula */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Aula
                      </label>
                      <select
                        value={formData.classroomId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            classroomId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        required
                        disabled={!selectedInstitution}
                      >
                        <option value="">
                          {selectedInstitution
                            ? "Seleccione aula"
                            : "Primero seleccione institución"}
                        </option>
                        {classrooms.map((classroom) => (
                          <option key={classroom.id} value={classroom.id}>
                            {classroom.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fecha y Año en grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Fecha
                        </label>
                        <input
                          type="date"
                          value={formData.attendanceDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              attendanceDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Año
                        </label>
                        <input
                          type="number"
                          value={formData.academicYear}
                          readOnly
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Estado */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Estado
                      </label>
                      <select
                        value={formData.attendanceStatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            attendanceStatus: e.target
                              .value as AttendanceStatus,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        required
                      >
                        <option value="PRESENTE">Presente</option>
                        <option value="AUSENTE">Ausente</option>
                        <option value="TARDANZA">Tardanza</option>
                      </select>
                    </div>

                    {/* Hora de Llegada */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Hora Llegada (Automática)
                      </label>
                      <input
                        type="time"
                        value={formData.arrivalTime}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Resumen */}
                  <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5 text-indigo-600"
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
                      <div className="text-center">
                        <p className="text-xs text-indigo-600 font-medium">
                          Seleccionados
                        </p>
                        <p className="text-2xl font-bold text-indigo-900">
                          {selectedStudents.size}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => navigate("/asistencias")}
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || selectedStudents.size === 0}
                      className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {loading ? "Registrando..." : "Registrar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel derecho - Lista de estudiantes */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Seleccionar Estudiantes
                  </h2>

                  {/* Búsqueda */}
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar estudiante por nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-gray-400"
                      disabled={!selectedInstitution}
                    />
                  </div>

                  {/* Seleccionar todos */}
                  {filteredStudents.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <input
                        type="checkbox"
                        checked={
                          selectedStudents.size === filteredStudents.length
                        }
                        onChange={handleSelectAll}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 transition-all duration-200"
                      />
                      <label className="text-sm font-semibold text-gray-700">
                        Seleccionar todos ({filteredStudents.length}{" "}
                        estudiantes)
                      </label>
                    </div>
                  )}
                </div>

                {/* Lista de estudiantes */}
                <div className="p-6">
                  {!selectedInstitution ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium">
                        Paso 1: Seleccione una institución
                      </p>
                    </div>
                  ) : !formData.classroomId ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <p className="text-blue-600 font-medium mb-2">
                        Paso 2: Seleccione un aula
                      </p>
                      <p className="text-gray-500 text-sm">
                        Los estudiantes se mostrarán después de seleccionar el
                        aula
                      </p>
                    </div>
                  ) : loadingStudents ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Cargando estudiantes...</p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-10 h-10 text-amber-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-700 font-semibold text-lg mb-2">
                        No hay estudiantes en esta aula
                      </p>
                      <p className="text-gray-500 text-sm max-w-md mx-auto">
                        {searchTerm
                          ? `No se encontraron estudiantes que coincidan con "${searchTerm}"`
                          : "Esta aula no tiene estudiantes asignados. Seleccione otra aula o verifique la configuración."}
                      </p>
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm("")}
                          className="mt-4 px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                        >
                          Limpiar búsqueda
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                      {filteredStudents.map((student) => (
                        <label
                          key={student.id}
                          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedStudents.has(student.id)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => handleToggleStudent(student.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {student.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {student.id.substring(0, 8)}...
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
