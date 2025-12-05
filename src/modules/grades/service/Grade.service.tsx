import type {
  AchievementLevel,
  Student,
  StudentEvaluationRequest,
  StudentEvaluationResponse,
  Course,
  Competency,
} from "../models/grades.model";

import {
  INSTITUTIONS,
  CLASSROOMS,
  STUDENTS,
} from "../models/grades.model";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9086";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const GradeService = {
  // ===============================
  // EVALUACIONES
  // ===============================
  async getEvaluations(): Promise<StudentEvaluationResponse[]> {
    const res = await fetch(`${BASE_URL}/student-evaluations`);
    return handleResponse<StudentEvaluationResponse[]>(res);
  },

  async createEvaluation(
    data: StudentEvaluationRequest
  ): Promise<StudentEvaluationResponse> {
    const res = await fetch(`${BASE_URL}/student-evaluations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<StudentEvaluationResponse>(res);
  },

  async createEvaluations(
    commonData: Omit<
      StudentEvaluationRequest,
      "studentId" | "enrollmentId" | "achievementLevel"
    >,
    students: { student: Student; level: AchievementLevel }[]
  ): Promise<StudentEvaluationResponse[]> {
    const requests = students
      .filter((s) => s.level)
      .map((s) =>
        this.createEvaluation({
          ...commonData,
          studentId: s.student.id,
          enrollmentId: s.student.enrollmentId,
          achievementLevel: s.level,
        })
      );

    return Promise.all(requests);
  },

  // ===============================
  // MAESTROS / CONSTANTES
  // ===============================

  getInstitutions() {
    return INSTITUTIONS;
  },

  getClassrooms() {
    return CLASSROOMS;
  },

  getStudents() {
    return STUDENTS;
  },

  // ===============================
  // BACK-END REAL: CURSOS / COMPETENCIAS
  // ===============================

  async getCourses(): Promise<Course[]> {
    const res = await fetch(`${BASE_URL}/courses`);
    return handleResponse<Course[]>(res);
  },

  async getCompetencies(courseId: string): Promise<Competency[]> {
    const res = await fetch(`${BASE_URL}/competencies?courseId=${courseId}`);
    return handleResponse<Competency[]>(res);
  },
};
