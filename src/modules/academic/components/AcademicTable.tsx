import type { CatalogRegistration, UUID } from "../models/catalog";
import { Eye, Edit3, Trash2, RotateCcw } from "lucide-react";

interface Props {
  data: CatalogRegistration[];
  onViewDetails: (item: CatalogRegistration) => void;
  onEdit: (item: CatalogRegistration) => void;
  onDelete: (id: UUID, name: string) => Promise<void>;
  onRestore: (id: UUID, name: string) => Promise<void>;
}

export default function AcademicTable({
  data,
  onViewDetails,
  onEdit,
  onDelete,
  onRestore,
}: Props) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
      <table className="min-w-full text-sm text-gray-700">
        <thead className="bg-white text-gray-700 uppercase text-xs font-semibold border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left">Código</th>
            <th className="px-4 py-3 text-left">Nombre</th>
            <th className="px-4 py-3 text-left">Área</th>
            <th className="px-4 py-3 text-left">Nivel</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item) => {
            const c = item.course;
            const nivel = ["3 años", "4 años", "5 años"].includes(c.ageLevel)
              ? c.ageLevel
              : c.ageLevel || "—";

            return (
              <tr key={c.id ?? c.code} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">{c.code}</td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{c.areaCurricular}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                    {nivel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      c.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {c.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onViewDetails(item)}
                      className="inline-flex items-center px-2 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                    </button>

                    {c.active ? (
                      <button
                        onClick={() => onEdit(item)}
                        className="inline-flex items-center px-2 py-1 border border-indigo-300 rounded-md text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
                        title="Editar curso"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                      </button>
                    ) : (
                      <div
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-500 bg-gray-100 cursor-not-allowed"
                        title="Curso inactivo - No editable"
                      >
                        <Edit3 className="h-4 w-4 mr-1 opacity-50" />
                      </div>
                    )}

                    {c.active ? (
                      <button
                        onClick={() => c.id && onDelete(c.id, c.name)}
                        className="inline-flex items-center px-2 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors duration-200"
                        title="Eliminar curso"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                      </button>
                    ) : (
                      <button
                        onClick={() => c.id && onRestore(c.id, c.name)}
                        className="inline-flex items-center px-2 py-1 border border-green-300 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors duration-200"
                        title="Restaurar curso"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                Sin registros
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
