import { useState } from 'react';
import type { StudentEvaluationResponse } from '../models/grades.model';
import { STUDENTS } from '../models/grades.model';

interface Props {
  evaluations: StudentEvaluationResponse[];
  onNew: () => void;
}

export default function GradeList({ evaluations, onNew }: Props) {
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<StudentEvaluationResponse | null>(null);

  const getStudentName = (studentId: string) => {
    const student = STUDENTS.find((s) => s.id === studentId);
    return student ? student.fullName : studentId;
  };

  const totalA = evaluations.filter((e) => e.achievementLevel === 'A').length;
  const totalB = evaluations.filter((e) => e.achievementLevel === 'B').length;
  const totalC = evaluations.filter((e) => e.achievementLevel === 'C').length;

  const isEmpty = evaluations.length === 0;

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Sistema de Gestión de Boletas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Visualiza y administra las evaluaciones de los estudiantes.
          </p>
        </div>

        <button
          onClick={onNew}
          className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold
                     bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <span className="mr-2 text-lg leading-none">＋</span>
          Registrar nueva boleta
        </button>
      </section>

      {/* CARD PRINCIPAL – métricas + tabla */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 space-y-5">
        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricBox
            title="Total boletas"
            value={evaluations.length}
            description="Boletas registradas"
            variant="blue"
          />
          <MetricBox
            title="Nivel A"
            value={totalA}
            description="Desempeño destacado"
            variant="green"
          />
          <MetricBox
            title="Nivel B"
            value={totalB}
            description="Buen desempeño"
            variant="yellow"
          />
          <MetricBox
            title="Nivel C"
            value={totalC}
            description="Requiere refuerzo"
            variant="red"
          />
        </div>

        {/* Info de listado */}
        {!isEmpty && (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100 px-4 py-2">
            <span>
              Mostrando <span className="font-semibold">{evaluations.length}</span> boleta
              {evaluations.length === 1 ? '' : 's'} registradas
            </span>
          </div>
        )}

        {/* Tabla */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          {isEmpty ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No hay boletas registradas. Usa el botón{" "}
              <span className="font-semibold">“Registrar nueva boleta”</span>.
            </div>
          ) : (
            <div className="max-h-[460px] overflow-y-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-900 text-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold tracking-wide">Alumno</th>
                    <th className="px-4 py-3 text-left font-semibold tracking-wide">Curso</th>
                    <th className="px-4 py-3 text-left font-semibold tracking-wide">
                      Competencia
                    </th>
                    <th className="px-4 py-3 text-center font-semibold tracking-wide">Nivel</th>
                    <th className="px-4 py-3 text-left font-semibold tracking-wide">Fecha</th>
                    <th className="px-4 py-3 text-right font-semibold tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((e, index) => (
                    <tr
                      key={e.id}
                      className={`border-b border-slate-100 last:border-b-0 ${
                        index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      } hover:bg-blue-50/50 transition-colors`}
                    >
                      {/* Alumno */}
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                            {getStudentName(e.studentId).charAt(0).toUpperCase()}
                          </div>
                          <div className="leading-tight">
                            <p className="font-semibold text-slate-900">
                              {getStudentName(e.studentId)}
                            </p>
                            <p className="text-[11px] text-slate-500">ID: {e.studentId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Curso */}
                      <td className="px-4 py-3 align-top text-slate-800">{e.courseId}</td>

                      {/* Competencia */}
                      <td className="px-4 py-3 align-top text-slate-800">{e.competencyId}</td>

                      {/* Nivel */}
                      <td className="px-4 py-3 align-top text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            e.achievementLevel === 'A'
                              ? 'bg-emerald-50 text-emerald-700'
                              : e.achievementLevel === 'B'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {e.achievementLevel}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-3 align-top text-slate-500 whitespace-nowrap">
                        {e.evaluationDate}
                      </td>

                      {/* ACCIONES */}
                      <td className="px-4 py-3 align-top text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEvaluation(e)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.7}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* MODAL DE DETALLES (bonito, sin JSON) */}
      {selectedEvaluation && (
        <DetailsModal
          evaluation={selectedEvaluation}
          studentName={getStudentName(selectedEvaluation.studentId)}
          onClose={() => setSelectedEvaluation(null)}
        />
      )}
    </div>
  );
}

/* ---------- MODAL DE DETALLES ---------- */

interface DetailsModalProps {
  evaluation: StudentEvaluationResponse;
  studentName: string;
  onClose: () => void;
}

function DetailsModal({ evaluation, studentName, onClose }: DetailsModalProps) {
  // si el modelo tiene más campos, aquí los podrías ir agregando de forma bonita
  const levelDescription =
    evaluation.achievementLevel === 'A'
      ? 'Desempeño destacado'
      : evaluation.achievementLevel === 'B'
      ? 'Buen desempeño'
      : 'En proceso / requiere refuerzo';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full mx-4 p-6 relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          ✕
        </button>

        {/* Encabezado */}
        <h2 className="text-lg font-semibold text-slate-900">
          Boleta de notas
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Detalle completo de la evaluación seleccionada.
        </p>

        <div className="space-y-4 text-sm">
          {/* Alumno */}
          <div className="border border-slate-100 rounded-xl px-4 py-3 bg-slate-50/60">
            <p className="text-[11px] uppercase text-slate-500 font-medium">
              Alumno
            </p>
            <p className="text-base font-semibold text-slate-900">
              {studentName}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              ID del estudiante: {evaluation.studentId}
            </p>
          </div>

          {/* Curso y Competencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-[11px] uppercase text-slate-500 font-medium">
                Curso
              </p>
              <p className="mt-1 text-slate-900 break-words">
                {evaluation.courseId}
              </p>
            </div>
            <div className="border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-[11px] uppercase text-slate-500 font-medium">
                Competencia
              </p>
              <p className="mt-1 text-slate-900 break-words">
                {evaluation.competencyId}
              </p>
            </div>
          </div>

          {/* Nivel, Fecha, ID boleta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-[11px] uppercase text-slate-500 font-medium">
                Nivel de logro
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-semibold">
                  {evaluation.achievementLevel}
                </span>
                <span className="text-[11px] text-slate-600">
                  {levelDescription}
                </span>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-[11px] uppercase text-slate-500 font-medium">
                Fecha de evaluación
              </p>
              <p className="mt-1 text-slate-900">
                {evaluation.evaluationDate}
              </p>
            </div>

            <div className="border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-[11px] uppercase text-slate-500 font-medium">
                ID de boleta
              </p>
              <p className="mt-1 text-slate-900 text-xs break-all">
                {evaluation.id}
              </p>
            </div>
          </div>
        </div>

        {/* Botón cerrar */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- TARJETAS DE MÉTRICAS ---------- */

type MetricVariant = 'blue' | 'green' | 'yellow' | 'red';

interface MetricBoxProps {
  title: string;
  value: number;
  description: string;
  variant: MetricVariant;
}

function MetricBox({ title, value, description, variant }: MetricBoxProps) {
  const styles: Record<
    MetricVariant,
    { wrapper: string; badge: string }
  > = {
    blue: {
      wrapper: 'bg-blue-50 border-blue-100',
      badge: 'bg-white text-blue-600',
    },
    green: {
      wrapper: 'bg-emerald-50 border-emerald-100',
      badge: 'bg-white text-emerald-600',
    },
    yellow: {
      wrapper: 'bg-amber-50 border-amber-100',
      badge: 'bg-white text-amber-600',
    },
    red: {
      wrapper: 'bg-rose-50 border-rose-100',
      badge: 'bg-white text-rose-600',
    },
  };

  const s = styles[variant];

  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between ${s.wrapper}`}>
      <div>
        <p className="text-[11px] font-medium text-slate-600 uppercase tracking-wide">
          {title}
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        <p className="mt-1 text-[11px] text-slate-600">{description}</p>
      </div>
      <div
        className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold ${s.badge}`}
      >
        {value}
      </div>
    </div>
  );
}
