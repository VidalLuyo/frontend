export type UUID = string;

export interface Course {
  id?: UUID;
  code: string;
  name: string;
  areaCurricular: string;
  ageLevel: string;
  description: string;
  active?: boolean;
}

export interface Competency {
  id?: UUID;
  code: string;
  name: string;
  description: string;
  orderIndex: number;
}

export interface Capacity {
  id?: UUID;
  code: string;
  name: string;
  description: string;
  orderIndex: number;
}

export interface Performance {
  id?: UUID;
  code: string;
  description: string;
  ageLevel: string;
  orderIndex: number;
}

export interface CatalogRegistration {
  institutionId: UUID; // 👈 ahora obligatorio
  course: Course;
  competency: Competency;
  capacity: Capacity;
  performance: Performance;
}
