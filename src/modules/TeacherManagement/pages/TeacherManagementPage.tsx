/**
 * Página: TeacherManagementPage
 * Página principal del módulo de Gestión de Profesores
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TeacherList } from "../../teacher/components/TeacherList";
import type { Teacher } from "../../teacher/models/teacher.model";

export function TeacherManagementPage() {
     const navigate = useNavigate();
     const [items, setItems] = useState<Teacher[]>([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          const fetchItems = async () => {
               try {
                    // Datos de ejemplo
                    setItems([
                         {
                              id: "1",
                              name: "Prof. Roberto García",
                              description: "Especialista en Matemáticas",
                              status: "active",
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                         },
                         {
                              id: "2",
                              name: "Prof. Laura Martínez",
                              description: "Especialista en Ciencias Naturales",
                              status: "active",
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                         },
                    ]);
               } catch (error) {
                    console.error("Error al cargar datos:", error);
               } finally {
                    setLoading(false);
               }
          };

          fetchItems();
     }, []);

     const handleDelete = async (id: string) => {
          try {
               setItems(items.filter((item) => item.id !== id));
          } catch (error) {
               console.error("Error al eliminar:", error);
          }
     };

     if (loading) {
          return (
               <div className="flex justify-center items-center h-64">
                    <div className="text-gray-600">Cargando...</div>
               </div>
          );
     }

     return (
          <div className="max-w-7xl mx-auto">
               <div className="mb-6 flex justify-between items-center">
                    <div>
                         <h1 className="text-3xl font-bold text-gray-900">
                              Gestión de Profesores
                         </h1>
                         <p className="mt-2 text-sm text-gray-600">
                              Gestión de profesores y asignaciones
                         </p>
                    </div>
                    <button
                         onClick={() => navigate("/cursos/nuevo")}
                         className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                         Nuevo Profesor
                    </button>
               </div>

               <TeacherList items={items} onDelete={handleDelete} />
          </div>
     );
}
