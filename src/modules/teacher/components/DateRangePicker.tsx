import React, { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export const createDateFromString = (dateString: string): Date => {
     const [year, month, day] = dateString.split('-').map(Number);
     return new Date(year, month - 1, day);
};

export const isWeekday = (dateString: string): boolean => {
     if (!dateString) return true;
     const date = createDateFromString(dateString);
     const day = date.getDay();
     return day >= 1 && day <= 5;
};

export const getNextWeekday = (date: Date): Date => {
     const nextDay = new Date(date);
     nextDay.setDate(date.getDate() + 1);
     while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
          nextDay.setDate(nextDay.getDate() + 1);
     }
     return nextDay;
};

export const formatDate = (date: Date): string => {
     const year = date.getFullYear();
     const month = (date.getMonth() + 1).toString().padStart(2, '0');
     const day = date.getDate().toString().padStart(2, '0');
     return `${year}-${month}-${day}`;
};

export const isDateAfter = (startDate: string, endDate: string): boolean => {
     if (!startDate || !endDate) return true;
     return createDateFromString(endDate) >= createDateFromString(startDate);
};

export const getDaysInMonth = (year: number, month: number): Date[] => {
     const daysInMonth = new Date(year, month + 1, 0).getDate();
     const firstDayOfMonth = new Date(year, month, 1).getDay();
     const days: Date[] = [];

     const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
     for (let i = 0; i < startDay; i++) {
          days.push(new Date(year, month, -startDay + i + 1));
     }

     for (let day = 1; day <= daysInMonth; day++) {
          days.push(new Date(year, month, day));
     }

     return days;
};

// Función para formatear fecha para mostrar
export const formatDisplayDate = (date: string): string => {
     if (!date) return 'dd/mm/aaaa';
     const d = createDateFromString(date);
     return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

// Componente DateRangePicker personalizado
interface DateRangePickerProps {
     startDate: string;
     endDate: string;
     onChange: (startDate: string, endDate: string) => void;
     error?: string;
     className?: string;
     label: string;
     required?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
     startDate,
     endDate,
     onChange,
     error,
     className = '',
     label,
     required = false
}) => {
     const [isOpen, setIsOpen] = useState(false);
     const [viewDate, setViewDate] = useState(startDate ? createDateFromString(startDate) : new Date());
     const [selectingStart, setSelectingStart] = useState(!startDate);
     const [hoverDate, setHoverDate] = useState<Date | null>(null);
     const containerRef = useRef<HTMLDivElement>(null);

     const months = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
     ];

     const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

     useEffect(() => {
          setSelectingStart(!startDate);
     }, [startDate]);

     useEffect(() => {
          const handleClickOutside = (event: MouseEvent) => {
               if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
               }
          };

          if (isOpen) {
               document.addEventListener('mousedown', handleClickOutside);
          }

          return () => {
               document.removeEventListener('mousedown', handleClickOutside);
          };
     }, [isOpen]);

     const handleDateSelect = (date: Date) => {
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isBeforeToday = date < new Date(new Date().setHours(0, 0, 0, 0));

          if (isWeekend || isBeforeToday) return;

          const formattedDate = formatDate(date);

          if (selectingStart || !startDate) {
               onChange(formattedDate, '');
               setSelectingStart(false);
          } else {
               if (formattedDate >= startDate) {
                    onChange(startDate, formattedDate);
                    setIsOpen(false);
                    setSelectingStart(true);
               } else {
                    onChange(formattedDate, '');
                    setSelectingStart(false);
               }
          }
     };

     const navigateMonth = (direction: 'prev' | 'next') => {
          const newDate = new Date(viewDate);
          if (direction === 'prev') {
               newDate.setMonth(newDate.getMonth() - 1);
          } else {
               newDate.setMonth(newDate.getMonth() + 1);
          }
          setViewDate(newDate);
     };

     const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
     const today = new Date();

     return (
          <div className="relative" ref={containerRef}>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
               </label>
               <div className="relative">
                    <input
                         type="text"
                         value={startDate && endDate ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}` :
                              startDate ? `${formatDisplayDate(startDate)} - Seleccione fecha fin` :
                                   'Seleccione rango de fechas'}
                         placeholder="Seleccione rango de fechas"
                         onClick={() => setIsOpen(!isOpen)}
                         readOnly
                         className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 cursor-pointer ${error
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-indigo-500'
                              } ${className}`}
                    />
                    <Calendar
                         className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
                    />
               </div>

               {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
               )}

               {isOpen && (
                    <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 w-72">
                         <div className="flex items-center justify-between mb-4">
                              <button
                                   type="button"
                                   onClick={() => navigateMonth('prev')}
                                   className="p-1 hover:bg-gray-100 rounded"
                              >
                                   <ChevronLeft className="h-4 w-4" />
                              </button>

                              <h3 className="text-sm font-medium text-gray-900">
                                   {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                              </h3>

                              <button
                                   type="button"
                                   onClick={() => navigateMonth('next')}
                                   className="p-1 hover:bg-gray-100 rounded"
                              >
                                   <ChevronRight className="h-4 w-4" />
                              </button>
                         </div>

                         <div className="grid grid-cols-7 gap-1 mb-2">
                              {weekDays.map(day => (
                                   <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                                        {day}
                                   </div>
                              ))}
                         </div>

                         <div className="grid grid-cols-7 gap-1">
                              {days.map((date, index) => {
                                   const isCurrentMonth = date.getMonth() === viewDate.getMonth();
                                   const isToday = false;
                                   const dateString = formatDate(date);
                                   const isStartDate = startDate && dateString === startDate;
                                   const isEndDate = endDate && dateString === endDate;
                                   const isInRange = startDate && endDate && dateString >= startDate && dateString <= endDate;
                                   const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                   const isBeforeToday = date < new Date(new Date().setHours(0, 0, 0, 0));
                                   const isDisabled = isWeekend || isBeforeToday;

                                   const isInPreviewRange = startDate && !endDate && !selectingStart && hoverDate &&
                                        date >= createDateFromString(startDate) && date <= hoverDate;

                                   return (
                                        <button
                                             key={index}
                                             type="button"
                                             onClick={() => handleDateSelect(date)}
                                             onMouseEnter={() => !isDisabled && setHoverDate(date)}
                                             onMouseLeave={() => setHoverDate(null)}
                                             disabled={isDisabled}
                                             className={`
                                                  w-8 h-8 text-sm rounded transition-colors relative
                                                  ${!isCurrentMonth ? 'text-gray-300' : ''}
                                                  ${isStartDate || isEndDate ? 'bg-indigo-600 text-white' : ''}
                                                  ${isInRange && !isStartDate && !isEndDate ? 'bg-indigo-100 text-indigo-600' : ''}
                                                  ${isInPreviewRange && !isStartDate ? 'bg-indigo-50 text-indigo-500' : ''}

                                                  ${isWeekend && isCurrentMonth ? 'text-red-400 bg-red-50' : ''}
                                                  ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100'}
                                                  ${!isDisabled && !isStartDate && !isEndDate && !isInRange && isCurrentMonth ? 'text-gray-900' : ''}
                                             `}
                                        >
                                             {date.getDate()}
                                        </button>
                                   );
                              })}
                         </div>

                         <div className="mt-3 text-xs text-gray-500 space-y-1">
                              <div className="mb-2 text-center text-sm font-medium text-gray-700">
                                   {!startDate ? 'Seleccione fecha de inicio' :
                                        !endDate ? 'Seleccione fecha de fin' :
                                             'Rango de fechas seleccionado'}
                              </div>
                              <div className="flex items-center gap-2">
                                   <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
                                   <span>Fines de semana (no disponibles)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                   <div className="w-3 h-3 bg-indigo-600 rounded"></div>
                                   <span>Fechas seleccionadas</span>
                              </div>
                              <div className="flex items-center gap-2">
                                   <div className="w-3 h-3 bg-indigo-100 border border-indigo-200 rounded"></div>
                                   <span>Rango seleccionado</span>
                              </div>
                         </div>
                    </div>
               )}
          </div>
     );
};
