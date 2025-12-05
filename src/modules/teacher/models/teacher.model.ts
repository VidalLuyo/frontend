export type AssignmentType = 'REGULAR' | 'SUBSTITUTE' | 'ASSISTANT'
export type Status = 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
export type SessionType = 'INDIVIDUAL' | 'MULTI_CLASSROOM'

export interface TeacherAssignmentSummary {
  id: string
  teacherUserId: string
  teacherName: string
  institutionId: string
  institutionName: string
  assignmentType: AssignmentType
  status: Status
  startDate: string
  endDate: string
  academicYear: string
  totalClassrooms: number
  totalSchedules: number
}

export interface TeacherInfo {
  userId: string
  fullName: string
  email: string
  documentNumber: string
}

export interface ClassroomAssignment {
  id: string
  classroomId: string
  classroomName: string
  classroomAge: string
  isPrimary: boolean
  status: Status
}

export interface ScheduleInfo {
  id: string
  courseId: string
  courseName: string
  dayOfWeek: string
  startTime: string
  endTime: string
  classroomId: string
  classroomName: string
  sessionType: SessionType
  sessionName: string
  status: Status
}

export interface AssignmentStats {
  totalClassrooms: number
  totalSchedules: number
  totalCourses: number
  totalWeeklyHours: number
}

export interface TeacherAssignmentDetail {
  id: string
  teacherUserId: string
  institutionId: string
  assignmentType: AssignmentType
  status: Status
  startDate: string
  endDate: string
  academicYear: string
  notes: string
  createdAt: string
  updatedAt: string
  teacher: TeacherInfo
  classrooms: ClassroomAssignment[]
  schedules: ScheduleInfo[]
  stats: AssignmentStats
}

export interface CreateScheduleDto {
  courseId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  sessionType: SessionType
  sessionName?: string
  classroomId?: string
}

export interface CreateClassroomDto {
  classroomId: string
  isPrimary: boolean
}

export interface CreateTeacherAssignmentDto {
  teacherUserId: string
  institutionId: string
  assignmentType: AssignmentType
  startDate: string
  endDate: string
  notes?: string
  classrooms: CreateClassroomDto[]
  schedules?: CreateScheduleDto[]
}

export interface UpdateTeacherAssignmentDto {
  teacherUserId?: string
  institutionId?: string
  assignmentType?: AssignmentType
  status?: Status
  startDate?: string
  endDate?: string
  notes?: string
  classrooms?: CreateClassroomDto[]
  schedules?: CreateScheduleDto[]
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

export interface PaginationParams {
  page: number
  size: number
  status?: Status
  teacherUserId?: string
  institutionId?: string
}
