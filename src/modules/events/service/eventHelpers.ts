import type { EventResponse } from '../models/EventResponse';

/**
 * Formatea una fecha ISO (YYYY-MM-DD) al formato DD-MMM-YYYY
 * Ejemplo: "2005-12-21" -> "21-dic-2005"
 */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '-';

  try {
    // Parsear la fecha manualmente para evitar problemas de zona horaria
    const [year, month, day] = isoDate.split('-').map(Number);
    
    // Verificar si los valores son válidos
    if (!year || !month || !day) return isoDate;

    const monthsES = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun',
      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
    ];
    
    const monthName = monthsES[month - 1]; // month es 1-12, array es 0-11
    
    if (!monthName) return isoDate;
    
    return `${day.toString().padStart(2, '0')}-${monthName}-${year}`;
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return isoDate;
  }
}

/**
 * Ordena eventos priorizando los eventos futuros más cercanos
 * 1. Primero: eventos futuros ordenados por cercanía a hoy
 * 2. Después: eventos pasados ordenados por fecha descendente
 */
export function sortEventsByDate(events: EventResponse[]): EventResponse[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Inicio del día actual
  
  // Separar eventos futuros y pasados
  const futureEvents: EventResponse[] = [];
  const pastEvents: EventResponse[] = [];
  
  events.forEach(event => {
    const eventDate = new Date(event.startDate);
    eventDate.setHours(0, 0, 0, 0);
    
    if (eventDate >= now) {
      futureEvents.push(event);
    } else {
      pastEvents.push(event);
    }
  });
  
  // Ordenar eventos futuros: más cercanos primero (ascendente)
  futureEvents.sort((a, b) => {
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    return dateA - dateB;
  });
  
  // Ordenar eventos pasados: más recientes primero (descendente)
  pastEvents.sort((a, b) => {
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    return dateB - dateA;
  });
  
  // Retornar: primero futuros, luego pasados
  return [...futureEvents, ...pastEvents];
}
