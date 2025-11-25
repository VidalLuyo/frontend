import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type {
  AttendanceRecord,
  AttendanceStatus,
} from "../models/attendance.model";
import { getStatusColor, getStatusLabel } from "../models/attendance.model";

interface AttendanceListProps {
  readonly items: AttendanceRecord[];
  readonly onDelete?: (id: string) => void;
  readonly onJustify?: (id: string) => void;
}

type SortField =
  | "studentName"
  | "attendanceStatus"
  | "attendanceDate"
  | "classroomName"
  | "arrivalTime";
type SortDirection = "asc" | "desc";

export function AttendanceList({
  items,
  onDelete,
  onJustify,
}: AttendanceListProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>("attendanceDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const handleView = (id: string) => navigate(`/asistencias/${id}`);
  const handleEdit = (id: string) => navigate(`/asistencias/${id}/editar`);

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

  const handleJustify = (id: string) => {
    onJustify?.(id);
  };

  const getStudentName = (item: AttendanceRecord) => {
    return item.studentName || "Nombre no disponible";
  };

  const getClassroomName = (item: AttendanceRecord) => {
    return item.classroomName || "Aula no disponible";
  };

  const formatDate = (date: string) => {
    if (!date) return "No especificada";
    const [year, month, day] = date.split("-").map(Number);
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return `${day.toString().padStart(2, "0")} de ${
      months[month - 1]
    } del ${year}`;
  };

  const formatTime = (time?: string) => {
    if (!time) return "-";
    const [hours, minutes] = time.substring(0, 5).split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const sortedItems = [...items].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case "studentName":
        aValue = getStudentName(a).toLowerCase();
        bValue = getStudentName(b).toLowerCase();
        break;
      case "attendanceStatus":
        aValue = a.attendanceStatus;
        bValue = b.attendanceStatus;
        break;
      case "attendanceDate": {
        const [aYear, aMonth, aDay] = a.attendanceDate.split("-").map(Number);
        const [bYear, bMonth, bDay] = b.attendanceDate.split("-").map(Number);
        aValue = new Date(aYear, aMonth - 1, aDay).getTime();
        bValue = new Date(bYear, bMonth - 1, bDay).getTime();
        break;
      }
      case "classroomName":
        aValue = getClassroomName(a).toLowerCase();
        bValue = getClassroomName(b).toLowerCase();
        break;
      case "arrivalTime":
        aValue = a.arrivalTime || "";
        bValue = b.arrivalTime || "";
        break;
      default:
        aValue = "";
        bValue = "";
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

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

  const getStatusBadgeClass = (status: AttendanceStatus) => {
    const colorMap: Record<string, string> = {
      success: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800",
      info: "bg-blue-100 text-blue-800",
      default: "bg-gray-100 text-gray-800",
    };
    const color = getStatusColor(status);
    return colorMap[color] || colorMap.default;
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay registros de asistencia
        </h3>
        <p className="text-gray-600 mb-6">
          Comienza registrando la primera asistencia del día.
        </p>
        <button
          onClick={() => navigate("/asistencias/nuevo")}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          Registrar asistencia
        </button>
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
              onClick={() => handleSort("attendanceDate")}
            >
              <div className="flex items-center gap-2">
                <span>Fecha</span>
                <SortIcon field="attendanceDate" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleSort("attendanceStatus")}
            >
              <div className="flex items-center gap-2">
                <span>Estado</span>
                <SortIcon field="attendanceStatus" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleSort("arrivalTime")}
            >
              <div className="flex items-center gap-2">
                <span>Hora Llegada</span>
                <SortIcon field="arrivalTime" />
              </div>
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium">
              Hora Salida
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium">
              Institución
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
            <th className="px-4 py-3 text-left text-sm font-medium">
              Justificado
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
                <div className="text-sm text-gray-900">
                  {formatDate(item.attendanceDate)}
                </div>
              </td>

              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeClass(
                    item.attendanceStatus
                  )}`}
                >
                  {getStatusLabel(item.attendanceStatus)}
                </span>
              </td>

              <td className="px-4 py-3">
                <div className="text-sm text-gray-700">
                  {formatTime(item.arrivalTime)}
                </div>
              </td>

              <td className="px-4 py-3">
                <div className="text-sm text-gray-700">
                  {formatTime(item.departureTime)}
                </div>
              </td>

              <td className="px-4 py-3">
                <div className="text-sm text-gray-700">
                  {item.institutionName || "No disponible"}
                </div>
              </td>

              <td className="px-4 py-3">
                <div className="text-sm text-gray-700">
                  {getClassroomName(item)}
                </div>
              </td>

              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    item.justified
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item.justified ? "Sí" : "No"}
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

                  <button
                    onClick={() => handleEdit(item.id)}
                    className="inline-flex items-center px-2 py-1 border border-indigo-300 rounded-md text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
                    title="Editar asistencia"
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

                  {!item.justified &&
                    (item.attendanceStatus === "AUSENTE" ||
                      item.attendanceStatus === "TARDANZA") && (
                      <button
                        onClick={() => handleJustify(item.id)}
                        className="inline-flex items-center px-2 py-1 border border-yellow-300 rounded-md text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors duration-200"
                        title="Justificar"
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </button>
                    )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center px-2 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors duration-200"
                    title="Eliminar asistencia"
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación */}
      {totalItems > itemsPerPage && (
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
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
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

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
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
