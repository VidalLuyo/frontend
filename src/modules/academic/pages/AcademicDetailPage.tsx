import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { academicApi } from "../service/academicApi";
import type { CatalogRegistration } from "../models/catalog";

export function AcademicDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<CatalogRegistration | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const list = await academicApi.listAll();
      const found = list.find((d) => d.course.id === id);
      setData(found || null);
    };
    load();
  }, [id]);

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow text-center">
        <p className="text-gray-500 text-sm">No se encontró el registro</p>
        <button
          onClick={() => navigate("/gestion-academica")}
          className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
        >
          Volver
        </button>
      </div>
    );
  }

  const { course, competency, capacity, performance } = data;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
          <p className="mt-2 text-sm text-gray-600">Detalle del curso académico</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate("/gestion-academica")}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Volver
          </button>
        </div>
      </div>

      {/* Ficha de detalle */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Información del Curso</h2>
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                course.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {course.active ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Código</dt>
              <dd className="mt-1 text-sm text-gray-900">{course.code}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Área Curricular</dt>
              <dd className="mt-1 text-sm text-gray-900">{course.areaCurricular}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Nivel</dt>
              <dd className="mt-1 text-sm text-gray-900">{course.ageLevel}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="mt-1 text-sm text-gray-900">{course.description}</dd>
            </div>

            {/* Competencia */}
            <div className="md:col-span-2 mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Competencia</h3>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Código</dt>
              <dd className="mt-1 text-sm text-gray-900">{competency.code}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Nombre</dt>
              <dd className="mt-1 text-sm text-gray-900">{competency.name}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="mt-1 text-sm text-gray-900">{competency.description}</dd>
            </div>

            {/* Capacidad */}
            <div className="md:col-span-2 mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Capacidad</h3>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Código</dt>
              <dd className="mt-1 text-sm text-gray-900">{capacity.code}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Nombre</dt>
              <dd className="mt-1 text-sm text-gray-900">{capacity.name}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="mt-1 text-sm text-gray-900">{capacity.description}</dd>
            </div>

            {/* Desempeño */}
            <div className="md:col-span-2 mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Desempeño</h3>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Código</dt>
              <dd className="mt-1 text-sm text-gray-900">{performance.code}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Nivel</dt>
              <dd className="mt-1 text-sm text-gray-900">{performance.ageLevel}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="mt-1 text-sm text-gray-900">{performance.description}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
