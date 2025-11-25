export interface InstitutionFormData {
  // Información de la institución
  institutionInformation: {
    institutionName: string;
    codeInstitution: string;
    modularCode: string;
    institutionType: string;
    institutionLevel: string;
    gender: string;
    slogan: string;
    logoUrl: string;
  };
  // Dirección
  address: {
    street: string;
    district: string;
    province: string;
    department: string;
    postalCode: string;
  };
  // Métodos de contacto
  contactMethods: Array<{
    type: string;
    value: string;
  }>;
  // Configuración académica
  gradingType: string;
  classroomType: string;
  // Horarios
  schedules: Array<{
    type: string;
    entryTime: string;
    exitTime: string;
  }>;
  // Aulas
  classrooms: Array<{
    classroomId?: string;
    classroomName: string;
    classroomAge: string;
    capacity: number;
    color: string;
    status?: string;
  }>;
  // Director
  director: {
    firstName: string;
    lastName: string;
    documentType: string;
    documentNumber: string;
    phone: string;
    email: string;
    role: string;
  };
  // Auxiliares
  auxiliaries: Array<{
    firstName: string;
    lastName: string;
    documentType: string;
    documentNumber: string;
    phone: string;
    email: string;
    role: string;
  }>;
  // Entidades administrativas
  ugel: string;
  dre: string;
}
