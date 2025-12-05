import { usersService } from "../../users/service/User.service";
import { institutionService } from "../../institution/service/Institution.service";

export interface TeacherOption {
     id: string;
     name: string;
}

export interface InstitutionOption {
     id: string;
     name: string;
}

export interface ClassroomOption {
     id: string;
     name: string;
     institutionId: string;
}

export interface CourseOption {
     id: string;
     name: string;
     code: string;
}

interface CourseResponse {
     id: string;
     institutionId: string;
     code: string;
     name: string;
     areaCurricular: string;
     ageLevel: string;
     description: string;
     status: "ACTIVE" | "INACTIVE";
     createdAt: string;
     updatedAt: string;
}

const ACADEMIC_API_URL = "http://localhost:9084/api/v1/courses";

export const externalDataService = {
     async getTeachers(): Promise<TeacherOption[]> {
          try {
               const users = await usersService.getAll();
               const teachers = users.filter(
                    (user) =>
                         user.role === "PROFESOR" 
               );

               return teachers.map((teacher) => ({
                    id: teacher.userId,
                    name: `${teacher.firstName} ${teacher.lastName}`,
               }));
          } catch (error) {
               console.error("Error obteniendo profesores:", error);
               return [];
          }
     },

     async getInstitutions(): Promise<InstitutionOption[]> {
          try {
               const institutions =
                    await institutionService.getActiveInstitutions();

               return institutions.map((institution) => ({
                    id: institution.institutionId,
                    name: institution.institutionInformation.institutionName,
               }));
          } catch (error) {
               console.error("Error obteniendo instituciones:", error);
               return [];
          }
     },

     async getClassroomsByInstitution(
          institutionId: string
     ): Promise<ClassroomOption[]> {
          try {
               if (!institutionId) return [];

               const institution = await institutionService.getInstitutionById(
                    institutionId
               );

               if (!institution.classrooms) return [];

               return institution.classrooms
                    .filter((classroom) => !classroom.deletedAt)
                    .map((classroom) => ({
                         id: classroom.classroomId,
                         name: classroom.classroomName,
                         institutionId: institution.institutionId,
                    }));
          } catch (error) {
               console.error("Error obteniendo aulas:", error);
               return [];
          }
     },

     async getCourses(): Promise<CourseOption[]> {
          try {
               const response = await fetch(ACADEMIC_API_URL);
               if (!response.ok) {
                    console.error("Error al obtener cursos:", response.status);
                    return [];
               }

               const courses: CourseResponse[] = await response.json();

               return courses
                    .filter((course) => course.status === "ACTIVE")
                    .map((course) => ({
                         id: course.id,
                         name: course.name,
                         code: course.code,
                    }));
          } catch (error) {
               console.error("Error obteniendo cursos:", error);
               return [];
          }
     },
};
