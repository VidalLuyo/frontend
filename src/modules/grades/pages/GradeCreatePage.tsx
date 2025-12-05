import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  AchievementLevel,
  Student,
  StudentEvaluationRequest,
  Course,
  Competency,
} from "../models/grades.model";

import {
  CLASSROOMS,
  INSTITUTIONS,
  STUDENTS,
  TEACHERS,
} from "../models/grades.model";
import { GradeService } from "../service/Grade.service";

// Solo letras (mayúsculas, minúsculas, acentos) y espacios
const onlyLetters = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const academicYearFormat = /^\d{4}-\d{4}$/;

type BoletaItem = {
  courseId: string;
  courseName: string;
  competencyId: string;
  competencyLabel: string;
  level: AchievementLevel;
};

const stepsInfo = [
  { id: 1, label: "Institución y aula", desc: "Selecciona el entorno académico." },
  { id: 2, label: "Estudiante", desc: "Elige al estudiante a evaluar." },
  { id: 3, label: "Competencias y notas", desc: "Registra las calificaciones." },
  { id: 4, label: "Detalles finales", desc: "Completa la información general." },
];

const GradeCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Paso 1: institución + aula
  const [institutionId, setInstitutionId] = useState(INSTITUTIONS[0]?.id ?? "");
  const [classroomId, setClassroomId] = useState(CLASSROOMS[0]?.id ?? "");

  // Paso 2: estudiante
  const [students] = useState<Student[]>(STUDENTS);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Paso 3: cursos, competencias, notas
  const [courses, setCourses] = useState<Course[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [currentCourseId, setCurrentCourseId] = useState("");
  const [currentCompetencyId, setCurrentCompetencyId] = useState("");
  const [currentLevel, setCurrentLevel] = useState<AchievementLevel | "">("");
  const [boletaItems, setBoletaItems] = useState<BoletaItem[]>([]);

  // Paso 4: datos generales
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [evaluatedBy, setEvaluatedBy] = useState(""); // UUID del docente
  const [evaluationDate, setEvaluationDate] = useState("");
  const [description, setDescription] = useState("");
  const [observations, setObservations] = useState("");
  const [activityContext, setActivityContext] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // ===== CARGA DE CURSOS =====
  useEffect(() => {
    GradeService.getCourses()
      .then(setCourses)
      .catch(() => toast.error("Error al cargar cursos"));
  }, []);

  // ===== CARGA DE COMPETENCIAS SEGÚN CURSO =====
  useEffect(() => {
    if (!currentCourseId) {
      setCompetencies([]);
      setCurrentCompetencyId("");
      return;
    }

    GradeService.getCompetencies(currentCourseId)
      .then(setCompetencies)
      .catch(() => toast.error("Error al cargar competencias"));
  }, [currentCourseId]);

  // ===== VALIDACIONES POR PASO =====

  const validateStep1 = () => {
    const e: string[] = [];
    if (!institutionId) e.push("Seleccione una institución.");
    if (!classroomId) e.push("Seleccione un aula.");
    setErrors(e);
    return e.length === 0;
  };

  const validateStep2 = () => {
    const e: string[] = [];
    if (!selectedStudentId) e.push("Seleccione un estudiante.");
    setErrors(e);
    return e.length === 0;
  };

  const validateStep3 = () => {
    const e: string[] = [];
    if (boletaItems.length === 0) {
      e.push("Agregue al menos una competencia calificada a la boleta.");
    }
    setErrors(e);
    return e.length === 0;
  };

  const validateStep4 = () => {
    const e: string[] = [];

    // Año académico: 2025-2026
    if (!academicYearFormat.test(academicYear)) {
      e.push("Año académico inválido. Formato esperado: 2025-2026.");
    }

    // Evaluador: debe estar seleccionado (UUID)
    if (!evaluatedBy) {
      e.push("Seleccione un evaluador.");
    }

    // Fecha: no puede ser antes del inicio del mes actual
    if (!evaluationDate) {
      e.push("Seleccione una fecha de evaluación.");
    } else {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const selected = new Date(evaluationDate);
      if (selected < monthStart) {
        e.push("La fecha no puede ser anterior al inicio del mes actual.");
      }
    }

    // Descripción: obligatoria y solo letras
    if (!description.trim()) {
      e.push("La descripción es obligatoria.");
    } else if (!onlyLetters.test(description.trim())) {
      e.push("La descripción solo debe contener letras y espacios.");
    }

    // Observaciones: obligatoria y solo letras
    if (!observations.trim()) {
      e.push("Las observaciones son obligatorias.");
    } else if (!onlyLetters.test(observations.trim())) {
      e.push("Las observaciones solo deben contener letras y espacios.");
    }

    // Contexto: obligatorio y solo letras
    if (!activityContext.trim()) {
      e.push("El contexto de actividad es obligatorio.");
    } else if (!onlyLetters.test(activityContext.trim())) {
      e.push("El contexto de actividad solo debe contener letras y espacios.");
    }

    setErrors(e);
    return e.length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;

    setErrors([]);
    setStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev));
  };

  const handlePrev = () => {
    setErrors([]);
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev));
  };

  // ===== MANEJO DE LINEAS (CURSO + COMPETENCIA + NOTA) =====

  const handleAddItem = () => {
    const localErrors: string[] = [];

    if (!currentCourseId) localErrors.push("Seleccione un curso.");
    if (!currentCompetencyId) localErrors.push("Seleccione una competencia.");
    if (!currentLevel) localErrors.push("Seleccione una nota para la competencia.");

    if (localErrors.length > 0) {
      setErrors(localErrors);
      return;
    }

    const exists = boletaItems.some(
      (item) =>
        item.courseId === currentCourseId &&
        item.competencyId === currentCompetencyId
    );
    if (exists) {
      toast.error("Esa competencia de ese curso ya fue agregada.");
      return;
    }

    const courseName =
      courses.find((c) => c.id === currentCourseId)?.name || currentCourseId;

    const comp = competencies.find((c) => c.id === currentCompetencyId);
    const competencyLabel = comp
      ? `${comp.code} - ${comp.description}`
      : currentCompetencyId;

    const newItem: BoletaItem = {
      courseId: currentCourseId,
      courseName,
      competencyId: currentCompetencyId,
      competencyLabel,
      level: currentLevel as AchievementLevel,
    };

    setBoletaItems((prev) => [...prev, newItem]);
    setCurrentCompetencyId("");
    setCurrentLevel("");
    setErrors([]);
  };

  const handleRemoveItem = (courseId: string, competencyId: string) => {
    setBoletaItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.courseId === courseId &&
            item.competencyId === competencyId
          )
      )
    );
  };

  // =====================
  // EXPORTAR PDF con mejor espacio
  // =====================
  const handleExportPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Encabezado profesional
    doc.setFillColor(66, 153, 225); // Azul profesional
    doc.rect(0, 0, 210, 35, 'F');
    
    // Logo y título
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text("SISTEMA DE EVALUACIÓN ACADÉMICA", 105, 18, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text("Boleta de Calificaciones", 105, 28, { align: "center" });
    
    // Línea separadora
    doc.setDrawColor(66, 153, 225);
    doc.line(20, 40, 190, 40);
    
    // Información institucional con más espacio
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    
    // Columna izquierda con más espacio
    let yPos = 50;
    doc.text("INFORMACIÓN INSTITUCIONAL:", 20, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Institución:`, 20, yPos);
    doc.setFont('helvetica', 'bold');
    const institutionName = INSTITUTIONS.find((i) => i.id === institutionId)?.name || 'No especificada';
    doc.text(institutionName, 20, yPos + 6);
    
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    doc.text(`Aula:`, 20, yPos);
    doc.setFont('helvetica', 'bold');
    const classroomName = CLASSROOMS.find((c) => c.id === classroomId)?.name || 'No especificada';
    doc.text(classroomName, 20, yPos + 6);
    
    // Columna derecha con más espacio
    yPos = 50;
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Emisión:`, 130, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${new Date().toLocaleDateString()}`, 130, yPos + 6);
    
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    doc.text(`Año Académico:`, 130, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${academicYear}`, 130, yPos + 6);
    
    // Información del estudiante con más espacio
    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text("INFORMACIÓN DEL ESTUDIANTE:", 20, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Estudiante:`, 20, yPos);
    doc.setFont('helvetica', 'bold');
    const studentName = selectedStudent?.fullName || 'No seleccionado';
    doc.text(studentName, 20, yPos + 6);
    
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    doc.text(`ID Estudiante:`, 20, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${selectedStudent?.id || 'No especificado'}`, 20, yPos + 6);
    
    // Evaluador con más espacio
    yPos += 15;
    doc.setFont('helvetica', 'normal');
    doc.text(`Evaluado Por:`, 20, yPos);
    doc.setFont('helvetica', 'bold');
    const evaluatorName = TEACHERS.find(t => t.id === evaluatedBy)?.name || 'No especificado';
    doc.text(evaluatorName, 20, yPos + 6);
    
    // Línea separadora
    yPos += 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    
    // Tabla de evaluaciones con más espacio
    yPos += 10;
    const headers = [['Curso', 'Competencia', 'Nivel']];
    
    const body = boletaItems.map(item => [
      courses.find(c => c.id === item.courseId)?.name || item.courseId,
      `${item.competencyLabel} (${item.competencyId})`,
      item.level
    ]);

    autoTable(doc, {
      startY: yPos,
      head: headers,
      body: body,
      theme: 'grid',
      headStyles: {
        fillColor: [66, 153, 225],
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 5, // Más espacio interno
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 70 }, // Más ancho para curso
        1: { cellWidth: 90 }, // Más ancho para competencia
        2: { cellWidth: 20, halign: 'center' } // Ancho fijo para nivel
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246]
      },
      didDrawPage: function(data) {
        // Pie de página profesional
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'normal');
        doc.text(`Documento generado el ${new Date().toLocaleString()}`, 20, 285);
        doc.text(`Página ${doc.getNumberOfPages()}`, 190, 285, { align: "right" });
      },
      margin: { top: 35, bottom: 30, left: 20, right: 20 } // Márgenes amplios
    });

    // Sección de firmas con más espacio
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    doc.text("Observaciones:", 20, finalY);
    doc.setFontSize(10);
    const observationsText = observations || 'Ninguna';
    // Dividir texto largo en líneas
    const splitObservations = doc.splitTextToSize(observationsText, 170);
    doc.text(splitObservations, 20, finalY + 7);
    
    // Líneas para firmas con más espacio
    const signatureY = finalY + 20 + (splitObservations.length * 5);
    doc.setFontSize(11);
    doc.text("Firma del Evaluador:", 20, signatureY);
    doc.line(20, signatureY + 8, 80, signatureY + 8);
    
    doc.text("Firma del Coordinador:", 120, signatureY);
    doc.line(120, signatureY + 8, 180, signatureY + 8);
    
    // Marca de agua
    doc.setFontSize(40);
    doc.setTextColor(240, 240, 240);
    doc.setFont('helvetica', 'bold');
    doc.text("SISTEMA ACADÉMICO", 105, 150, { align: "center", angle: 45 });

    doc.save(`boleta_calificaciones_${selectedStudent?.fullName.replace(/\s+/g, '_') || 'estudiante'}.pdf`);
  };

  // ===== GUARDAR EN BACKEND (VARIOS REGISTROS) =====
  const handleSubmit = async () => {
    if (!validateStep4()) return;
    if (!selectedStudent) {
      toast.error("Seleccione un estudiante.");
      return;
    }
    if (boletaItems.length === 0) {
      toast.error("No hay competencias calificadas para guardar.");
      return;
    }

    try {
      setLoading(true);

      const yearNumber =
        Number(academicYear.split("-")[0]) || new Date().getFullYear();

      const common: Omit<
        StudentEvaluationRequest,
        | "studentId"
        | "enrollmentId"
        | "courseId"
        | "competencyId"
        | "achievementLevel"
      > = {
        classroomId,
        institutionId,
        academicYear: yearNumber,
        description,
        evaluatedBy, // UUID del docente
        evaluationDate,
        observations,
        activityContext,
        evidenceUrls: evidenceUrl ? [evidenceUrl] : [],
      };

      await Promise.all(
        boletaItems.map((item) => {
          const payload: StudentEvaluationRequest = {
            ...common,
            studentId: selectedStudent.id,
            enrollmentId: selectedStudent.enrollmentId,
            courseId: item.courseId,
            competencyId: item.competencyId,
            achievementLevel: item.level,
          };
          return GradeService.createEvaluation(payload);
        })
      );

      toast.success("Boleta registrada correctamente");
      navigate("/grades");
    } catch (e) {
      console.error(e);
      toast.error("Error al guardar la boleta");
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* HEADER PRINCIPAL */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Registrar boleta de notas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Completa los pasos para generar la boleta de evaluación del estudiante.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/grades")}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Volver al listado
          </button>
        </header>

        {/* STEPPER */}
        <nav className="bg-white border border-slate-100 rounded-2xl shadow-sm px-4 py-3 sm:px-5 sm:py-4">
          <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {stepsInfo.map((s) => {
              const isActive = step === s.id;
              const isCompleted = step > s.id;

              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 text-xs sm:text-sm"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold border
                    ${
                      isActive
                        ? "bg-sky-600 text-white border-sky-600"
                        : isCompleted
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    {isCompleted ? "✓" : s.id}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`font-medium ${
                        isActive
                          ? "text-sky-700"
                          : isCompleted
                          ? "text-emerald-700"
                          : "text-slate-600"
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      {s.desc}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ALERTA DE ERRORES */}
        {errors.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl px-4 py-3 text-sm shadow-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold">
                !
              </div>
              <div>
                <p className="font-semibold text-sm">Revise la información:</p>
                <ul className="mt-1 list-disc list-inside space-y-0.5">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO DEL PASO */}
        <main className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Paso {step} de 4 ·{" "}
            <span className="font-semibold text-slate-700">
              {stepsInfo[step - 1].label}
            </span>
          </p>

          {/* PASO 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Institución *
                  </label>
                  <select
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    {INSTITUTIONS.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Centro educativo en el que se realizó la evaluación.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Aula *
                  </label>
                  <select
                    value={classroomId}
                    onChange={(e) => setClassroomId(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    {CLASSROOMS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Sección o grupo del estudiante.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Estudiante *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="">Seleccione estudiante</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Estudiante para el cual se generará la boleta.
                </p>
              </div>

              {selectedStudent && (
                <div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">
                    Detalles del estudiante
                  </p>
                  <p className="mt-1">Matrícula: {selectedStudent.enrollmentId}</p>
                </div>
              )}
            </div>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Curso (Área) *
                  </label>
                  <select
                    value={currentCourseId}
                    onChange={(e) => {
                      setCurrentCourseId(e.target.value);
                      setCurrentCompetencyId("");
                      setCurrentLevel("");
                    }}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    <option value="">Seleccione curso</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Competencia *
                  </label>
                  <select
                    value={currentCompetencyId}
                    onChange={(e) => setCurrentCompetencyId(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-33 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-50"
                    disabled={!currentCourseId}
                  >
                    <option value="">Seleccione competencia</option>
                    {competencies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Nivel de logro *
                  </label>
                  <select
                    value={currentLevel}
                    onChange={(e) =>
                      setCurrentLevel(e.target.value as AchievementLevel | "")
                    }
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    <option value="">Seleccione nivel</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                + Agregar a la boleta
              </button>

              {boletaItems.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h3 className="font-semibold text-sm text-slate-900">
                    Competencias calificadas
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="min-w-full text-xs sm:text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                          <th className="px-3 py-2 sm:px-4 border-b border-slate-100">
                            Curso
                          </th>
                          <th className="px-3 py-2 sm:px-4 border-b border-slate-100">
                            Competencia
                          </th>
                          <th className="px-3 py-2 sm:px-4 border-b border-slate-100 text-center">
                            Nivel
                          </th>
                          <th className="px-3 py-2 sm:px-4 border-b border-slate-100 text-center">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {boletaItems.map((item, idx) => (
                          <tr
                            key={`${item.courseId}-${item.competencyId}`}
                            className={
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                            }
                          >
                            <td className="px-3 py-2 sm:px-4 border-t border-slate-100 align-top">
                              <span className="font-medium text-slate-900">
                                {item.courseName}
                              </span>
                            </td>
                            <td className="px-3 py-2 sm:px-4 border-t border-slate-100 align-top">
                              <span className="text-slate-700">
                                {item.competencyLabel}
                              </span>
                            </td>
                            <td className="px-3 py-2 sm:px-4 border-t border-slate-100 text-center align-top">
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                                {item.level}
                              </span>
                            </td>
                            <td className="px-3 py-2 sm:px-4 border-t border-slate-100 text-center align-top">
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveItem(item.courseId, item.competencyId)
                                }
                                className="text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:underline"
                              >
                                Quitar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Año académico (formato 2025-2026) *
                  </label>
                  <input
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="block w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    placeholder="2025-2026"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Evaluador *
                  </label>
                  <select
                    value={evaluatedBy}
                    onChange={(e) => setEvaluatedBy(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    <option value="">Seleccione evaluador</option>
                    {TEACHERS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Fecha de evaluación *
                  </label>
                  <input
                    type="date"
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                    className="block w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    URL de evidencia
                  </label>
                  <input
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Descripción *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Observaciones *
                  </label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Contexto de actividad *
                  </label>
                  <textarea
                    value={activityContext}
                    onChange={(e) => setActivityContext(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    rows={3}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Exportar PDF
                </button>
              </div>
            </div>
          )}
        </main>

        {/* BOTONES NAVEGACIÓN */}
        <footer className="flex items-center justify-between gap-3">
          <div>
            {step > 1 && (
              <button
                onClick={handlePrev}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                ← Anterior
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {step < 4 && (
              <button
                onClick={handleNext}
                className="inline-flex items-center rounded-xl bg-sky-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                Siguiente →
              </button>
            )}

            {step === 4 && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                {loading ? "Guardando..." : "Guardar boleta"}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default GradeCreatePage;
