import { useState, useEffect } from 'react';
import { X, Calendar, Type, FileText, Tag, AlertCircle } from 'lucide-react';
import type { EventResponse } from '../models/EventResponse';
import type { EventCreateRequest } from '../models/EventCreateRequest';
import { InstitutionService } from '../service/InstitutionService';
import type { InstitutionMinimal } from '../models/InstitutionMinimal';

interface EventFormModalProps {
  event: EventResponse | null;
  onClose: () => void;
  onSubmit: (data: EventCreateRequest) => void;
  loading?: boolean;
}

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: 'ACADEMICO', label: 'Académico' },
  { value: 'DEPORTIVO', label: 'Deportivo' },
  { value: 'CEREMONIAL', label: 'Ceremonial' },
  { value: 'FIESTAS_PATRIAS', label: 'Fiestas Patrias' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'INCIDENTE', label: 'Incidente' },
];

export function EventFormModal({
  event,
  onClose,
  onSubmit,
  loading = false,
}: EventFormModalProps) {
  const [formData, setFormData] = useState<Partial<EventCreateRequest>>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    eventType: '',
    isHoliday: false,
    isRecurring: false,
    isNational: false,
    affectsClasses: false,
    institutionId: '',
  });

  const [institutions, setInstitutions] = useState<InstitutionMinimal[]>([]);
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  // Verificar si las fechas son iguales
  const isSameDay = formData.startDate && formData.endDate && formData.startDate === formData.endDate;

  // Cargar instituciones
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

  // Si editamos un evento
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description ?? '',
        startDate: event.startDate,
        endDate: event.endDate,
        eventType: event.eventType ?? '',
        isHoliday: event.isHoliday ?? false,
        isRecurring: event.isRecurring ?? false,
        isNational: event.isNational ?? false,
        affectsClasses: event.affectsClasses ?? false,
        institutionId: event.institutionId ?? '',
      });
    }
  }, [event]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, type } = e.target;
    const fieldName = name as keyof EventCreateRequest;

    let value: string | boolean = '';

    if (type === 'checkbox') {
      value = (e.target as HTMLInputElement).checked;
    } else {
      value = (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si es el mismo día, agregar info de horario a la descripción
    let finalData = { ...formData } as EventCreateRequest;
    
    if (isSameDay && !isAllDay) {
      const timeInfo = `\n\n⏰ Horario: ${startTime} - ${endTime}`;
      finalData.description = (finalData.description || '') + timeInfo;
    } else if (isSameDay && isAllDay) {
      const timeInfo = `\n\n⏰ Todo el día`;
      finalData.description = (finalData.description || '') + timeInfo;
    }
    
    onSubmit(finalData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/40">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-[fadeInScale_.25s_ease-out]">
        <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {event ? 'Editar Evento' : 'Crear Evento'}
            </h2>
            <p className="text-teal-100 text-sm mt-1">Completa los datos del evento escolar</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/20 transition-all p-2 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Título */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              <Type size={16} className="text-teal-600" />
              Título del evento
            </label>
            <input
              type="text"
              name="title"
              value={formData.title ?? ''}
              onChange={handleChange}
              required
              placeholder="Ej: Día de la Familia"
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              <FileText size={16} className="text-teal-600" />
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description ?? ''}
              onChange={handleChange}
              rows={4}
              placeholder="Describe los detalles del evento..."
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                <Calendar size={16} className="text-cyan-600" />
                Fecha inicio
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate ?? ''}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                <Calendar size={16} className="text-orange-600" />
                Fecha fin
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate ?? ''}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Campos de hora cuando las fechas son iguales */}
          {isSameDay && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-blue-200">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <p className="text-sm font-bold text-blue-900">⏰ El evento es en el mismo día</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  id="isAllDay"
                />
                <label htmlFor="isAllDay" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Evento de todo el día
                </label>
              </div>

              {!isAllDay && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                      Hora inicio
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                      Hora fin
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition-all bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tipo de evento */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              <Tag size={16} className="text-blue-600" />
              Tipo de evento
            </label>
            <select
              name="eventType"
              value={formData.eventType ?? ''}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">Selecciona un tipo de evento</option>
              {EVENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Institución */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Institución
            </label>
            <select
              name="institutionId"
              value={formData.institutionId ?? ''}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">Selecciona una institución</option>
              {institutions.map(inst => (
                <option key={inst.institutionId} value={inst.institutionId}>
                  {inst.institutionInformation.institutionName}
                </option>
              ))}
            </select>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <AlertCircle size={18} className="text-blue-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-gray-700">Opciones adicionales</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  ['isHoliday', '¿Es Feriado?'],
                  ['isRecurring', '¿Es Recurrente?'],
                  ['isNational', '¿Es Nacional?'],
                  ['affectsClasses', '¿Afecta Clases?'],
                ] as Array<[keyof EventCreateRequest, string]>
              ).map(([name, label]) => (
                <label key={name} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name={name}
                    checked={Boolean(formData[name])}
                    onChange={handleChange}
                    className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-teal-700 transition">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-700 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg"
            >
              {loading ? 'Guardando...' : 'Guardar Evento'}
            </button>
          </div>
        </form>
      </div>

      {/* Animación */}
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
