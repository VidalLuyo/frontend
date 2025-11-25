import type {
  PsychologicalEvaluation,
  CreatePsychologicalEvaluationDto,
  UpdatePsychologicalEvaluationDto,
} from "../models/psychology.model";

const BASE_URL = "https://vg-ms-psychology-welfare.onrender.com/api/v1";
const API_BASE_URL = `${BASE_URL}/psychological-evaluations`;
const REFERENCE_DATA_URL = `${BASE_URL}/reference-data`;

class PsychologyService {
  // Método auxiliar para hacer peticiones HTTP
  private async fetchData<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  // Método auxiliar para obtener texto
  private async fetchText(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }
  // Función para obtener nombres reales desde el backend
  private async enrichWithNames(
    evaluations: PsychologicalEvaluation[]
  ): Promise<PsychologicalEvaluation[]> {
    const enrichedEvaluations = await Promise.all(
      evaluations.map(async (evaluation) => {
        try {
          const [studentName, classroomName, institutionName, evaluatorName] =
            await Promise.all([
              this.getStudentName(evaluation.studentId),
              this.getClassroomName(evaluation.classroomId),
              this.getInstitutionName(evaluation.institutionId),
              this.getEvaluatorName(evaluation.evaluatedBy),
            ]);

          return {
            ...evaluation,
            studentName,
            classroomName,
            institutionName,
            evaluatedByName: evaluatorName,
          };
        } catch {
          // Si falla, usar valores por defecto
          return {
            ...evaluation,
            studentName: `Estudiante ${evaluation.studentId.substring(0, 8)}`,
            classroomName: `Aula ${evaluation.classroomId.substring(0, 8)}`,
            institutionName: `Institución ${evaluation.institutionId.substring(
              0,
              8
            )}`,
            evaluatedByName: `Evaluador ${evaluation.evaluatedBy.substring(
              0,
              8
            )}`,
          };
        }
      })
    );

    return enrichedEvaluations;
  }

  async getAllEvaluations(): Promise<PsychologicalEvaluation[]> {
    const data = await this.fetchData<PsychologicalEvaluation[]>(API_BASE_URL);
    return this.enrichWithNames(data);
  }

  async getEvaluationById(id: string): Promise<PsychologicalEvaluation> {
    return this.fetchData<PsychologicalEvaluation>(`${API_BASE_URL}/${id}`);
  }

  async createEvaluation(
    data: CreatePsychologicalEvaluationDto
  ): Promise<PsychologicalEvaluation> {
    return this.fetchData<PsychologicalEvaluation>(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async updateEvaluation(
    id: string,
    data: UpdatePsychologicalEvaluationDto
  ): Promise<PsychologicalEvaluation> {
    return this.fetchData<PsychologicalEvaluation>(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async deactivateEvaluation(id: string): Promise<PsychologicalEvaluation> {
    return this.fetchData<PsychologicalEvaluation>(
      `${API_BASE_URL}/${id}/deactivate`,
      {
        method: "PATCH",
      }
    );
  }

  async reactivateEvaluation(id: string): Promise<PsychologicalEvaluation> {
    return this.fetchData<PsychologicalEvaluation>(
      `${API_BASE_URL}/${id}/reactivate`,
      {
        method: "PATCH",
      }
    );
  }

  async getEvaluationsByStudent(
    studentId: string
  ): Promise<PsychologicalEvaluation[]> {
    return this.fetchData<PsychologicalEvaluation[]>(
      `${API_BASE_URL}/student/${studentId}`
    );
  }

  async getEvaluationsByClassroom(
    classroomId: string
  ): Promise<PsychologicalEvaluation[]> {
    return this.fetchData<PsychologicalEvaluation[]>(
      `${API_BASE_URL}/classroom/${classroomId}`
    );
  }

  async getEvaluationsByYear(
    academicYear: number
  ): Promise<PsychologicalEvaluation[]> {
    return this.fetchData<PsychologicalEvaluation[]>(
      `${API_BASE_URL}/year/${academicYear}`
    );
  }

  async getActiveEvaluations(): Promise<PsychologicalEvaluation[]> {
    const data = await this.fetchData<PsychologicalEvaluation[]>(
      `${API_BASE_URL}/active`
    );
    return this.enrichWithNames(data);
  }

  async getInactiveEvaluations(): Promise<PsychologicalEvaluation[]> {
    const data = await this.fetchData<PsychologicalEvaluation[]>(
      `${API_BASE_URL}/inactive`
    );
    return this.enrichWithNames(data);
  }

  // Métodos para obtener listas de referencia (útiles para formularios)
  async getAllStudents(): Promise<Array<{ id: string; name: string }>> {
    return this.fetchData<Array<{ id: string; name: string }>>(
      `${REFERENCE_DATA_URL}/students`
    );
  }

  async getAllClassrooms(): Promise<Array<{ id: string; name: string }>> {
    return this.fetchData<Array<{ id: string; name: string }>>(
      `${REFERENCE_DATA_URL}/classrooms`
    );
  }

  async getAllInstitutions(): Promise<Array<{ id: string; name: string }>> {
    return this.fetchData<Array<{ id: string; name: string }>>(
      `${REFERENCE_DATA_URL}/institutions`
    );
  }

  async getAllEvaluators(): Promise<Array<{ id: string; name: string }>> {
    return this.fetchData<Array<{ id: string; name: string }>>(
      `${REFERENCE_DATA_URL}/evaluators`
    );
  }

  // Métodos públicos para obtener nombres individuales
  async getStudentName(studentId: string): Promise<string> {
    return this.fetchText(`${REFERENCE_DATA_URL}/student/${studentId}`);
  }

  async getClassroomName(classroomId: string): Promise<string> {
    return this.fetchText(`${REFERENCE_DATA_URL}/classroom/${classroomId}`);
  }

  async getInstitutionName(institutionId: string): Promise<string> {
    return this.fetchText(`${REFERENCE_DATA_URL}/institution/${institutionId}`);
  }

  async getEvaluatorName(evaluatorId: string): Promise<string> {
    return this.fetchText(`${REFERENCE_DATA_URL}/evaluator/${evaluatorId}`);
  }
}

export const psychologyService = new PsychologyService();
export default psychologyService;
