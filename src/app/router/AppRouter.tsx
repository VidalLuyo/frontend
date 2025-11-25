import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../../shared/components/layout/DashboardLayout/DashboardLayout";
import { LoginPage } from "../../modules/auth/pages/LoginPage";

// Importar todas las rutas modulares
import { studentRoutes } from "../../modules/student/routes/student.routes";
import { institutionRoutes } from "../../modules/institution/routes/institution.routes";
import { academicRoutes } from "../../modules/academic/routes/academic.routes";
import { eventsRoutes } from "../../modules/events/routes/events.routes";
import { gradesRoutes } from "../../modules/grades/routes/grades.routes";
import { attendanceRoutes } from "../../modules/attendance/routes/attendance.routes";
import { behaviorRoutes } from "../../modules/behavior/routes/behavior.routes";
import { teacherRoutes } from "../../modules/teacher/routes/teacher.routes";
import { psychologyRoutes } from "../../modules/psychology/routes/psychology.routes";
import { usersRoutes } from "../../modules/users/routes/users.routes";
import { enrollmentsRoutes } from "../../modules/enrollments/routes/enrollments.routes";

export function AppRouter() {
     return (
          <BrowserRouter>
               <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route
                         path="/"
                         element={<Navigate to="/login" replace />}
                    />

                    {/* Protected routes - Inside DashboardLayout */}
                    <Route path="/" element={<DashboardLayout />}>
                         {/* ✅ Todas las rutas modulares CRUD */}
                         {studentRoutes}
                         {institutionRoutes}
                         {usersRoutes}
                         {enrollmentsRoutes}
                         {academicRoutes}
                         {eventsRoutes}
                         {gradesRoutes}
                         {attendanceRoutes}
                         {behaviorRoutes}
                         {teacherRoutes}
                         {psychologyRoutes}
                    </Route>
               </Routes>
          </BrowserRouter>
     );
}
