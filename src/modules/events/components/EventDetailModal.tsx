import type { EventResponse } from "../models/EventResponse";
import { X, Calendar, FileText, Flag, Repeat2, Zap, Building2, Clock } from 'lucide-react';
import { formatDate } from '../service/eventHelpers';

interface Props {
  event: EventResponse | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: Props) {
  if (!event) return null;

  // Verificar si el evento es del mismo día
  const isSameDay = event.startDate === event.endDate;
  
  // Extraer información de horario de la descripción si existe
  const timeMatch = event.description?.match(/⏰ (.*?)(?:\n|$)/);
  const timeInfo = timeMatch ? timeMatch[1] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/40 backdrop-blur-sm transition-all"
    >
      <div
        className="bg-white w-full max-w-2xl mx-4 rounded-3xl shadow-2xl p-0 
                   animate-fadeIn scale-100 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight break-words">
              {event.title}
            </h2>
            <p className="text-teal-100 text-xs sm:text-sm mt-1">Detalles del evento escolar</p>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/20 transition-all p-2 rounded-lg flex-shrink-0"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {event.institutionName && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
              <div className="flex gap-3 items-start">
                <Building2 className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                <div className="w-full">
                  <p className="text-xs uppercase tracking-widest font-bold text-blue-700 mb-2">Institución</p>
                  <p className="text-gray-900 font-bold text-lg">{event.institutionName}</p>
                </div>
              </div>
            </div>
          )}

          {event.description && (
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-2xl border border-teal-100">
              <div className="flex gap-3 items-start">
                <FileText className="text-teal-600 flex-shrink-0 mt-1" size={20} />
                <div className="w-full">
                  <p className="text-xs uppercase tracking-widest font-bold text-teal-700 mb-2">Descripción</p>
                  <p className="text-gray-700 leading-relaxed text-base">{event.description}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 sm:p-6 rounded-2xl border border-cyan-100">
              <div className="flex gap-3 items-start">
                <Calendar className="text-cyan-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-cyan-700 mb-2">Inicio</p>
                  <p className="font-semibold text-gray-900 text-lg">{formatDate(event.startDate)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 sm:p-6 rounded-2xl border border-orange-100">
              <div className="flex gap-3 items-start">
                <Calendar className="text-orange-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-orange-700 mb-2">Término</p>
                  <p className="font-semibold text-gray-900 text-lg">{formatDate(event.endDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mostrar horario si el evento es del mismo día */}
          {isSameDay && timeInfo && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200">
              <div className="flex gap-3 items-center">
                <Clock className="text-blue-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-blue-700 mb-2">Horario</p>
                  <p className="font-bold text-gray-900 text-lg">{timeInfo}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
            <p className="text-xs uppercase tracking-widest font-bold text-blue-700 mb-3">Tipo de evento</p>
            <p className="text-gray-900 font-semibold text-base">{event.eventType || "Sin especificar"}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 sm:p-5 rounded-2xl border border-red-100">
              <div className="flex gap-3 items-center">
                <Flag className={`flex-shrink-0 ${event.isHoliday ? 'text-red-600' : 'text-gray-400'}`} size={18} />
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-red-700">Feriado</p>
                  <p className={`font-semibold mt-1 ${event.isHoliday ? 'text-red-900' : 'text-gray-500'}`}>
                    {event.isHoliday ? "Sí" : "No"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-100">
              <div className="flex gap-3 items-center">
                <Repeat2 className={`flex-shrink-0 ${event.isRecurring ? 'text-purple-600' : 'text-gray-400'}`} size={18} />
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-purple-700">Recurrente</p>
                  <p className={`font-semibold mt-1 ${event.isRecurring ? 'text-purple-900' : 'text-gray-500'}`}>
                    {event.isRecurring ? "Sí" : "No"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {event.affectsClasses && (
            <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 p-6 rounded-2xl border-2 border-orange-200">
              <div className="flex gap-3 items-center">
                <Zap className="text-orange-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-orange-700">Impacto importante</p>
                  <p className="font-semibold text-orange-900 mt-1">Este evento afecta las clases</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50 border-t border-gray-200 gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-800 rounded-xl 
                       hover:bg-gray-300 transition-all font-semibold text-sm sm:text-base"
          >
            Cancelar
          </button>
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl 
                       hover:from-teal-700 hover:to-teal-600 transition-all font-semibold shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
