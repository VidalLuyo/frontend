import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { PsychologicalEvaluation } from "../models/psychology.model";

interface PsychologyListProps {
  readonly items: PsychologicalEvaluation[];
  readonly onDelete?: (id: string) => void;
  readonly onReactivate?: (id: string) => void;
  readonly showInactive?: boolean;
}

type SortField =
  | "studentName"
  | "evaluationType"
  | "evaluationDate"
  | "classroomName"
  | "evaluatedByName"
  | "status";
type SortDirection = "asc" | "desc";

export function PsychologyList({
  items,
  onDelete,
  onReactivate,
  showInactive = false,
}: PsychologyListProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>("evaluationDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Resetear página cuando cambien los items
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const handleView = (id: string) => navigate(`/psychology/${id}`);
  const handleEdit = (id: string) => navigate(`/psychology/${id}/edit`);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = (id: string) => {
    onDelete?.(id);
  };

  const handleReactivate = (id: string) => {
    onReactivate?.(id);
  };

  const getStudentName = (item: PsychologicalEvaluation) => {
    return item.studentName || `Estudiante ${item.studentId.substring(0, 8)}`;
  };

  const getClassroomName = (item: PsychologicalEvaluation) => {
    return item.classroomName || `Aula ${item.classroomId.substring(0, 8)}`;
  };

  const getEvaluatorName = (item: PsychologicalEvaluation) => {
    return (
      item.evaluatedByName || `Evaluador ${item.evaluatedBy.substring(0, 8)}`
    );
  };

  const getTypeLabel = (type: string) => {
    const types = {
      INICIAL: "Inicial",
      SEGUIMIENTO: "Seguimiento",
      ESPECIAL: "Especial",
      DERIVACION: "Derivación",
    };
    return types[type as keyof typeof types] || type;
  };

  const formatDate = (date: string) => {
    if (!date) return "No especificada";

    // Método directo - usar solo los números de la fecha
    const [year, month, day] = date.split("-").map(Number);
    
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const dayNumber = day.toString().padStart(2, "0");
    const monthName = months[month - 1]; // month - 1 porque el array empieza en 0
    const yearNumber = year;

    return `${dayNumber} de ${monthName} del ${yearNumber}`;
  };

  const sortedItems = [...items].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case "studentName":
        aValue = getStudentName(a).toLowerCase();
        bValue = getStudentName(b).toLowerCase();
        break;
      case "evaluationType":
        aValue = a.evaluationType;
        bValue = b.evaluationType;
        break;
      case "evaluationDate": {
        // Parsear como fecha local para evitar problemas de zona horaria
        const [aYear, aMonth, aDay] = a.evaluationDate.split("-").map(Number);
        const [bYear, bMonth, bDay] = b.evaluationDate.split("-").map(Number);
        aValue = new Date(aYear, aMonth - 1, aDay).getTime();
        bValue = new Date(bYear, bMonth - 1, bDay).getTime();
        break;
      }
      case "classroomName":
        aValue = getClassroomName(a).toLowerCase();
        bValue = getClassroomName(b).toLowerCase();
        break;
      case "evaluatedByName":
        aValue = getEvaluatorName(a).toLowerCase();
        bValue = getEvaluatorName(b).toLowerCase();
        break;
      case "status":
        aValue = a.status || "";
        bValue = b.status || "";
        break;
      default:
        aValue = "";
        bValue = "";
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Lógica de paginación
  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
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
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return sortDirection === "asc" ? (
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
          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
        />
      </svg>
    ) : (
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
          d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
        />
      </svg>
    );
  };

  if (items.length === 0) {
    return (
      <div className="p-12 text-center">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {showInactive
            ? "No hay evaluaciones inactivas"
            : "No hay evaluaciones"}
        </h3>
        <p className="text-gray-600 mb-6">
          {showInactive
            ? "Todas las evaluaciones están activas actualmente."
            : "Comienza creando tu primera evaluación psicológica."}
        </p>
        {!showInactive && (
          <button
            onClick={() => navigate("/psychology/new")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Crear primera evaluación
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th
              className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleSort("studentName")}
            >
              <div className="flex items-center gap-2">
                <span>Estudiante</span>
                <SortIcon field="studentName" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleSort("evaluationType")}
            >
              <div className="flex items-center gap-2">
                <span>Tipo</span>
                <SortIcon field="evaluationType" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleSort("evaluationDate")}
            >
              <div className="flex items-center gap-2">
                <span>Fecha</span>
                <SortIcon field="evaluationDate" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleSort("classroomName")}
            >
              <div className="flex items-center gap-2">
                <span>Aula</span>
                <SortIcon field="classroomName" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleSort("evaluatedByName")}
            >
              <div className="flex items-center gap-2">
                <span>Evaluador</span>
                <SortIcon field="evaluatedByName" />
              </div>
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium">
              Seguimiento
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center gap-2">
                <span>Estado</span>
                <SortIcon field="status" />
              </div>
            </th>
            <th className="px-4 py-3 text-center text-sm font-medium">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedItems.map((item, index) => (
            <tr
              key={item.id}
              className={`hover:bg-blue-50 transition-colors ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }`}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">
                  {getStudentName(item)}
                </div>
                <div className="text-sm text-gray-500">
                  Año {item.academicYear}
                </div>
              </td>

              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    item.evaluationType === "INICIAL"
                      ? "bg-blue-100 text-blue-800"
                      : item.evaluationType === "SEGUIMIENTO"
                      ? "bg-green-100 text-green-800"
                      : item.evaluationType === "ESPECIAL"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {getTypeLabel(item.evaluationType)}
                </span>
              </td>

              <td className="px-4 py-3">
                <div className="text-sm text-gray-900">
                  {formatDate(item.evaluationDate)}
                </div>
              </td>

              <td className="px-4 py-3">
                <div className="text-sm text-gray-700">
                  {getClassroomName(item)}
                </div>
              </td>

              <td className="px-4 py-3">
                <div className="text-sm text-gray-700">
                  {getEvaluatorName(item)}
                </div>
              </td>

              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    item.requiresFollowUp
                      ? "bg-orange-100 text-orange-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item.requiresFollowUp ? "Sí" : "No"}
                </span>
              </td>

              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    item.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.status === "ACTIVE" ? "Activa" : "Inactiva"}
                </span>
              </td>

              <td className="px-4 py-3">
                <div className="flex justify-center gap-1">
                  <button
                    onClick={() => handleView(item.id)}
                    className="inline-flex items-center px-2 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                    title="Ver detalles"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
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
                  </button>

                  {item.status === "ACTIVE" && (
                    <>
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="inline-flex items-center px-2 py-1 border border-indigo-300 rounded-md text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
                        title="Editar evaluación"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center px-2 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors duration-200"
                        title="Eliminar evaluación"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
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
                    </>
                  )}

                  {item.status === "INACTIVE" && onReactivate && (
                    <button
                      onClick={() => handleReactivate(item.id)}
                      className="inline-flex items-center px-2 py-1 border border-green-300 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors duration-200"
                      title="Restaurar evaluación"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
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
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación */}
      {totalItems > 5 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{startIndex + 1}</span>{" "}
                a{" "}
                <span className="font-medium">
                  {Math.min(endIndex, totalItems)}
                </span>{" "}
                de <span className="font-medium">{totalItems}</span> registros
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Paginación"
              >
                {/* Botón Anterior */}
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Anterior</span>
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Números de página */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Mostrar solo algunas páginas alrededor de la actual
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 3 ||
                      page === currentPage + 3
                    ) {
                      return (
                        <span
                          key={page}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                )}

                {/* Botón Siguiente */}
                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Siguiente</span>
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
