/**
 * Página: BehaviorPage
 * Página principal del módulo de Comportamiento
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BehaviorList } from "../components/BehaviorList";
import type { Behavior } from "../models/behavior.model";

export function BehaviorPage() {
     const navigate = useNavigate();
     const [items, setItems] = useState<Behavior[]>([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          const fetchItems = async () => {
               try {
                    // Datos de ejemplo
                    setItems([
                         {
                              id: "1",
                              name: "Reporte Juan Pérez",
                              description:
                                   "Excelente comportamiento durante el mes",
                              status: "active",
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                         },
                         {
                              id: "2",
                              name: "Reporte María López",
                              description: "Participación activa en clase",
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
                              Comportamiento
                         </h1>
                         <p className="mt-2 text-sm text-gray-600">
                              Registro de conducta y disciplina
                         </p>
                    </div>
                    <button
                         onClick={() => navigate("/comportamiento/nuevo")}
                         className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                         Nuevo Registro
                    </button>
               </div>

               <BehaviorList items={items} onDelete={handleDelete} />
          </div>
     );
}
