import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { academicApi } from "../service/academicApi";
import { BookOpen } from "lucide-react";
import type { CatalogRegistration, UUID } from "../models/catalog";
import AcademicTable from "../components/AcademicTable";
import AcademicForm from "../components/AcademicForm";
import {
  showSuccessAlert,
  showErrorAlert,
  showLoadingAlert,
  closeAlert,
  showDeleteConfirm,
  showRestoreConfirm,
} from "../../../shared/utils/academicAlerts";

type FilterType = "all" | "active" | "inactive";
const DEFAULT_INSTITUTION_ID: UUID = "4fa85f64-5717-4562-b3fc-2c963f66afa6";

export default function AcademicPage() {
  const [data, setData] = useState<CatalogRegistration[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchText, setSearchText] = useState<string>("");

  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<CatalogRegistration | null>(null);

  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const normalize = (item: any): CatalogRegistration => ({
    ...item,
    course: {
      ...item.course,
      active: item.course.active ?? item.course.isActive ?? false,
    },
  });

  const load = async () => {
    setLoading(true);
    try {
      const list = await academicApi.listAll();
      setData(list.map(normalize));
    } catch (e: any) {
      console.error("Error al cargar registros:", e);
      showErrorAlert("Error al cargar registros", e.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.endsWith("/gestion-academica/nuevo")) {
      setSelected(null);
      setFormOpen(true);
    } else if (/\/gestion-academica\/[^/]+$/.test(path)) {
      const id = params.id;
      const found = data.find((d) => d.course.id === id);
      if (found) setSelected(found);
    } else if (/\/gestion-academica\/[^/]+\/editar$/.test(path)) {
      const id = params.id;
      const found = data.find((d) => d.course.id === id);
      if (found) {
        setSelected(found);
        setFormOpen(true);
      }
    }
  }, [location.pathname, params.id, data]);

  const filtered = useMemo(() => {
    const base =
      filter === "all"
        ? data
        : filter === "active"
        ? data.filter((d) => d.course.active)
        : data.filter((d) => !d.course.active);

    return base.filter((d) =>
      d.course.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [data, filter, searchText]);

  const handleCreate = () => {
    setSelected(null);
    setFormOpen(true);
    navigate("/gestion-academica/nuevo", { replace: false });
  };

  const handleViewDetails = (item: CatalogRegistration) => {
    setSelected(item);
    if (item.course.id) {
      navigate(`/gestion-academica/${item.course.id}`, { replace: false });
    }
  };

  const handleEdit = (item: CatalogRegistration) => {
    setSelected(item);
    setFormOpen(true);
    if (item.course.id) {
      navigate(`/gestion-academica/${item.course.id}/editar`, { replace: false });
    }
  };

  const handleDelete = async (id: UUID, name: string) => {
    const result = await showDeleteConfirm(`el curso "${name}"`);
    if (!result.isConfirmed) return;

    showLoadingAlert("Desactivando...");
    try {
      await academicApi.deactivate(id);
      closeAlert();
      await showSuccessAlert("Curso desactivado");
      await load();
    } catch (e: any) {
      closeAlert();
      showErrorAlert("Error al desactivar", e.message || "Error desconocido");
    }
  };

  const handleRestore = async (id: UUID, name: string) => {
    const result = await showRestoreConfirm(`el curso "${name}"`);
    if (!result.isConfirmed) return;

    showLoadingAlert("Activando...");
    try {
      await academicApi.activate(id);
      closeAlert();
      await showSuccessAlert("Curso activado");
      await load();
    } catch (e: any) {
      closeAlert();
      showErrorAlert("Error al activar", e.message || "Error desconocido");
    }
  };

  const closeForm = () => {
    setFormOpen(false);
    setSelected(null);
    navigate("/gestion-academica", { replace: false });
  };

  const submitForm = async (payload: CatalogRegistration) => {
    try {
      if (selected?.course?.id) {
        const updatedPayload: CatalogRegistration = {
          ...payload,
          institutionId: selected.institutionId,
          course: {
            ...payload.course,
            id: selected.course.id,
            active: selected.course.active,
          },
          competency: { ...payload.competency, id: selected.competency.id },
          capacity: { ...payload.capacity, id: selected.capacity.id },
          performance: { ...payload.performance, id: selected.performance.id },
        };
        showLoadingAlert("Actualizando...");
        await academicApi.update(updatedPayload);
        closeAlert();
        await showSuccessAlert("Curso actualizado");
      } else {
        showLoadingAlert("Registrando...");
        await academicApi.register({
          ...payload,
          institutionId: DEFAULT_INSTITUTION_ID,
        });
        closeAlert();
        await showSuccessAlert("Curso registrado");
      }
      closeForm();
      await load();
    } catch (e: any) {
      closeAlert();
      console.error("Error al guardar:", e);
      showErrorAlert("Error al guardar", e.message || "Error desconocido");
    }
  };
return (
  <div className="max-w-7xl mx-auto px-4 py-6 scroll-smooth">
    {!formOpen && (
      <>
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-7 w-7 mr-2 text-indigo-600" />
              Gestión Académica
            </h1>
            <p className="text-sm text-gray-500">
              Administración de cursos, competencias, capacidades y desempeños
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            + Nuevo Registro
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <input
              type="text"
              placeholder="Buscar curso..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  filter === "all"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter("active")}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  filter === "active"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setFilter("inactive")}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  filter === "inactive"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Inactivos
              </button>
            </div>
          </div>
        </div>
      </>
    )}

    {/* Tabla o estado */}
    {!formOpen && (
      loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Cargando...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 border rounded-lg text-center text-gray-500">
          <p className="text-lg font-medium">No hay registros para mostrar</p>
          <p className="text-sm mt-2">
            {filter === "all"
              ? "Haz clic en 'Nuevo Registro' para comenzar"
              : `No hay registros ${filter === "active" ? "activos" : "inactivos"}`}
          </p>
        </div>
      ) : (
        <AcademicTable
          data={filtered}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRestore={handleRestore}
        />
      )
    )}

    {/* Formulario con scroll interno */}
    {formOpen && (
      <div className="overflow-y-auto max-h-[85vh]">
        <AcademicForm
          initialData={selected}
          isOpen={formOpen}
          onSubmit={submitForm}
          onCancel={closeForm}
        />
      </div>
    )}
  </div>
);
}