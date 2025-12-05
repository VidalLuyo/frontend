// ================= TIPOS PRINCIPALES =================

export type AchievementLevel = "A" | "B" | "C";

export interface StudentEvaluationRequest {
  studentId: string;
  enrollmentId: string;
  classroomId: string;
  institutionId: string;
  courseId: string;
  competencyId: string;
  academicYear: number;
  achievementLevel: AchievementLevel;
  description: string;
  evaluatedBy: string;         // ✅ ENVÍA UUID (se usa con select de docentes)
  evaluationDate: string;
  observations: string;
  activityContext: string;
  evidenceUrls: string[];
}

export interface StudentEvaluationResponse extends StudentEvaluationRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ================= MAESTROS =================

export interface Institution {
  id: string;
  name: string;
}

export interface Classroom {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  fullName: string;
  enrollmentId: string;
}

// ================= TIPOS DE BACKEND =================

export interface Course {
  id: string;
  name: string;
}

export interface Competency {
  id: string;
  code: string;
  description: string;
}

// ================= DOCENTES / EVALUADORES ✅ =================

export interface Teacher {
  id: string;   // UUID REAL
  name: string;
}

export const TEACHERS: Teacher[] = [
  {
    id: "77777777-7777-7777-7777-777777777777",
    name: "Karina Pérez"
  },
  {
    id: "88888888-8888-8888-8888-888888888888",
    name: "Luis Mendoza"
  },
  {
    id: "99999999-9999-9999-9999-999999999999",
    name: "Ana Torres"
  }
];

// ================= CONSTANTES CON UUID REALES =================

// ---- INSTITUCIONES
export const INSTITUTIONS: Institution[] = [
  {
    id: "44444444-4444-4444-4444-444444444441",
    name: "IE Vallegrande Central"
  },
  {
    id: "44444444-4444-4444-4444-444444444442",
    name: "IE Vallegrande Norte"
  },
  {
    id: "44444444-4444-4444-4444-444444444443",
    name: "IE Vallegrande Sur"
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "IE Vallegrande Este"
  },
  {
    id: "44444444-4444-4444-4444-444444444445",
    name: "IE Vallegrande Oeste"
  }
];

// ---- AULAS
export const CLASSROOMS: Classroom[] = [
  {
    id: "33333333-3333-3333-3333-333333333331",
    name: "Aula Amarilla"
  },
  {
    id: "33333333-3333-3333-3333-333333333332",
    name: "Aula Azul"
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Aula Roja"
  },
  {
    id: "33333333-3333-3333-3333-333333333334",
    name: "Aula Morada"
  },
  {
    id: "33333333-3333-3333-3333-333333333335",
    name: "Aula Celeste"
  }
];

// ---- ESTUDIANTES
export const STUDENTS: Student[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    fullName: "Ana Lopez",
    enrollmentId: "22222222-2222-2222-2222-222222222221"
  },
  {
    id: "11111111-1111-1111-1111-111111111112",
    fullName: "Bruno Perez",
    enrollmentId: "22222222-2222-2222-2222-222222222222"
  },
  {
    id: "11111111-1111-1111-1111-111111111113",
    fullName: "Carlos Diaz",
    enrollmentId: "22222222-2222-2222-2222-222222222223"
  },
  {
    id: "11111111-1111-1111-1111-111111111114",
    fullName: "Daniela Torres",
    enrollmentId: "22222222-2222-2222-2222-222222222224"
  },
  {
    id: "11111111-1111-1111-1111-111111111115",
    fullName: "Elena Garcia",
    enrollmentId: "22222222-2222-2222-2222-222222222225"
  },
  {
    id: "11111111-1111-1111-1111-111111111116",
    fullName: "Fernando Ruiz",
    enrollmentId: "22222222-2222-2222-2222-222222222226"
  },
  {
    id: "11111111-1111-1111-1111-111111111117",
    fullName: "Gabriela Castro",
    enrollmentId: "22222222-2222-2222-2222-222222222227"
  },
  {
    id: "11111111-1111-1111-1111-111111111118",
    fullName: "Hugo Fernández",
    enrollmentId: "22222222-2222-2222-2222-222222222228"
  },
  {
    id: "11111111-1111-1111-1111-111111111119",
    fullName: "Isabel Ramos",
    enrollmentId: "22222222-2222-2222-2222-222222222229"
  },
  {
    id: "11111111-1111-1111-1111-111111111110",
    fullName: "Jorge Medina",
    enrollmentId: "22222222-2222-2222-2222-222222222230"
  }
];
