import { X, Calendar, Tag, FileText, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { EventCalendar } from '../models/EventCalendar';
import type { Calendar as CalendarType } from '../models/Calendar';
import type { EventResponse } from '../models/EventResponse';
import { EventService } from '../service/EventService';
import { InstitutionService } from '../service/InstitutionService';
import { formatDate, sortEventsByDate } from '../service/eventHelpers';

interface CalendarEventsModalProps {
  calendar: CalendarType | null;
  events: EventCalendar[];
  onClose: () => void;
  loading?: boolean;
}

export function CalendarEventsModal({
  calendar,
  events,
  onClose,
  loading = false,
}: CalendarEventsModalProps) {

  const [eventDetails, setEventDetails] = useState<Record<number, EventResponse>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [institutionName, setInstitutionName] = useState<string>('Cargando...');

  useEffect(() => {
    if (!events.length) return;

    const fetchEventDetails = async () => {
      setLoadingDetails(true);
      try {
        const details: Record<number, EventResponse> = {};
        await Promise.all(events.map(async (eventCal) => {
          try {
            const event = await EventService.getEventById(eventCal.eventId);
            details[eventCal.eventId] = event;
          } catch (error) {
            console.error(`Error fetching event ${eventCal.eventId}:`, error);
          }
        }));
        setEventDetails(details);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchEventDetails();
  }, [events]);

  useEffect(() => {
    const fetchInstitution = async () => {
      if (!calendar?.institutionId) return;

      try {
        const inst = await InstitutionService.getInstitutionById(calendar.institutionId);
        setInstitutionName(inst.institutionInformation?.institutionName || 'Sin nombre');
      } catch (error) {
        console.error('Error al obtener institución:', error);
        setInstitutionName('Error al cargar nombre');
      }
    };

    fetchInstitution();
  }, [calendar?.institutionId]);

  if (!calendar) return null;

  // Filtramos los eventos para que solo queden los ACTIVE
  const activeEventsFiltered = events.filter(ev => eventDetails[ev.eventId]?.status === 'ACTIVE');
  
  // Convertimos a EventResponse[] para ordenar
  const activeEventsData = activeEventsFiltered
    .map(ev => eventDetails[ev.eventId])
    .filter(Boolean) as EventResponse[];
  
  // Ordenamos por fecha (más próximos primero)
  const activeEvents = sortEventsByDate(activeEventsData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white to-orange-50/30 shadow-2xl rounded-3xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto animate-[modalShow_.28s_ease] border border-green-100">

        {/* HEADER */}
        <div className="relative bg-gradient-to-r from-teal-600 to-teal-500 px-8 py-8 rounded-t-3xl border-b-2 border-teal-400/30">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-teal-700/20 transition"
          >
            <X size={24} className="text-white" />
          </button>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar size={28} className="text-white" />
              <h2 className="text-3xl font-bold text-white">
                Eventos {calendar.academicYear}
              </h2>
            </div>
            <p className="text-teal-50 text-base mt-3">
              {institutionName}
            </p>
          </div>
        </div>

        {/* BODY */}
        <div className="p-8">
          {loading || loadingDetails ? (
            <div className="text-center py-16">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 text-lg mt-4">Cargando eventos...</p>
            </div>
          ) : activeEvents.length === 0 ? (
            <div className="text-center py-16">
              <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-lg">
                No hay eventos activos asignados a este calendario.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {activeEvents.map((event) => {
                // Buscamos el eventCalendar correspondiente para obtener el ID
                const eventCal = events.find(ec => ec.eventId === event.eventId);
                if (!eventCal) return null;

                return (
                  <div
                    key={eventCal.eventCalendarId}
                    className="group bg-white border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-teal-200 transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Tipo de evento como header */}
                      <div className="flex items-start justify-between mb-4">
                        <span className="px-4 py-2 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 inline-flex items-center gap-2">
                          <Tag size={16} />
                          {event.eventType || 'Evento'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700">
                          {event.status}
                        </span>
                      </div>

                      {/* Título principal */}
                      <h3 className="text-2xl font-bold text-gray-900 mb-5 group-hover:text-teal-700 transition">
                        {event.title || 'Sin título'}
                      </h3>

                      {/* Grid con fechas */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5 pb-5 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <Clock size={20} className="text-teal-600 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Inicia</p>
                            <p className="text-base font-semibold text-gray-800">{formatDate(event.startDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock size={20} className="text-orange-600 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Finaliza</p>
                            <p className="text-base font-semibold text-gray-800">{formatDate(event.endDate)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Descripción */}
                      {event.description && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <FileText size={18} className="text-teal-600" />
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Descripción</p>
                          </div>
                          <p className="text-gray-700 leading-relaxed text-base ml-7">
                            {event.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 p-8 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-orange-50/20 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Cerrar
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes modalShow {
            0% { opacity: 0; transform: translateY(20px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}
      </style>
    </div>
  );
}
