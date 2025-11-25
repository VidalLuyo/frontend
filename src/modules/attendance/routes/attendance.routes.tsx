/**
 * Rutas del módulo Attendance
 * Define todas las rutas relacionadas con asistencias
 */

import { Route } from "react-router-dom";
import { AttendanceRecordsPage } from "../pages/Attendance_Records/AttendanceRecordsPage";
import { AttendanceRecordsCreatePage } from "../pages/Attendance_Records/AttendanceRecordsCreatePage";
import { AttendanceRecordsBulkCreatePage } from "../pages/Attendance_Records/AttendanceRecordsBulkCreatePage";
import { AttendanceRecordsDetailPage } from "../pages/Attendance_Records/AttendanceRecordsDetailPage";
import { AttendanceRecordsEditPage } from "../pages/Attendance_Records/AttendanceRecordsEditPage";
import { AttendanceRecordsJustifyPage } from "../pages/Attendance_Records/AttendanceRecordsJustifyPage";

export const attendanceRoutes = (
  <>
    <Route path="asistencias" element={<AttendanceRecordsPage />} />
    <Route path="asistencias/nuevo" element={<AttendanceRecordsCreatePage />} />
    <Route path="asistencias/nuevo/masivo" element={<AttendanceRecordsBulkCreatePage />} />
    <Route path="asistencias/:id" element={<AttendanceRecordsDetailPage />} />
    <Route path="asistencias/:id/editar" element={<AttendanceRecordsEditPage />} />
    <Route path="asistencias/:id/justificar" element={<AttendanceRecordsJustifyPage />} />
  </>
);
