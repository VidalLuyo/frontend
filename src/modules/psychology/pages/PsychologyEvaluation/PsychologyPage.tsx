import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PsychologyList } from "../../components/PsychologyList";
import { psychologyService } from "../../service/Psychology.service";
import type {
  PsychologicalEvaluation,
  EvaluationType,
} from "../../models/psychology.model";
import {
  showSuccessAlert,
  showErrorAlert,
  showDeleteConfirm,
  showRestoreConfirm,
} from "../../../../shared/utils/sweetAlert";

type FilterType = "all" | "active" | "inactive";

export function PsychologyPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PsychologicalEvaluation[]>([]);
  const [filteredItems, setFilteredItems] = useState<PsychologicalEvaluation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<EvaluationType | "all">("all");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [evaluatorFilter, setEvaluatorFilter] = useState("");
  const [statusFilter] = useState<"all" | "pending" | "completed">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Función para obtener evaluadores únicos
  const getUniqueEvaluators = useCallback(() => {
    const evaluators = items
      .filter((item) => item.evaluatedByName)
      .map((item) => item.evaluatedByName!)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return evaluators;
  }, [items]);

  // Función para obtener nombres únicos de estudiantes
  const getUniqueStudentNames = useCallback(() => {
    const names = items
      .filter((item) => item.studentName)
      .map((item) => item.studentName!)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return names;
  }, [items]);

  // Función para filtrar sugerencias
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);

      if (value.length > 0) {
        const allNames = getUniqueStudentNames();
        const filtered = allNames
          .filter((name) => name.toLowerCase().includes(value.toLowerCase()))
          .slice(0, 5); // Máximo 5 sugerencias

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [getUniqueStudentNames]
  );

  const applyFilters = useCallback(
    (
      data: PsychologicalEvaluation[],
      search: string,
      type: EvaluationType | "all",
      fromDate?: string,
      toDate?: string,
      evaluator?: string,
      status?: "all" | "pending" | "completed"
    ) => {
      let filtered = data;

      // Filtro por nombre del estudiante
      if (search) {
        filtered = filtered.filter(
          (item) =>
            item.studentName?.toLowerCase().includes(search.toLowerCase()) ||
            item.studentId.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Filtro por tipo de evaluación
      if (type !== "all") {
        filtered = filtered.filter((item) => item.evaluationType === type);
      }

      // Filtro por fecha desde
      if (fromDate) {
        filtered = filtered.filter((item) => {
          // Parsear fechas como locales para evitar problemas de zona horaria
          const [itemYear, itemMonth, itemDay] = item.evaluationDate.split("-").map(Number);
          const [filterYear, filterMonth, filterDay] = fromDate.split("-").map(Number);
          const itemDate = new Date(itemYear, itemMonth - 1, itemDay);
          const filterDate = new Date(filterYear, filterMonth - 1, filterDay);
          return itemDate >= filterDate;
        });
      }

      // Filtro por fecha hasta
      if (toDate) {
        filtered = filtered.filter((item) => {
          // Parsear fechas como locales para evitar problemas de zona horaria
          const [itemYear, itemMonth, itemDay] = item.evaluationDate.split("-").map(Number);
          const [filterYear, filterMonth, filterDay] = toDate.split("-").map(Number);
          const itemDate = new Date(itemYear, itemMonth - 1, itemDay);
          const filterDate = new Date(filterYear, filterMonth - 1, filterDay);
          return itemDate <= filterDate;
        });
      }

      // Filtro por evaluador
      if (evaluator) {
        filtered = filtered.filter((item) =>
          item.evaluatedByName?.toLowerCase().includes(evaluator.toLowerCase())
        );
      }

      // Filtro por estado (si existe en el modelo)
      if (status !== "all") {
        // Aquí puedes agregar lógica según tu modelo de datos
        // filtered = filtered.filter((item) => item.status === status);
      }

      setFilteredItems(filtered);
    },
    []
  );

  const handleSearch = useCallback(() => {
    setAppliedSearchTerm(searchTerm);
    applyFilters(
      items,
      searchTerm,
      typeFilter,
      dateFrom,
      dateTo,
      evaluatorFilter,
      statusFilter
    );
  }, [
    searchTerm,
    items,
    typeFilter,
    dateFrom,
    dateTo,
    evaluatorFilter,
    statusFilter,
    applyFilters,
  ]);

  const fetchEvaluations = useCallback(
    async (filterType?: FilterType) => {
      try {
        setLoading(true);
        setError(null);
        let evaluations: PsychologicalEvaluation[];

        const currentFilter = filterType || filter;
        switch (currentFilter) {
          case "active":
            evaluations = await psychologyService.getActiveEvaluations();
            break;
          case "inactive":
            evaluations = await psychologyService.getInactiveEvaluations();
            break;
          default:
            evaluations = await psychologyService.getAllEvaluations();
        }

        setItems(evaluations);
        applyFilters(
          evaluations,
          appliedSearchTerm,
          typeFilter,
          dateFrom,
          dateTo,
          evaluatorFilter,
          statusFilter
        );
      } catch {
        setError(
          "No se pudo conectar con el servidor. Verifique que esté ejecutándose en el puerto 9090."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      filter,
      appliedSearchTerm,
      typeFilter,
      dateFrom,
      dateTo,
      evaluatorFilter,
      statusFilter,
      applyFilters,
    ]
  );

  // Cargar datos solo una vez al montar el componente
  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]); // Solo se ejecuta una vez

  // Aplicar filtros cuando cambien los datos o filtros aplicados
  useEffect(() => {
    applyFilters(
      items,
      appliedSearchTerm,
      typeFilter,
      dateFrom,
      dateTo,
      evaluatorFilter,
      statusFilter
    );
  }, [
    items,
    appliedSearchTerm,
    typeFilter,
    dateFrom,
    dateTo,
    evaluatorFilter,
    statusFilter,
    applyFilters,
  ]);

  const handleFilterChange = useCallback(
    async (newFilter: FilterType) => {
      setFilter(newFilter);

      try {
        setLoading(true);
        setError(null);
        let evaluations: PsychologicalEvaluation[];

        switch (newFilter) {
          case "active":
            evaluations = await psychologyService.getActiveEvaluations();
            break;
          case "inactive":
            evaluations = await psychologyService.getInactiveEvaluations();
            break;
          default:
            evaluations = await psychologyService.getAllEvaluations();
        }

        setItems(evaluations);
        applyFilters(
          evaluations,
          appliedSearchTerm,
          typeFilter,
          dateFrom,
          dateTo,
          evaluatorFilter,
          statusFilter
        );
      } catch {
        setError("Error al cargar las evaluaciones");
      } finally {
        setLoading(false);
      }
    },
    [
      appliedSearchTerm,
      typeFilter,
      dateFrom,
      dateTo,
      evaluatorFilter,
      statusFilter,
      applyFilters,
    ]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await showDeleteConfirm("evaluación psicológica");

      if (result.isConfirmed) {
        try {
          await psychologyService.deactivateEvaluation(id);
          // Recargar la lista completa desde el servidor
          await fetchEvaluations();
          showSuccessAlert(
            "Evaluación desactivada",
            "La evaluación ha sido desactivada correctamente"
          );
        } catch {
          showErrorAlert("Error", "No se pudo desactivar la evaluación");
        }
      }
    },
    [fetchEvaluations]
  );

  const handleReactivate = useCallback(
    async (id: string) => {
      const result = await showRestoreConfirm("evaluación psicológica");

      if (result.isConfirmed) {
        try {
          await psychologyService.reactivateEvaluation(id);
          // Recargar la lista completa desde el servidor
          await fetchEvaluations();
          showSuccessAlert(
            "Evaluación reactivada",
            "La evaluación ha sido reactivada correctamente"
          );
        } catch {
          showErrorAlert("Error", "No se pudo reactivar la evaluación");
        }
      }
    },
    [fetchEvaluations]
  );

  const getStats = () => {
    const total = items.length;
    const active = items.filter((item) => item.status === "ACTIVE").length;
    const inactive = total - active;
    const requiresFollowUp = items.filter(
      (item) => item.requiresFollowUp
    ).length;

    return { total, active, inactive, requiresFollowUp };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 text-lg">
            Cargando Evaluaciones Psicologicas...
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
              onClick={() => handleFilterChange(filter)}
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
        {/* Header compacto y profesional */}
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Evaluaciones Psicológicas
                  </h1>
                  <p className="text-gray-600">
                    Sistema integral de gestión psicológica estudiantil
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/psychology/new")}
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
                Nueva Evaluación
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-4">
              <nav className="flex space-x-8">
                <Link
                  to="/psychology"
                  className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                >
                  Evaluaciones Psicológicas
                </Link>
                <Link
                  to="/psychology/supports"
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                >
                  Área de Soporte Especial
                </Link>
              </nav>
            </div>

            {/* Stats compactos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">
                      Activas
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {stats.active}
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
                    <p className="text-red-600 text-sm font-medium">
                      Inactivas
                    </p>
                    <p className="text-2xl font-bold text-red-900">
                      {stats.inactive}
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
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">
                      Seguimiento
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      {stats.requiresFollowUp}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-orange-600"
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
            </div>

            {/* Barra de filtros moderna y profesional */}
            <div className="bg-white border border-gray-100 rounded-xl px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                {/* Toggle Activas - Modernizado */}
                <div className="flex items-center gap-3">
                  <div
                    onClick={() =>
                      handleFilterChange(
                        filter === "active" ? "inactive" : "active"
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-all duration-300 ease-in-out ${
                      filter === "active"
                        ? "bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/25"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 ease-in-out shadow-md ${
                        filter === "active"
                          ? "translate-x-5 shadow-lg"
                          : "translate-x-0.5"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    Activas
                  </span>
                </div>

                {/* Botón Todos - Modernizado */}
                <button
                  onClick={() => handleFilterChange("all")}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                    filter === "all"
                      ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-300 shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
                  }`}
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
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  <span>Todos</span>
                </button>

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
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    onFocus={() =>
                      searchTerm.length > 0 &&
                      suggestions.length > 0 &&
                      setShowSuggestions(true)
                    }
                    onBlur={() =>
                      setTimeout(() => setShowSuggestions(false), 200)
                    }
                    className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  />

                  {/* Lista de sugerencias */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setSearchTerm(suggestion);
                            setShowSuggestions(false);
                          }}
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
                            <span className="text-gray-900">{suggestion}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botón Buscar - Modernizado */}
                <button
                  onClick={handleSearch}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-105"
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Buscar
                </button>

                {/* Botón Limpiar - Modernizado */}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setAppliedSearchTerm("");
                    setDateFrom("");
                    setDateTo("");
                    setEvaluatorFilter("");
                    setTypeFilter("all");
                    setShowAdvancedFilters(false);
                    applyFilters(items, "", "all", "", "", "", statusFilter);
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
                  onClick={() => handleFilterChange(filter)}
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

                {/* Botón Filtros avanzados - Ultra moderno */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                    showAdvancedFilters
                      ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-300 shadow-lg shadow-indigo-500/20"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-md"
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
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    />
                  </svg>
                  <span>Filtros avanzados</span>
                  <svg
                    className={`w-4 h-4 transition-all duration-300 ${
                      showAdvancedFilters
                        ? "rotate-180 text-indigo-600"
                        : "text-gray-400"
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
              </div>
            </div>

            {/* Filtros avanzados con animación */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                showAdvancedFilters
                  ? "max-h-96 opacity-100 mt-3"
                  : "max-h-0 opacity-0 mt-0"
              }`}
            >
              <div className="bg-white border border-gray-100 rounded-lg px-6 py-5 shadow-sm transform transition-all duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Fecha desde */}
                  <div className="transform transition-all duration-300 delay-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha desde
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>

                  {/* Fecha hasta */}
                  <div className="transform transition-all duration-300 delay-150">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha hasta
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>

                  {/* Evaluador */}
                  <div className="transform transition-all duration-300 delay-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evaluador
                    </label>
                    <select
                      value={evaluatorFilter}
                      onChange={(e) => setEvaluatorFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                    >
                      <option value="">Todos los evaluadores</option>
                      {getUniqueEvaluators().map((evaluator) => (
                        <option key={evaluator} value={evaluator}>
                          {evaluator}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de evaluación */}
                  <div className="transform transition-all duration-300 delay-250">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de evaluación
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) =>
                        setTypeFilter(e.target.value as EvaluationType | "all")
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                    >
                      <option value="all">Todos los tipos</option>
                      <option value="INICIAL">Inicial</option>
                      <option value="SEGUIMIENTO">Seguimiento</option>
                      <option value="ESPECIAL">Especial</option>
                      <option value="DERIVACION">Derivación</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista ocupando todo el espacio */}
        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Resultados ({filteredItems.length})
              </h2>
              {filteredItems.length !== items.length && (
                <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                  Mostrando {filteredItems.length} de {items.length}
                </span>
              )}
            </div>
          </div>

          <PsychologyList
            items={filteredItems}
            onDelete={handleDelete}
            onReactivate={handleReactivate}
            showInactive={filter === "inactive"}
          />
        </div>
      </div>
    </div>
  );
}
