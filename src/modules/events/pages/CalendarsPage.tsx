'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { CalendarsTable } from '../components/CalendarsTable';
import { CalendarEventsModal } from '../components/CalendarEventsModal';
import { AssignEventModal } from '../components/AssignEventModal';
import { CalendarFormModal } from '../components/CalendarFormModal'; // <-- Importamos el modal
import { calendarService } from '../service/CalendarService';
import { eventCalendarService } from '../service/EventCalendarService';
import { EventService as eventService } from '../service/EventService';
import { InstitutionService } from '../service/InstitutionService';
import type { Calendar } from '../models/Calendar';
import type { EventCalendar } from '../models/EventCalendar';
import type { EventResponse } from '../models/EventResponse';
import type { InstitutionMinimal } from '../models/InstitutionMinimal';

export function CalendarsPage() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [activeEvents, setActiveEvents] = useState<EventResponse[]>([]);
  const [calendarEventsModal, setCalendarEventsModal] = useState<Calendar | null>(null);
  const [assignModal, setAssignModal] = useState<Calendar | null>(null);
  const [calendarEventsList, setCalendarEventsList] = useState<EventCalendar[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [institutions, setInstitutions] = useState<InstitutionMinimal[]>([]);
  const [showCalendarForm, setShowCalendarForm] = useState(false);

  async function loadCalendars() {
    setLoading(true);
    try {
      const data = await calendarService.getAll();
      setCalendars(data);
    } catch (error) {
      toast.error('Error al cargar calendarios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadActiveEvents() {
    try {
      const data = await eventService.listActiveEvents();
      setActiveEvents(data);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  }

  async function loadInstitutions() {
    try {
      const data = await InstitutionService.listAll();
      setInstitutions(data);
    } catch (error) {
      console.error('Error al cargar instituciones:', error);
    }
  }

  async function loadCalendarEvents(calendarId: number) {
    setLoading(true);
    try {
      const data = await eventCalendarService.getByCalendarId(calendarId);
      setCalendarEventsList(data);
    } catch (error) {
      toast.error('Error al cargar eventos del calendario');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCalendars();
    loadActiveEvents();
    loadInstitutions();
  }, []);

  const handleViewCalendarEvents = async (calendar: Calendar) => {
    setCalendarEventsModal(calendar);
    await loadCalendarEvents(calendar.calendarId);
  };

  const handleAssignEvent = async (calendar: Calendar) => {
    setAssignModal(calendar);
    await loadCalendarEvents(calendar.calendarId);
  };

  const handleSubmitAssignEvent = async (calendarId: number, eventId: number) => {
    setSubmitting(true);
    try {
      await eventCalendarService.assignEventsToCalendar(calendarId, [eventId]);
      toast.success('Evento asignado al calendario');
      // Recargar eventos del calendario para actualizar la lista
      await loadCalendarEvents(calendarId);
      setAssignModal(null);
      if (calendarEventsModal) await loadCalendarEvents(calendarEventsModal.calendarId);
    } catch (error) {
      toast.error('Error al asignar evento');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const getInstitutionName = (institutionId: string | number | undefined) => {
    if (!institutionId) return 'Sin institución';
    const inst = institutions.find(i => i.institutionId === String(institutionId));
    return inst?.institutionInformation?.institutionName || inst?.institutionName || 'Sin institución';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4 sm:p-6 space-y-6 sm:space-y-8">
      <section className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-teal-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Calendarios</h1>
            <p className="text-gray-600 font-medium text-sm sm:text-base">Gestiona los calendarios académicos</p>
          </div>
          <div className="flex gap-2 flex-wrap w-full lg:w-auto">
            <button
              onClick={() => setShowCalendarForm(true)}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Nuevo Calendario</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
            <a
              href="/eventos"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Volver a Eventos</span>
              <span className="sm:hidden">Volver</span>
            </a>
          </div>
        </div>

        <CalendarsTable
          calendars={calendars}
          onViewEvents={handleViewCalendarEvents}
          onAssignEvent={handleAssignEvent}
          loading={loading}
          getInstitutionName={getInstitutionName}
        />
      </section>

      <CalendarEventsModal
        calendar={calendarEventsModal}
        events={calendarEventsList}
        onClose={() => setCalendarEventsModal(null)}
        loading={loading}
      />

      <AssignEventModal
        calendar={assignModal}
        events={activeEvents}
        assignedEvents={calendarEventsList}
        onClose={() => setAssignModal(null)}
        onSubmit={handleSubmitAssignEvent}
        loading={submitting}
      />

      {/* --- Nuevo: CalendarFormModal --- */}
      {showCalendarForm && (
        <CalendarFormModal
          isOpen={showCalendarForm}
          institutions={institutions}
          onClose={() => setShowCalendarForm(false)}
          onSaved={(savedCalendar) => {  // ahora sí lo usamos
            toast.success('Calendario creado correctamente');
            setCalendars(prev => [...prev, savedCalendar]); // agregamos el nuevo calendario a la lista
            setShowCalendarForm(false);
          }}
        />
      )}
    </div>
  );
}
