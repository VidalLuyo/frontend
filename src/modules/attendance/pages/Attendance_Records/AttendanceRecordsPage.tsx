import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AttendanceList } from "../../components/AttendanceList";
import { attendanceService } from "../../service/Attendance.service";
import type {
  AttendanceRecord,
  AttendanceStatus,
} from "../../models/attendance.model";
import {
  showSuccessAlert,
  showErrorAlert,
  showDeleteConfirm,
} from "../../../../shared/utils/sweetAlert";

export function AttendanceRecordsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AttendanceRecord[]>([]);
  const [filteredItems, setFilteredItems] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "all">(
    "all"
  );
  const [dateFilter, setDateFilter] = useState("");
  const [institutionFilter, setInstitutionFilter] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [justifiedFilter, setJustifiedFilter] = useState<"all" | "yes" | "no">(
    "all"
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const applyFilters = useCallback(
    (
      data: AttendanceRecord[],
      search: string,
      status: AttendanceStatus | "all",
      date: string,
      institution: string,
      classroom: string,
      justified: "all" | "yes" | "no"
    ) => {
      let filtered = data;

      if (search) {
        filtered = filtered.filter(
          (item) =>
            item.studentName?.toLowerCase().includes(search.toLowerCase()) ||
            item.studentId.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (status !== "all") {
        filtered = filtered.filter((item) => item.attendanceStatus === status);
      }

      if (date) {
        filtered = filtered.filter((item) => item.attendanceDate === date);
      }

      if (institution) {
        filtered = filtered.filter(
          (item) => item.institutionId === institution
        );
      }

      if (classroom) {
        filtered = filtered.filter((item) => item.classroomId === classroom);
      }

      if (justified !== "all") {
        filtered = filtered.filter((item) =>
          justified === "yes" ? item.justified : !item.justified
        );
      }

      setFilteredItems(filtered);
    },
    []
  );

  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const attendances = await attendanceService.getAllAttendances();
      setItems(attendances);
      applyFilters(
        attendances,
        searchTerm,
        statusFilter,
        dateFilter,
        institutionFilter,
        classroomFilter,
        justifiedFilter
      );
    } catch {
      setError(
        "No se pudo conectar con el servidor. Verifique que esté ejecutándose en el puerto 9082."
      );
    } finally {
      setLoading(false);
    }
  }, [
    applyFilters,
    searchTerm,
    statusFilter,
    dateFilter,
    institutionFilter,
    classroomFilter,
    justifiedFilter,
  ]);

  const getSuggestions = () => {
    if (!searchInput.trim()) return [];

    const uniqueNames = new Set<string>();
    items.forEach((item) => {
      if (item.studentName) {
        uniqueNames.add(item.studentName);
      }
    });

    return Array.from(uniqueNames).filter((name) =>
      name.toLowerCase().includes(searchInput.toLowerCase())
    );
  };

  const getUniqueInstitutions = () => {
    const unique = new Map<string, string>();
    items.forEach((item) => {
      if (item.institutionId && item.institutionName) {
        unique.set(item.institutionId, item.institutionName);
      }
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  };

  const getUniqueClassrooms = () => {
    const unique = new Map<string, string>();
    items.forEach((item) => {
      if (item.classroomId && item.classroomName) {
        unique.set(item.classroomId, item.classroomName);
      }
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  };

  const handleSelectSuggestion = (name: string) => {
    setSearchInput(name);
    setSearchTerm(name);
    setShowSuggestions(false);
    applyFilters(
      items,
      name,
      statusFilter,
      dateFilter,
      institutionFilter,
      classroomFilter,
      justifiedFilter
    );
  };

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    dateFilter,
    institutionFilter,
    classroomFilter,
    justifiedFilter,
  ]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await showDeleteConfirm("registro de asistencia");
      if (result.isConfirmed) {
        try {
          await attendanceService.deleteAttendance(id);
          await fetchAttendances();
          showSuccessAlert(
            "Registro eliminado",
            "El registro de asistencia ha sido eliminado correctamente"
          );
        } catch {
          showErrorAlert("Error", "No se pudo eliminar el registro");
        }
      }
    },
    [fetchAttendances]
  );

  const handleJustify = useCallback(
    (id: string) => {
      navigate(`/asistencias/${id}/justificar`);
    },
    [navigate]
  );

  const getStats = () => {
    const total = items.length;
    const present = items.filter(
      (item) => item.attendanceStatus === "PRESENTE"
    ).length;
    const absent = items.filter(
      (item) => item.attendanceStatus === "AUSENTE"
    ).length;
    const late = items.filter(
      (item) => item.attendanceStatus === "TARDANZA"
    ).length;
    const justified = items.filter((item) => item.justified).length;

    return { total, present, absent, late, justified };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 text-lg">
            Cargando Registros de Asistencia...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-xl max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
            <h3 className="font-semibold text-gray-900 mb-2">
              Error de conexión
            </h3>
            <p className="text-gray-600 mb-6 text-sm">{error}</p>
            <button
              onClick={fetchAttendances}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Reintentar conexión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-full mx-auto px-6 py-4 min-h-full">
        {/* Header */}
        <div className="mb-4">
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
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
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Control de Asistencia
                  </h1>
                  <p className="text-gray-600">
                    Sistema de registro y seguimiento de asistencia estudiantil
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/asistencias/nuevo")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Registrar Asistencia
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {stats.total}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-blue-600"
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
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">
                      Presentes
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {stats.present}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600"
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
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Ausentes</p>
                    <p className="text-2xl font-bold text-red-900">
                      {stats.absent}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm font-medium">
                      Tardanzas
                    </p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {stats.late}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">
                      Justificados
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {stats.justified}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-purple-600"
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
                </div>
              </div>
            </div>

            {/* Barra de filtros moderna y profesional - Estilo Psychology */}
            <div className="bg-white border border-gray-100 rounded-xl px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                {/* Barra de búsqueda con Autocomplete */}
                <div className="flex-1 relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
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
                    placeholder="Buscar por nombre"
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowSuggestions(false), 200)
                    }
                    className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  />

                  {/* Lista de sugerencias */}
                  {showSuggestions && getSuggestions().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {getSuggestions().map((name, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectSuggestion(name)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="text-gray-900">{name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Estado */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    const value = e.target.value as AttendanceStatus | "all";
                    setStatusFilter(value);
                    applyFilters(
                      items,
                      searchTerm,
                      value,
                      dateFilter,
                      institutionFilter,
                      classroomFilter,
                      justifiedFilter
                    );
                  }}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                >
                  <option value="all">Todos</option>
                  <option value="PRESENTE">Presente</option>
                  <option value="AUSENTE">Ausente</option>
                  <option value="TARDANZA">Tardanza</option>
                </select>

                {/* Fecha */}
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    applyFilters(
                      items,
                      searchTerm,
                      statusFilter,
                      e.target.value,
                      institutionFilter,
                      classroomFilter,
                      justifiedFilter
                    );
                  }}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                />

                {/* Botón Filtros avanzados - Ultra moderno */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                    showAdvancedFilters
                      ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-300 shadow-lg shadow-indigo-500/20"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
                  }`}
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
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  <span>Filtros Avanzados</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${
                      showAdvancedFilters ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Botón Limpiar - Modernizado */}
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearchTerm("");
                    setStatusFilter("all");
                    setDateFilter("");
                    setInstitutionFilter("");
                    setClassroomFilter("");
                    setJustifiedFilter("all");
                    applyFilters(items, "", "all", "", "", "", "all");
                  }}
                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Limpiar todos los filtros"
                >
                  <svg
                    className="h-5 w-5"
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

                {/* Botón Refresh - Modernizado */}
                <button
                  onClick={fetchAttendances}
                  className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="Actualizar datos"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>

                {/* Separador vertical modernizado */}
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

                {/* Botón Generar Reporte - Ultra moderno */}
                <button
                  onClick={() => {
                    alert("Función de generar reporte en desarrollo");
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-semibold rounded-lg shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200 transform hover:scale-105"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Generar Reporte
                </button>
              </div>

              {/* Filtros Avanzados - Desplegable con animación */}
              {showAdvancedFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Institución */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Institución
                      </label>
                      <select
                        value={institutionFilter}
                        onChange={(e) => {
                          setInstitutionFilter(e.target.value);
                          applyFilters(
                            items,
                            searchTerm,
                            statusFilter,
                            dateFilter,
                            e.target.value,
                            classroomFilter,
                            justifiedFilter
                          );
                        }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                      >
                        <option value="">Todas</option>
                        {getUniqueInstitutions().map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Aula */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Aula
                      </label>
                      <select
                        value={classroomFilter}
                        onChange={(e) => {
                          setClassroomFilter(e.target.value);
                          applyFilters(
                            items,
                            searchTerm,
                            statusFilter,
                            dateFilter,
                            institutionFilter,
                            e.target.value,
                            justifiedFilter
                          );
                        }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                      >
                        <option value="">Todas</option>
                        {getUniqueClassrooms().map((classroom) => (
                          <option key={classroom.id} value={classroom.id}>
                            {classroom.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Justificación */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Justificación
                      </label>
                      <select
                        value={justifiedFilter}
                        onChange={(e) => {
                          const value = e.target.value as "all" | "yes" | "no";
                          setJustifiedFilter(value);
                          applyFilters(
                            items,
                            searchTerm,
                            statusFilter,
                            dateFilter,
                            institutionFilter,
                            classroomFilter,
                            value
                          );
                        }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                      >
                        <option value="all">Todos</option>
                        <option value="yes">Justificados</option>
                        <option value="no">No justificados</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-100">
          <AttendanceList
            items={paginatedItems}
            onDelete={handleDelete}
            onJustify={handleJustify}
          />

          {/* Paginación */}
          {filteredItems.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando{" "}
                  <span className="font-semibold text-gray-900">
                    {startIndex + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-semibold text-gray-900">
                    {Math.min(endIndex, filteredItems.length)}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredItems.length}
                  </span>{" "}
                  registros
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Anterior
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
                      {currentPage}
                    </span>
                    <span className="text-sm text-gray-500">de</span>
                    <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
                      {totalPages}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                  >
                    Siguiente
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
