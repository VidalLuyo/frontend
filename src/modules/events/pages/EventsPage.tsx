'use client';

import { useState, useEffect } from 'react';
import { Plus, CalendarIcon } from 'lucide-react';
import { EventsTable } from '../components/EventsTable';
import { EventDetailModal } from '../components/EventDetailModal';
import { EventFormModal } from '../components/EventFormModal';
import { EventService as eventService } from '../service/EventService';
import { InstitutionService } from '../service/InstitutionService';
import type { EventResponse } from '../models/EventResponse';
import type { EventCreateRequest } from '../models/EventCreateRequest';
import type { InstitutionMinimal } from '../models/InstitutionMinimal';
import { sortEventsByDate } from '../service/eventHelpers';
import { usePagination } from '../../../shared/hooks/usePagination';
import { Pagination } from '../../../shared/components/Pagination';

// Importa tus Sweet Alerts
import {
  showSuccessAlert,
  showErrorAlert,
  showDeleteConfirm,
  showRestoreConfirm,
  showLoadingAlert,
  closeAlert
} from '../../../shared/utils/sweetAlert';

type FormModalState =
  | { mode: 'create' }
  | { mode: 'edit'; event: EventResponse }
  | null;

// --- Tipos de evento sugeridos ---
const EVENT_TYPES = [
  'ACADEMICO',
  'DEPORTIVO',
  'CEREMONIAL',
  'FIESTAS_PATRIAS',
  'SOCIAL',
  'INCIDENTE',
];

export function EventsPage() {
  const [activeEvents, setActiveEvents] = useState<EventResponse[]>([]);
  const [inactiveEvents, setInactiveEvents] = useState<EventResponse[]>([]);
  const [showActive, setShowActive] = useState(true);

  const [detailModal, setDetailModal] = useState<EventResponse | null>(null);
  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [loading, setLoading] = useState(false);

  // --- Filtros ---
  const [filterTitle, setFilterTitle] = useState('');
  const [filterInstitution, setFilterInstitution] = useState('');
  const [filterEventType, setFilterEventType] = useState('');

  // --- Lista de instituciones para el filtro ---
  const [institutions, setInstitutions] = useState<InstitutionMinimal[]>([]);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const data = await InstitutionService.listAll();
        setInstitutions(data);
      } catch (error) {
        console.error("Error cargando instituciones", error);
      }
    };
    fetchInstitutions();
  }, []);

  // --- Funciones de carga ---
  async function loadActiveEvents() {
    setLoading(true);
    try {
      const data = await eventService.listActiveEvents();
      setActiveEvents(data);
    } catch (error) {
      showErrorAlert('Error', 'Error al cargar eventos activos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadInactiveEvents() {
    setLoading(true);
    try {
      const data = await eventService.listInactiveEvents();
      setInactiveEvents(data);
    } catch (error) {
      showErrorAlert('Error', 'Error al cargar eventos inactivos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // --- useEffect principal ---
  useEffect(() => {
    loadActiveEvents();
  }, []);

  // --- Handlers ---
  const handleToggleStatus = () => {
    setShowActive(!showActive);
    if (!showActive) loadActiveEvents();
    else loadInactiveEvents();
  };

  const handleViewEvent = (event: EventResponse) => setDetailModal(event);
  const handleEditEvent = (event: EventResponse) => setFormModal({ mode: 'edit', event });
  const handleCreateEvent = () => setFormModal({ mode: 'create' });

  // --- Eliminar evento ---
  const handleDeleteEvent = async (eventId: number) => {
    const result = await showDeleteConfirm("el evento");
    if (!result.isConfirmed) return;

    try {
      showLoadingAlert("Eliminando evento...");
      await eventService.deleteEvent(eventId);
      closeAlert();
      showSuccessAlert("Evento eliminado", "El evento fue movido a los inactivos.");

      if (showActive) await loadActiveEvents();
      else await loadInactiveEvents();
    } catch (error) {
      closeAlert();
      showErrorAlert("Error al eliminar", "No se pudo eliminar el evento.");
      console.error(error);
    }
  };

  // --- Restaurar evento ---
  const handleRestoreEvent = async (eventId: number) => {
    const result = await showRestoreConfirm("el evento");
    if (!result.isConfirmed) return;

    try {
      showLoadingAlert("Restaurando evento...");
      await eventService.restoreEvent(eventId);
      closeAlert();
      showSuccessAlert("Evento restaurado", "El evento vuelve a estar activo.");
      await loadInactiveEvents();
    } catch (error) {
      closeAlert();
      showErrorAlert("Error al restaurar", "No se pudo restaurar el evento.");
      console.error(error);
    }
  };

  // --- Crear / Editar evento ---
  const handleSaveEvent = async (data: EventCreateRequest) => {
    try {
      showLoadingAlert(formModal?.mode === "create" ? "Creando evento..." : "Actualizando evento...");

      if (formModal?.mode === 'create') {
        await eventService.createEvent(data);
        closeAlert();
        showSuccessAlert("Evento creado", "El evento fue registrado correctamente.");
      } else if (formModal?.mode === 'edit') {
        await eventService.updateEvent(formModal.event.eventId, data);
        closeAlert();
        showSuccessAlert("Evento actualizado", "Los cambios fueron guardados exitosamente.");
      }

      setFormModal(null);

      if (showActive) await loadActiveEvents();
      else await loadInactiveEvents();
    } catch (error) {
      closeAlert();
      showErrorAlert("Error al guardar", "No se pudo guardar el evento.");
      console.error(error);
    }
  };

  const currentEvents = showActive ? activeEvents : inactiveEvents;

  // --- Eventos filtrados ---
  const filteredEvents = currentEvents.filter((ev) => {
    return (
      ev.title.toLowerCase().includes(filterTitle.toLowerCase()) &&
      (!filterInstitution || ev.institutionName?.toLowerCase() === filterInstitution.toLowerCase()) &&
      (!filterEventType || ev.eventType === filterEventType)
    );
  });

  // --- Eventos ordenados por fecha (más próximos primero) ---
  const sortedEvents = sortEventsByDate(filteredEvents);

  // --- Paginación ---
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    hasNext,
    hasPrevious,
    totalItems,
  } = usePagination({ data: sortedEvents, itemsPerPage: 10 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 space-y-6">
      {/* Sección de Eventos */}
      <section className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 border border-teal-100/50">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-8 gap-4 lg:gap-6">
          <div className="space-y-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Eventos
              </h1>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide shadow-sm ${
                showActive 
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200' 
                  : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200'
              }`}>
                {showActive ? '✓ Activos' : '⊗ Inactivos'}
              </span>
            </div>
            <p className="text-gray-600 font-medium text-sm sm:text-base lg:text-lg">Gestiona los eventos de tu institución</p>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap w-full lg:w-auto">
            {showActive && (
              <button
                onClick={handleCreateEvent}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold rounded-xl hover:from-teal-700 hover:to-teal-600 transition-all shadow-md hover:shadow-xl hover:scale-105 active:scale-95 text-sm sm:text-base flex-1 sm:flex-none"
              >
                <Plus size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Agregar Evento</span>
                <span className="sm:hidden">Agregar</span>
              </button>
            )}
            <button
              onClick={handleToggleStatus}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-500 text-white font-bold rounded-xl hover:from-gray-700 hover:to-gray-600 transition-all shadow-md hover:shadow-xl hover:scale-105 active:scale-95 text-sm sm:text-base flex-1 sm:flex-none"
            >
              Ver {showActive ? 'Inactivos' : 'Activos'}
            </button>
            <a
              href="/calendars"
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all shadow-md hover:shadow-xl hover:scale-105 active:scale-95 text-sm sm:text-base flex-1 sm:flex-none"
            >
              <CalendarIcon size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Ver Calendarios</span>
              <span className="sm:hidden">Calendarios</span>
            </a>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gradient-to-br from-gray-50 to-teal-50/30 rounded-2xl p-6 mb-8 border border-teal-100/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-teal-600 to-teal-400 rounded-full"></div>
            <h3 className="text-lg font-bold text-gray-800">Filtros de búsqueda</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Título del evento</label>
              <input
                type="text"
                placeholder="Buscar por título..."
                value={filterTitle}
                onChange={(e) => setFilterTitle(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-400 outline-none transition-all bg-white shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Institución</label>
              <select
                value={filterInstitution}
                onChange={(e) => setFilterInstitution(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-400 outline-none transition-all bg-white shadow-sm"
              >
                <option value="">Todas las instituciones</option>
                {institutions.map(inst => (
                  <option key={inst.institutionId} value={inst.institutionInformation.institutionName}>
                    {inst.institutionInformation.institutionName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Tipo de evento</label>
              <select
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-400 outline-none transition-all bg-white shadow-sm"
              >
                <option value="">Todos los tipos</option>
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <EventsTable
          events={paginatedData}
          onView={handleViewEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onRestore={handleRestoreEvent}
          isInactive={!showActive}
          loading={loading}
        />

        {/* Paginación - Siempre visible si hay eventos */}
        {!loading && totalItems > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              totalItems={totalItems}
              itemsPerPage={10}
            />
          </div>
        )}
      </section>

      {/* Modales */}
      <EventDetailModal
        event={detailModal}
        onClose={() => setDetailModal(null)}
      />

      {formModal && (
        <EventFormModal
          event={formModal.mode === 'edit' ? formModal.event : null}
          onClose={() => setFormModal(null)}
          onSubmit={handleSaveEvent}
        />
      )}
    </div>
  );
}
