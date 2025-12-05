import { Eye, LinkIcon, CalendarIcon } from 'lucide-react';
import type { Calendar } from '../models/Calendar';
import { formatDate } from '../service/eventHelpers';

interface CalendarsTableProps {
  calendars: Calendar[];
  onViewEvents: (calendar: Calendar) => void;
  onAssignEvent: (calendar: Calendar) => void;
  loading?: boolean;
  getInstitutionName?: (id: string | number | undefined) => string; // <-- nuevo prop
}

export function CalendarsTable({
  calendars,
  onViewEvents,
  onAssignEvent,
  loading = false,
  getInstitutionName,
}: CalendarsTableProps) {
  if (loading) {
    return <div className="text-center py-8 text-gray-600 font-medium">Cargando calendarios...</div>;
  }

  if (calendars.length === 0) {
    return <div className="text-center py-12 text-gray-500">No hay calendarios disponibles</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {calendars.map((calendar) => (
        <div
          key={calendar.calendarId}
          className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-2xl hover:border-teal-300 transition-all duration-300 overflow-hidden group flex flex-col"
        >
          {/* Card Header */}
          <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-teal-600 px-6 py-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
            
            <div className="relative z-10 flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white font-bold text-lg border border-white/30">
                  {calendar.calendarId}
                </div>
                <CalendarIcon size={28} className="text-white/90" />
                {getInstitutionName && (
                  <span className="text-white font-semibold text-lg">
                    {getInstitutionName(calendar.institutionId)}
                  </span>
                )}
              </div>
            </div>
            <h3 className="text-white text-2xl font-bold tracking-tight">{calendar.academicYear}</h3>
          </div>

          {/* Card Content */}
          <div className="px-6 py-6 flex-1 flex flex-col justify-between space-y-6">
            {/* Date Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Inicio</p>
                <p className="text-base font-semibold text-gray-900">{formatDate(calendar.startDate)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Fin</p>
                <p className="text-base font-semibold text-gray-900">{formatDate(calendar.endDate)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => onViewEvents(calendar)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                title="Ver eventos del calendario"
              >
                <Eye size={18} />
                <span className="hidden sm:inline">Ver</span>
              </button>

              <button
                onClick={() => onAssignEvent(calendar)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                title="Asignar evento"
              >
                <LinkIcon size={18} />
                <span className="hidden sm:inline">Asignar</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
