import { useState, useEffect } from "react";
import { BookOpen, Target, Brain, Award } from "lucide-react";
import type { CatalogRegistration } from "../models/catalog";

type AcademicFormProps = {
  initialData: CatalogRegistration | null;
  isOpen: boolean;
  onSubmit: (payload: CatalogRegistration) => Promise<void>;
  onCancel: () => void;
};

export default function AcademicForm({
  initialData,
  isOpen,
  onSubmit,
  onCancel,
}: AcademicFormProps) {
  const [form, setForm] = useState<CatalogRegistration>(
    initialData ?? {
      institutionId: "",
      course: {
        code: "",
        name: "",
        areaCurricular: "",
        ageLevel: "",
        description: "",
        active: true,
      },
      competency: {
        code: "",
        name: "",
        description: "",
        orderIndex: 0,
      },
      capacity: {
        code: "",
        name: "",
        description: "",
        orderIndex: 0,
      },
      performance: {
        code: "",
        description: "",
        ageLevel: "",
        orderIndex: 0,
      },
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (
    section: "course" | "competency" | "capacity" | "performance",
    field: string,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setErrors((prev) => ({
      ...prev,
      [`${section}.${field}`]: "",
    }));
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    const regexCodigoGeneral = /^[A-Z0-9\-]+$/;
    const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    const nivelesCursoPermitidos = ["3 años", "4 años", "5 años"];
    const nivelesDesempenoPermitidos = ["Fácil", "Intermedio", "Difícil"];

    const required = [
      ["course", "code"],
      ["course", "name"],
      ["course", "areaCurricular"],
      ["course", "ageLevel"],
      ["course", "description"],
      ["competency", "code"],
      ["competency", "name"],
      ["competency", "description"],
      ["capacity", "code"],
      ["capacity", "name"],
      ["capacity", "description"],
      ["performance", "code"],
      ["performance", "description"],
      ["performance", "ageLevel"],
    ];

    required.forEach(([section, field]) => {
      let value = "";

      if (section === "course") {
        value = form.course[field as keyof typeof form.course] as string;
      } else if (section === "competency") {
        value = form.competency[field as keyof typeof form.competency] as string;
      } else if (section === "capacity") {
        value = form.capacity[field as keyof typeof form.capacity] as string;
      } else if (section === "performance") {
        value = form.performance[field as keyof typeof form.performance] as string;
      }

      if (!value || value.trim() === "") {
        newErrors[`${section}.${field}`] = "Este campo es obligatorio.";
      }

      if (field === "code" && value && !regexCodigoGeneral.test(value)) {
        newErrors[`${section}.code`] = "Formato inválido. Solo se permiten mayúsculas, números y guiones.";
      }

      if (section === "course") {
        if (field === "code" && value.length > 15) {
          newErrors["course.code"] = "Máximo 15 caracteres.";
        }
        if (field === "name" && (value.length < 3 || !regexSoloLetras.test(value))) {
          newErrors["course.name"] = "Debe tener al menos 3 letras y solo letras y espacios.";
        }
        if (field === "areaCurricular" && value === "Seleccionar...") {
          newErrors["course.areaCurricular"] = "Selecciona un área válida.";
        }
        if (field === "ageLevel" && !nivelesCursoPermitidos.includes(value)) {
          newErrors["course.ageLevel"] = "Nivel inválido. Usa 3, 4 o 5 años.";
        }
        if (field === "description" && (value.length < 20 || value.length > 500)) {
          newErrors["course.description"] = "Debe tener entre 20 y 500 caracteres.";
        }
      }

      if (section === "competency") {
        if (field === "name" && (value.length < 5 || !regexSoloLetras.test(value))) {
          newErrors["competency.name"] = "Debe tener al menos 5 letras y solo letras y espacios.";
        }
        if (field === "description" && value.length < 15) {
          newErrors["competency.description"] = "Debe tener al menos 15 caracteres.";
        }
      }

      if (section === "capacity") {
        if (field === "name" && (value.length < 5 || !regexSoloLetras.test(value))) {
          newErrors["capacity.name"] = "Debe tener al menos 5 letras y solo letras y espacios.";
        }
        if (field === "description" && value.length < 15) {
          newErrors["capacity.description"] = "Debe tener al menos 15 caracteres.";
        }
      }

      if (section === "performance") {
        if (field === "ageLevel" && !nivelesDesempenoPermitidos.includes(value)) {
          newErrors["performance.ageLevel"] = "Nivel inválido. Usa Fácil, Intermedio o Difícil.";
        }
        if (field === "description" && value.length < 20) {
          newErrors["performance.description"] = "Debe tener al menos 20 caracteres.";
        }
      }
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    await onSubmit(form);
  };

  const renderError = (key: string) =>
    errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>

 return (
  <div className="max-w-4xl mx-auto bg-white rounded-lg shadow overflow-hidden">
    {/* Encabezado */}
    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
      <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-indigo-600" /> Registro Académico
      </h2>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
        >
          Guardar
        </button>
      </div>
    </div>

    {/* Cuerpo del formulario */}
    <div className="px-6 py-6 space-y-10 text-sm text-gray-700">
      {/* Curso */}
      <section>
        <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-600" /> Información del Curso
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">Código *</label>
            <input
              type="text"
              value={form.course.code}
              onChange={(e) =>
                handleChange("course", "code", e.target.value.toUpperCase())
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ejemplo: CUR-01"
            />
            {renderError("course.code")}
          </div>

          <div>
            <label className="block font-medium mb-1">Nombre *</label>
            <input
              type="text"
              value={form.course.name}
              onChange={(e) => handleChange("course", "name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Nombre del curso"
            />
            {renderError("course.name")}
          </div>

          <div>
            <label className="block font-medium mb-1">Área Curricular *</label>
            <input
              type="text"
              value={form.course.areaCurricular}
              onChange={(e) =>
                handleChange("course", "areaCurricular", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ejemplo: Matemática"
            />
            {renderError("course.areaCurricular")}
          </div>

          <div>
            <label className="block font-medium mb-1">Nivel *</label>
            <select
              value={form.course.ageLevel}
              onChange={(e) =>
                handleChange("course", "ageLevel", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700"
            >
              <option value="">Seleccione un nivel</option>
              <option value="3 años">3 años</option>
              <option value="4 años">4 años</option>
              <option value="5 años">5 años</option>
            </select>
            {renderError("course.ageLevel")}
          </div>

          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Descripción *</label>
            <textarea
              value={form.course.description}
              onChange={(e) =>
                handleChange("course", "description", e.target.value)
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Breve descripción del curso (mínimo 20 caracteres)"
            />
            {renderError("course.description")}
          </div>
        </div>
      </section>

      {/* Competencia */}
      <section>
        <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-600" /> Competencia
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">Código *</label>
            <input
              type="text"
              value={form.competency.code}
              onChange={(e) =>
                handleChange("competency", "code", e.target.value.toUpperCase())
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ejemplo: COM-01"
            />
            {renderError("competency.code")}
          </div>

          <div>
            <label className="block font-medium mb-1">Nombre *</label>
            <input
              type="text"
              value={form.competency.name}
              onChange={(e) =>
                handleChange("competency", "name", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Nombre de la competencia"
            />
            {renderError("competency.name")}
          </div>

          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Descripción *</label>
            <textarea
              value={form.competency.description}
              onChange={(e) =>
                handleChange("competency", "description", e.target.value)
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Descripción de la competencia (mínimo 15 caracteres)"
            />
            {renderError("competency.description")}
          </div>
        </div>
      </section>

      {/* Capacidad */}
      <section>
        <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" /> Capacidad
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">Código *</label>
            <input
              type="text"
              value={form.capacity.code}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                const regex = /^[A-Z0-9-]*$/;
                if (regex.test(value)) handleChange("capacity", "code", value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ejemplo: CAP-01"
            />
            {renderError("capacity.code")}
          </div>

          <div>
            <label className="block font-medium mb-1">Nombre *</label>
            <input
              type="text"
              value={form.capacity.name}
              onChange={(e) =>
                handleChange("capacity", "name", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Nombre de la capacidad"
            />
            {renderError("capacity.name")}
          </div>

          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Descripción *</label>
            <textarea
              value={form.capacity.description}
              onChange={(e) =>
                handleChange("capacity", "description", e.target.value)
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Descripción de la capacidad (mínimo 15 caracteres)"
            />
            {renderError("capacity.description")}
          </div>
        </div>
      </section>

      {/* Desempeño */}
      <section>
        <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" /> Desempeño
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">Código *</label>
            <input
              type="text"
              value={form.performance.code}
              onChange={(e) =>
                handleChange("performance", "code", e.target.value.toUpperCase())
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ejemplo: DES-01"
            />
            {renderError("performance.code")}
          </div>

          <div>
            <label className="block font-medium mb-1">Nivel *</label>
            <select
              value={form.performance.ageLevel}
              onChange={(e) =>
                handleChange("performance", "ageLevel", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700"
            >
              <option value="">Seleccione un nivel</option>
              <option value="Fácil">Fácil</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Difícil">Difícil</option>
            </select>
            {renderError("performance.ageLevel")}
          </div>

          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Descripción *</label>
            <textarea
              value={form.performance.description}
              onChange={(e) =>
                handleChange("performance", "description", e.target.value)
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Descripción del desempeño (mínimo 20 caracteres)"
            />
            {renderError("performance.description")}
          </div>
        </div>
      </section>
    </div>
  </div>
);
}