import type React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  Users,
  BookOpen,
  Calendar,
  FileText,
  ClipboardCheck,
  Menu,
  Shield,
  GraduationCap,
  Brain,
  UserCircle,
  UserPlus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
     {
          id: "institution",
          label: "Institución",
          icon: <Building2 size={20} />,
          path: "/institucion",
     },
     {
          id: "users",
          label: "Usuarios",
          icon: <UserCircle size={20} />,
          path: "/usuarios",
     },
     {
          id: "students",
          label: "Estudiantes",
          icon: <Users size={20} />,
          path: "/estudiantes",
     },
     {
          id: "enrollments",
          label: "Matrículas",
          icon: <UserPlus size={20} />,
          path: "/matriculas",
     },
     {
          id: "academic",
          label: "Gestión Académica",
          icon: <BookOpen size={20} />,
          path: "/gestion-academica",
     },
     {
          id: "TeacherManagement",
          label: "Gestion de Profesores",
          icon: <GraduationCap size={20} />,
          path: "/asignaciones",
     },
     {
          id: "events",
          label: "Eventos",
          icon: <Calendar size={20} />,
          path: "/eventos",
     },
     {
          id: "grades",
          label: "Notas",
          icon: <FileText size={20} />,
          path: "/notas",
     },
     {
          id: "attendance",
          label: "Asistencias",
          icon: <ClipboardCheck size={20} />,
          path: "/asistencias",
     },
     {
          id: "behavior",
          label: "Comportamiento",
          icon: <Shield size={20} />,
          path: "/comportamiento",
     },
     {
          id: "psychology",
          label: "Psicología",
          icon: <Brain size={20} />,
          path: "/psychology",
          children: [
               {
                    id: "psychology-evaluations",
                    label: "Evaluaciones",
                    icon: <Brain size={16} />,
                    path: "/psychology",
               },
               {
                    id: "psychology-support",
                    label: "Área de Soporte Especial",
                    icon: <Brain size={16} />,
                    path: "/psychology/supports",
               },
          ],
     },
];

export function Sidebar() {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const isMenuOpen = (menuId: string) => {
    return openMenus[menuId] || false;
  };

  const isMenuItemActive = (item: MenuItem) => {
    if (item.children) {
      return item.children.some((child) => location.pathname === child.path);
    }
    return location.pathname === item.path;
  };

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
            S
          </div>
          <div>
            <h1 className="font-bold text-lg">SIGEI</h1>
            <p className="text-xs text-slate-400">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <nav className="flex-1 p-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 px-3 py-2 text-slate-400 text-sm font-medium">
            <Menu size={16} />
            <span>Menú Principal</span>
          </div>
        </div>

        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = isMenuItemActive(item);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <li key={item.id}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                      {isMenuOpen(item.id) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    {isMenuOpen(item.id) && item.children && (
                      <ul className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => {
                          const isChildActive =
                            location.pathname === child.path;
                          return (
                            <li key={child.id}>
                              <Link
                                to={child.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                  isChildActive
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                              >
                                {child.icon}
                                <span className="text-sm font-medium">
                                  {child.label}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
