import { useState, useMemo } from 'react';
import { X, Search, Calendar as CalendarIcon } from 'lucide-react';
import type { Calendar } from '../models/Calendar';
import type { EventResponse } from '../models/EventResponse';
import type { EventCalendar } from '../models/EventCalendar';
import { formatDate } from '../service/eventHelpers';

interface AssignEventModalProps {
  calendar: Calendar | null;
  events: EventResponse[];
  assignedEvents: EventCalendar[]; // Eventos ya asignados al calendario
  onClose: () => void;
  onSubmit: (calendarId: number, eventId: number) => void;
  loading?: boolean;
}

export function AssignEventModal({
  calendar,
  events,
  assignedEvents,
  onClose,
  onSubmit,
  loading = false,
}: AssignEventModalProps) {
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar eventos que NO estén ya asignados Y que pertenezcan a la misma institución
  const availableEvents = useMemo(() => {
    if (!calendar) return [];
    const assignedEventIds = new Set(assignedEvents.map(ae => ae.eventId));
    return events.filter(event => 
      !assignedEventIds.has(event.eventId) && 
      event.institutionId === calendar.institutionId
    );
  }, [events, assignedEvents, calendar]);

  // Filtrar por búsqueda
  const filteredEvents = useMemo(() => {
    if (!searchTerm) return availableEvents;
    return availableEvents.filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableEvents, searchTerm]);

  const handleSubmit = () => {
    if (!calendar || !selectedEventId) return;

    const selectedEvent = availableEvents.find(e => e.eventId === Number(selectedEventId));
    if (!selectedEvent) return;

    // Validación de institución
    if (selectedEvent.institutionId !== calendar.institutionId) {
      setError('El evento no pertenece a la institución de este calendario.');
      return;
    }

    // Si pasa la validación
    onSubmit(calendar.calendarId, Number(selectedEventId));
    setSelectedEventId('');
    setError('');
  };

  if (!calendar) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-[fadeInScale_.25s_ease-out]">
        <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500">
          <div>
            <h2 className="text-2xl font-bold text-white">Asignar Evento</h2>
            <p className="text-orange-100 text-sm mt-1">Vincula un evento al calendario</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/20 transition-all p-2 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-200">
            <label className="block text-xs font-bold text-orange-700 uppercase tracking-widest mb-2">
              📅 Calendario seleccionado
            </label>
            <p className="text-xl font-bold text-gray-900">{calendar.academicYear}</p>
          </div>

          {/* Contador de eventos disponibles */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2">
              <CalendarIcon size={18} className="text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} disponible{filteredEvents.length !== 1 ? 's' : ''}
              </span>
            </div>
            {assignedEvents.length > 0 && (
              <span className="text-xs text-blue-600 font-medium">
                ({assignedEvents.length} ya asignado{assignedEvents.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>

          {/* Buscador */}
          {availableEvents.length > 5 && (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar evento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Seleccionar Evento <span className="text-red-500">*</span>
            </label>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <p className="text-gray-500 font-medium">
                  {availableEvents.length === 0 
                    ? '✅ Todos los eventos ya están asignados' 
                    : 'No hay eventos que coincidan con tu búsqueda'}
                </p>
              </div>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all bg-white shadow-sm"
              >
                <option value="">-- Selecciona un evento --</option>
                {filteredEvents.map((event) => (
                  <option key={event.eventId} value={event.eventId}>
                    {event.title} ({formatDate(event.startDate)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm font-semibold">⚠️ {error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-8 py-6 bg-gradient-to-r from-gray-50 to-orange-50/20 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedEventId || filteredEvents.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {loading ? 'Asignando...' : 'Asignar Evento'}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
}
