import { studentsService } from '../../student/service/Student.service';
import { usersService } from '../../users/service/User.service';
import type { Student } from '../../student/models/student.model';
import type { User, UserStatus, UserRole } from '../../users/models/users.model';

export type BehaviorUserRole = UserRole | 'PROFESOR';

export const behaviorService = {
  // ==================== ESTUDIANTES ====================
  
  async getAllStudents(): Promise<Student[]> {
    return await studentsService.getAll();
  },

  async getStudentById(studentId: string): Promise<Student> {
    return await studentsService.getById(studentId);
  },

  async getStudentByCui(cui: string): Promise<Student> {
    return await studentsService.getByCui(cui);
  },

  async getStudentsForBehavior(institutionId?: string, classroomId?: string): Promise<Student[]> {
    const allStudents = await studentsService.getAll();
    
    let filteredStudents = allStudents;
    
    if (institutionId) {
      filteredStudents = filteredStudents.filter(student => 
        student.institutionId === institutionId
      );
    }
    
    if (classroomId) {
      filteredStudents = filteredStudents.filter(student => 
        student.classroomId === classroomId
      );
    }
    
    return filteredStudents;
  },

  // ==================== USUARIOS ====================
  
  async getAllUsers(): Promise<User[]> {
    return await usersService.getAll();
  },

  async getUserById(userId: string): Promise<User> {
    return await usersService.getById(userId);
  },

  async getUsersByStatus(status: UserStatus): Promise<User[]> {
    return await usersService.getByStatus(status);
  },

  async getUsersByRoles(roles: BehaviorUserRole[]): Promise<User[]> {
    const allUsers = await usersService.getAll();
    
    return allUsers.filter(user => 
      roles.some(role => {
        // Si el rol es PROFESOR, lo tratamos como TUTOR ya que no existe en el modelo original
        if (role === 'PROFESOR') {
          return user.role === 'TUTOR';
        }
        return user.role === role;
      })
    );
  },

  async getAdministrativeUsers(): Promise<User[]> {
    return await this.getUsersByRoles(['ADMIN', 'DIRECTOR', 'AUXILIAR']);
  },


  async getEducationalUsers(): Promise<User[]> {
    return await this.getUsersByRoles(['TUTOR']);
  },

  async getParentUsers(): Promise<User[]> {
    return await this.getUsersByRoles(['PADRE', 'MADRE']);
  },

  async getUsersForBehavior(
    roles?: BehaviorUserRole[], 
    institutionId?: string,
    status?: UserStatus
  ): Promise<User[]> {
    let users = await usersService.getAll();
    
    if (roles && roles.length > 0) {
      users = users.filter(user => 
        roles.some(role => {
          // Si el rol es PROFESOR, lo tratamos como TUTOR ya que no existe en el modelo original
          if (role === 'PROFESOR') {
            return user.role === 'TUTOR';
          }
          return user.role === role;
        })
      );
    }
    
    if (institutionId) {
      users = users.filter(user => user.institutionId === institutionId);
    }
    
    if (status) {
      users = users.filter(user => user.status === status);
    }
    
    return users;
  },

  // ==================== FUNCIONES DE UTILIDAD PARA ESTUDIANTES ====================
  
  async searchStudents(query: string): Promise<Student[]> {
    if (!query.trim()) {
      return await this.getAllStudents();
    }

    const allStudents = await this.getAllStudents();
    const normalizedQuery = query.toLowerCase().trim();
    
    return allStudents.filter(student => {
      if (!student.personalInfo) return false;
      const names = student.personalInfo.names || '';
      const lastNames = student.personalInfo.lastNames || '';
      const documentNumber = student.personalInfo.documentNumber || '';
      const fullName = `${names} ${lastNames}`.toLowerCase();
      
      return names.toLowerCase().includes(normalizedQuery) ||
             lastNames.toLowerCase().includes(normalizedQuery) ||
             documentNumber.includes(normalizedQuery) ||
             fullName.includes(normalizedQuery);
    });
  },

  formatStudentName(student: Student): string {
    if (!student || !student.personalInfo) {
      return 'Nombre no disponible';
    }
    return `${student.personalInfo.names || ''} ${student.personalInfo.lastNames || ''}`.trim();
  },

  formatStudentDisplay(student: Student): string {
    const documentNumber = student.personalInfo?.documentNumber || 'Sin documento';
    return `${this.formatStudentName(student)} (${documentNumber})`;
  },

  // ==================== FUNCIONES DE UTILIDAD PARA USUARIOS ====================
  
  async searchUsers(query: string, roles?: BehaviorUserRole[]): Promise<User[]> {
    if (!query.trim()) {
      return roles ? await this.getUsersByRoles(roles) : await this.getAllUsers();
    }

    const allUsers = roles ? await this.getUsersByRoles(roles) : await this.getAllUsers();
    const normalizedQuery = query.toLowerCase().trim();
    
    return allUsers.filter(user => 
      user.firstName.toLowerCase().includes(normalizedQuery) ||
      user.lastName.toLowerCase().includes(normalizedQuery) ||
      user.documentNumber.includes(normalizedQuery) ||
      user.email.toLowerCase().includes(normalizedQuery) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(normalizedQuery)
    );
  },

  formatUserName(user: User): string {
    if (!user) {
      return 'Usuario no disponible';
    }
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  },

  formatUserDisplay(user: User): string {
    const name = this.formatUserName(user);
    const role = this.getRoleDisplayName(user.role as BehaviorUserRole);
    return `${name} (${role})`;
  },

  getRoleDisplayName(role: BehaviorUserRole): string {
    const roleNames = {
      'ADMIN': 'Administrador',
      'DIRECTOR': 'Director',
      'AUXILIAR': 'Auxiliar',
      'PROFESOR': 'Profesor', 
      'TUTOR': 'Tutor',
      'PADRE': 'Padre',
      'MADRE': 'Madre'
    };
    return roleNames[role] || role;
  },

  getRoleColor(role: BehaviorUserRole): string {
    const colors = {
      'ADMIN': '#9C27B0',
      'DIRECTOR': '#2196F3',
      'AUXILIAR': '#FF9800',
      'PROFESOR': '#4CAF50',
      'TUTOR': '#795548',
      'PADRE': '#607D8B',
      'MADRE': '#E91E63'
    };
    return colors[role] || '#757575';
  }
};