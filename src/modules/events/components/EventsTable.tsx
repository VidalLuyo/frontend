import { Trash2, Eye, Edit2, RotateCcw } from 'lucide-react';
import type { EventResponse } from '../models/EventResponse';
import { formatDate } from '../service/eventHelpers';

interface EventsTableProps {
  events: EventResponse[];
  onView: (event: EventResponse) => void;
  onEdit: (event: EventResponse) => void;
  onDelete: (eventId: number) => void;
  onRestore?: (eventId: number) => void;
  isInactive?: boolean;
  loading?: boolean;
}

export function EventsTable({
  events,
  onView,
  onEdit,
  onDelete,
  onRestore,
  isInactive = false,
  loading = false,
}: EventsTableProps) {
  if (loading) {
    return <div className="text-center py-8 text-gray-600 font-medium">Cargando eventos...</div>;
  }

  if (events.length === 0) {
    return <div className="text-center py-8 text-gray-400">No hay eventos</div>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl shadow-lg border border-teal-100/50">
      <table className="w-full min-w-[800px]">
        <thead className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-bold text-white tracking-wide uppercase">Título</th>
            <th className="px-6 py-4 text-left text-sm font-bold text-white tracking-wide uppercase">Descripción</th>
            <th className="px-6 py-4 text-left text-sm font-bold text-white tracking-wide uppercase">Inicio</th>
            <th className="px-6 py-4 text-left text-sm font-bold text-white tracking-wide uppercase">Fin</th>
            <th className="px-6 py-4 text-left text-sm font-bold text-white tracking-wide uppercase">Tipo</th>
            <th className="px-6 py-4 text-center text-sm font-bold text-white tracking-wide uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-teal-50 bg-white">
          {events.map((event) => (
            <tr key={event.eventId} className="hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-cyan-50/30 transition-all duration-200 group">
              <td className="px-6 py-4">
                <span className="text-sm font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
                  {event.title}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600 line-clamp-2">
                  {event.description || <span className="text-gray-400 italic">Sin descripción</span>}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-gray-700">{formatDate(event.startDate)}</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-gray-700">{formatDate(event.endDate)}</span>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 rounded-full text-xs font-bold tracking-wide border border-teal-200 shadow-sm">
                  {event.eventType || '-'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => onView(event)}
                    className="p-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all shadow-sm hover:shadow-md hover:scale-110 active:scale-95"
                    title="Ver detalles"
                  >
                    <Eye size={16} />
                  </button>
                  {!isInactive && (
                    <button
                      onClick={() => onEdit(event)}
                      className="p-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all shadow-sm hover:shadow-md hover:scale-110 active:scale-95"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  
                  {isInactive && onRestore ? (
                    <button
                      onClick={() => onRestore(event.eventId)}
                      className="p-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all shadow-sm hover:shadow-md hover:scale-110 active:scale-95"
                      title="Restaurar evento"
                    >
                      <RotateCcw size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => onDelete(event.eventId)}
                      className="p-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm hover:shadow-md hover:scale-110 active:scale-95"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
