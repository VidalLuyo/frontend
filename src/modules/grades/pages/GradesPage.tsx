import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { GradeService } from "../service/Grade.service";
import GradeList from "../components/GradeList";
import type { StudentEvaluationResponse } from "../models/grades.model";

const GradesPage = () => {
  const [evaluations, setEvaluations] = useState<StudentEvaluationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await GradeService.getEvaluations();
      setEvaluations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Ocurrió un error al cargar las boletas de notas. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluations();
  }, []);

  // STATE: Cargando
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="w-full px-6 pr-10 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-sky-500 animate-spin" />
            <div>
              <p className="text-sm font-medium text-slate-900">Cargando boletas...</p>
              <p className="text-xs text-slate-500">
                Estamos obteniendo la información del sistema de notas.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STATE: Error
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="w-full px-6 pr-10 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 flex items-start gap-4">
            <div className="mt-1 h-8 w-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 text-lg">
              !
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-red-700">Error al cargar datos</h2>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              <button
                onClick={loadEvaluations}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 👉 aquí quitamos max-w-6xl/7xl y dejamos que ocupe casi todo, solo con margen */}
      <div className="w-full px-6 pr-10 py-8">
        <GradeList
          evaluations={evaluations}
          onNew={() => navigate("/grades/new")}
        />
      </div>
    </div>
  );
};

export default GradesPage;
