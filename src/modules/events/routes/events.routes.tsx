import { Route } from 'react-router-dom';
import { EventsPage } from '../pages/EventsPage';
import { CalendarsPage } from '../pages/CalendarsPage';

export const eventsRoutes = (
  <>
    <Route path="eventos" element={<EventsPage />} />
    <Route path="calendars" element={<CalendarsPage />} />
  </>
);
