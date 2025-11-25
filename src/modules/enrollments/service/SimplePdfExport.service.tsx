/**
 * Servicio Clean de Exportación PDF para Matrículas
 * Genera documentos PDF con diseño minimalista y profesional
 */

import jsPDF from 'jspdf';
import type { Enrollment } from '../models/enrollments.model';

export class SimplePdfExportService {
  private static readonly COLORS = {
    primary: [37, 99, 235] as [number, number, number],
    secondary: [71, 85, 105] as [number, number, number],
    success: [34, 197, 94] as [number, number, number],
    warning: [245, 158, 11] as [number, number, number],
    danger: [239, 68, 68] as [number, number, number],
    gray: [107, 114, 128] as [number, number, number],
    lightGray: [249, 250, 251] as [number, number, number],
    borderGray: [229, 231, 235] as [number, number, number],
    textGray: [55, 65, 81] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    black: [0, 0, 0] as [number, number, number]
  };

  /**
   * Generar PDF de matrícula individual con diseño limpio
   */
  static async generateEnrollmentPdf(enrollment: Enrollment): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    let yPosition = 15;

    // === ENCABEZADO LIMPIO ===
    yPosition = this.addCleanHeader(doc, pageWidth, yPosition, enrollment);

    // === INFORMACIÓN DE MATRÍCULA ===
    yPosition = this.addEnrollmentInfo(doc, pageWidth, yPosition, enrollment);

    // === INFORMACIÓN DEL ESTUDIANTE ===
    yPosition = this.addStudentInfo(doc, pageWidth, yPosition, enrollment);

    // === INFORMACIÓN ACADÉMICA ===
    yPosition = this.addAcademicInfo(doc, pageWidth, yPosition, enrollment);

    // === DOCUMENTOS ===
    yPosition = this.addDocumentsInfo(doc, pageWidth, yPosition, enrollment);

    // === PIE DE PÁGINA ===
    this.addCleanFooter(doc, pageWidth, pageHeight);

    // Descargar el PDF
    const fileName = `Matricula_${enrollment.studentId}_${enrollment.academicYear}.pdf`;
    doc.save(fileName);
  }

  /**
   * Generar PDF con múltiples matrículas
   */
  static async generateMultipleEnrollmentsPdf(enrollments: Enrollment[]): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    for (let i = 0; i < enrollments.length; i++) {
      if (i > 0) {
        doc.addPage();
      }
      
      let yPosition = 15;
      const enrollment = enrollments[i];

      // Generar contenido limpio para cada matrícula
      yPosition = this.addCleanHeader(doc, pageWidth, yPosition, enrollment);
      yPosition = this.addEnrollmentInfo(doc, pageWidth, yPosition, enrollment);
      yPosition = this.addStudentInfo(doc, pageWidth, yPosition, enrollment);
      yPosition = this.addAcademicInfo(doc, pageWidth, yPosition, enrollment);
      yPosition = this.addDocumentsInfo(doc, pageWidth, yPosition, enrollment);
      this.addCleanFooter(doc, pageWidth, pageHeight);
    }

    const fileName = `Matriculas_${enrollments[0].academicYear}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  /**
   * Encabezado profesional con espacio para logo
   */
  private static addCleanHeader(doc: jsPDF, pageWidth: number, yPosition: number, enrollment: Enrollment): number {
    // Espacio reservado para logo del colegio (esquina superior izquierda)
    doc.setDrawColor(...this.COLORS.borderGray);
    doc.setLineWidth(0.5);
    doc.rect(20, yPosition, 25, 20, 'S'); // Rectángulo para el logo
    
    // Texto indicativo del logo
    doc.setTextColor(...this.COLORS.gray);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('LOGO', 27, yPosition + 8, { align: 'center' });
    doc.text('COLEGIO', 27, yPosition + 12, { align: 'center' });

    // Información institucional en la parte superior derecha
    doc.setTextColor(...this.COLORS.textGray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Institución: ${enrollment.institutionId}`, pageWidth - 20, yPosition + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Año Académico: ${enrollment.academicYear}`, pageWidth - 20, yPosition + 10, { align: 'right' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, pageWidth - 20, yPosition + 15, { align: 'right' });

    yPosition += 25;

    // Línea separadora elegante
    doc.setDrawColor(...this.COLORS.primary);
    doc.setLineWidth(2);
    doc.line(20, yPosition, pageWidth - 20, yPosition);

    yPosition += 8;

    // Título principal centrado y elegante
    doc.setTextColor(...this.COLORS.primary);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICADO DE MATRÍCULA', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 6;

    // Subtítulo
    doc.setTextColor(...this.COLORS.gray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión Educativa', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;

    // Línea decorativa inferior
    doc.setDrawColor(...this.COLORS.borderGray);
    doc.setLineWidth(0.5);
    doc.line(50, yPosition, pageWidth - 50, yPosition);

    return yPosition + 8;
  }

  /**
   * Información de matrícula compacta
   */
  private static addEnrollmentInfo(doc: jsPDF, pageWidth: number, yPosition: number, enrollment: Enrollment): number {
    // Título de sección
    this.addSectionTitle(doc, 20, yPosition, 'INFORMACIÓN DE MATRÍCULA');
    yPosition += 8;

    // Datos en dos columnas para ahorrar espacio
    const leftData = [
      ['ID:', enrollment.id || 'No asignado'],
      ['Código:', enrollment.enrollmentCode || 'Auto'],
      ['Fecha:', enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString('es-PE') : 'N/A']
    ];

    const rightData = [
      ['Estado:', this.getStatusText(enrollment.enrollmentStatus || 'ACTIVE')],
      ['Tipo:', enrollment.enrollmentType === 'NUEVA' ? 'Nueva' : 'Reinscripción'],
      ['Modalidad:', this.getModalityText(enrollment.modality || 'PRESENCIAL')]
    ];

    // Columna izquierda
    leftData.forEach((row, index) => {
      this.addCompactDataRow(doc, 25, yPosition + (index * 6), row[0], row[1]);
    });

    // Columna derecha
    rightData.forEach((row, index) => {
      this.addCompactDataRow(doc, pageWidth / 2 + 10, yPosition + (index * 6), row[0], row[1]);
    });

    return yPosition + 20;
  }

  /**
   * Información del estudiante compacta
   */
  private static addStudentInfo(doc: jsPDF, pageWidth: number, yPosition: number, enrollment: Enrollment): number {
    // Título de sección
    this.addSectionTitle(doc, 20, yPosition, 'INFORMACIÓN DEL ESTUDIANTE');
    yPosition += 8;

    // Datos del estudiante en dos columnas
    const leftData = [
      ['ID Estudiante:', enrollment.studentId],
      ['Edad:', `${enrollment.studentAge || 'N/A'} años`]
    ];

    const rightData = [
      ['Grupo Edad:', this.getAgeGroupText(enrollment.ageGroup || 'N/A')],
      ['Nivel:', this.getEducationalLevelText(enrollment.educationalLevel || 'INICIAL')]
    ];

    // Columna izquierda
    leftData.forEach((row, index) => {
      this.addCompactDataRow(doc, 25, yPosition + (index * 6), row[0], row[1]);
    });

    // Columna derecha
    rightData.forEach((row, index) => {
      this.addCompactDataRow(doc, pageWidth / 2 + 10, yPosition + (index * 6), row[0], row[1]);
    });

    return yPosition + 15;
  }

  /**
   * Información académica compacta
   */
  private static addAcademicInfo(doc: jsPDF, pageWidth: number, yPosition: number, enrollment: Enrollment): number {
    // Título de sección
    this.addSectionTitle(doc, 20, yPosition, 'INFORMACIÓN ACADÉMICA');
    yPosition += 8;

    // Datos académicos en dos columnas
    const leftData = [
      ['Año:', enrollment.academicYear],
      ['Período:', enrollment.academicPeriodId || 'N/A'],
      ['Aula:', enrollment.classroomId]
    ];

    const rightData = [
      ['Turno:', enrollment.shift || 'N/A'],
      ['Sección:', enrollment.section || 'N/A'],
      ['Modalidad:', this.getModalityText(enrollment.modality || 'PRESENCIAL')]
    ];

    // Columna izquierda
    leftData.forEach((row, index) => {
      this.addCompactDataRow(doc, 25, yPosition + (index * 6), row[0], row[1]);
    });

    // Columna derecha
    rightData.forEach((row, index) => {
      this.addCompactDataRow(doc, pageWidth / 2 + 10, yPosition + (index * 6), row[0], row[1]);
    });

    yPosition += 20;

    // Campos adicionales si existen (compactos)
    if (enrollment.previousInstitution) {
      this.addCompactDataRow(doc, 25, yPosition, 'Inst. Anterior:', enrollment.previousInstitution);
      yPosition += 6;
    }

    if (enrollment.observations) {
      this.addCompactDataRow(doc, 25, yPosition, 'Observaciones:', enrollment.observations);
      yPosition += 6;
    }

    return yPosition + 8;
  }

  /**
   * Información de documentos ultra compacta
   */
  private static addDocumentsInfo(doc: jsPDF, pageWidth: number, yPosition: number, enrollment: Enrollment): number {
    const documents = [
      { key: 'birthCertificate', label: 'Cert. Nacimiento', required: true },
      { key: 'studentDni', label: 'DNI Estudiante', required: true },
      { key: 'guardianDni', label: 'DNI Apoderado', required: true },
      { key: 'vaccinationCard', label: 'Carné Vacunas', required: true },
      { key: 'disabilityCertificate', label: 'Cert. Discapacidad', required: false },
      { key: 'utilityBill', label: 'Recibo Servicios', required: true },
      { key: 'psychologicalReport', label: 'Inf. Psicológico', required: false },
      { key: 'studentPhoto', label: 'Foto Estudiante', required: true },
      { key: 'healthRecord', label: 'Ficha Salud', required: true },
      { key: 'signedEnrollmentForm', label: 'Form. Firmado', required: true },
      { key: 'dniVerification', label: 'Verif. DNI', required: true }
    ];

    // Calcular progreso
    const totalDocs = documents.length;
    const deliveredDocs = documents.filter(doc => 
      enrollment[doc.key as keyof Enrollment] as boolean
    ).length;
    const progress = Math.round((deliveredDocs / totalDocs) * 100);

    // Título de sección
    this.addSectionTitle(doc, 20, yPosition, 'DOCUMENTOS REQUERIDOS');
    yPosition += 8;

    // Barra de progreso compacta
    this.addCompactProgressBar(doc, 25, yPosition, pageWidth - 50, deliveredDocs, totalDocs, progress);
    yPosition += 10;

    // Lista de documentos en dos columnas organizadas
    const colWidth = (pageWidth - 60) / 2;
    const midPoint = Math.ceil(documents.length / 2);
    const leftDocs = documents.slice(0, midPoint);
    const rightDocs = documents.slice(midPoint);
    
    // Columna izquierda
    leftDocs.forEach((docItem, index) => {
      const isDelivered = enrollment[docItem.key as keyof Enrollment] as boolean;
      this.addUltraCompactDocumentRow(doc, 25, yPosition + (index * 5), docItem.label, docItem.required, isDelivered);
    });
    
    // Columna derecha
    rightDocs.forEach((docItem, index) => {
      const isDelivered = enrollment[docItem.key as keyof Enrollment] as boolean;
      this.addUltraCompactDocumentRow(doc, 25 + colWidth, yPosition + (index * 5), docItem.label, docItem.required, isDelivered);
    });

    // Nota explicativa
    yPosition += (midPoint * 5) + 5;
    doc.setTextColor(...this.COLORS.gray);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'italic');
    doc.text('* Documento obligatorio', 25, yPosition);

    return yPosition + 5;
  }

  /**
   * Pie de página profesional
   */
  private static addCleanFooter(doc: jsPDF, pageWidth: number, pageHeight: number): void {
    const footerY = pageHeight - 20;

    // Banda del pie de página
    doc.setFillColor(...this.COLORS.lightGray);
    doc.rect(0, footerY - 5, pageWidth, 15, 'F');

    // Línea superior decorativa
    doc.setDrawColor(...this.COLORS.primary);
    doc.setLineWidth(1);
    doc.line(0, footerY - 5, pageWidth, footerY - 5);

    // Información del pie
    doc.setTextColor(...this.COLORS.textGray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    const currentDate = new Date().toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const currentTime = new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Información izquierda
    doc.text(`${currentDate} a las ${currentTime}`, 20, footerY);
    
    // Información derecha
    doc.text('Sistema de Gestión Educativa', pageWidth - 20, footerY, { align: 'right' });
    
    // Información central
    doc.setFont('helvetica', 'bold');
    doc.text('Certificado Oficial de Matrícula', pageWidth / 2, footerY, { align: 'center' });

    // Línea inferior decorativa
    doc.setDrawColor(...this.COLORS.borderGray);
    doc.setLineWidth(0.5);
    doc.line(20, footerY + 3, pageWidth - 20, footerY + 3);
  }

  /**
   * Título de sección profesional
   */
  private static addSectionTitle(doc: jsPDF, x: number, y: number, title: string): void {
    // Fondo sutil para el título
    doc.setFillColor(...this.COLORS.lightGray);
    doc.rect(x - 2, y - 3, 120, 8, 'F');

    // Título
    doc.setTextColor(...this.COLORS.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, x, y + 1);

    // Línea decorativa
    doc.setDrawColor(...this.COLORS.primary);
    doc.setLineWidth(1);
    doc.line(x, y + 3, x + 60, y + 3);
  }

  /**
   * Fila de datos mejorada
   */
  private static addCompactDataRow(doc: jsPDF, x: number, y: number, label: string, value: string): void {
    // Punto decorativo
    doc.setFillColor(...this.COLORS.primary);
    doc.circle(x - 1, y - 1, 0.5, 'F');

    // Etiqueta
    doc.setTextColor(...this.COLORS.secondary);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x + 2, y);

    // Valor
    doc.setTextColor(...this.COLORS.black);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    // Truncar texto si es muy largo
    const truncatedValue = value.length > 28 ? value.substring(0, 25) + '...' : value;
    doc.text(truncatedValue, x + 30, y);
  }

  /**
   * Barra de progreso profesional
   */
  private static addCompactProgressBar(doc: jsPDF, x: number, y: number, width: number, completed: number, total: number, percentage: number): void {
    // Panel de progreso con fondo
    doc.setFillColor(...this.COLORS.lightGray);
    doc.roundedRect(x - 2, y - 2, width + 4, 12, 2, 2, 'F');

    // Texto de progreso
    doc.setTextColor(...this.COLORS.textGray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Progreso de Documentos: ${completed}/${total} (${percentage}%)`, x, y + 2);

    // Barra de progreso con bordes redondeados
    const barY = y + 5;
    const barHeight = 3;
    const progressWidth = (width * percentage) / 100;

    // Fondo de la barra
    doc.setFillColor(...this.COLORS.borderGray);
    doc.roundedRect(x, barY, width, barHeight, 1, 1, 'F');

    // Progreso de la barra
    const progressColor = percentage === 100 ? this.COLORS.success : 
                         percentage >= 70 ? this.COLORS.warning : this.COLORS.danger;
    doc.setFillColor(...progressColor);
    doc.roundedRect(x, barY, progressWidth, barHeight, 1, 1, 'F');

    // Porcentaje al final de la barra
    doc.setTextColor(...this.COLORS.white);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    if (progressWidth > 15) {
      doc.text(`${percentage}%`, x + progressWidth - 8, barY + 2);
    }
  }

  /**
   * Fila de documento mejorada
   */
  private static addUltraCompactDocumentRow(doc: jsPDF, x: number, y: number, label: string, required: boolean, delivered: boolean): void {
    // Icono de estado con fondo circular
    const statusColor = delivered ? this.COLORS.success : this.COLORS.danger;
    const bgColor = delivered ? [220, 252, 231] as [number, number, number] : [254, 226, 226] as [number, number, number];
    
    // Fondo circular para el estado
    doc.setFillColor(...bgColor);
    doc.circle(x + 1, y - 1, 1.5, 'F');

    // Estado
    const status = delivered ? '✓' : '✗';
    doc.setTextColor(...statusColor);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(status, x + 0.5, y);

    // Texto del documento
    doc.setTextColor(...this.COLORS.textGray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    const requirementText = required ? ' *' : '';
    const truncatedLabel = label.length > 18 ? label.substring(0, 15) + '...' : label;
    
    doc.text(`${truncatedLabel}${requirementText}`, x + 4, y);

    // Asterisco en rojo para documentos obligatorios
    if (required) {
      doc.setTextColor(...this.COLORS.danger);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text('*', x + 4 + truncatedLabel.length * 0.8, y);
    }
  }

  /**
   * Utilidades de formato
   */
  private static getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'Activa',
      'INACTIVE': 'Inactiva',
      'PENDING': 'Pendiente',
      'CANCELLED': 'Cancelada'
    };
    return statusMap[status] || status;
  }

  private static getModalityText(modality: string): string {
    const modalityMap: Record<string, string> = {
      'PRESENCIAL': 'Presencial',
      'VIRTUAL': 'Virtual',
      'HIBRIDA': 'Híbrida'
    };
    return modalityMap[modality] || modality;
  }

  private static getEducationalLevelText(level: string): string {
    const levelMap: Record<string, string> = {
      'INICIAL': 'Educación Inicial',
      'PRIMARIA': 'Educación Primaria',
      'SECUNDARIA': 'Educación Secundaria'
    };
    return levelMap[level] || level;
  }

  private static getAgeGroupText(ageGroup: string): string {
    const ageGroupMap: Record<string, string> = {
      '3_AÑOS': '3 años',
      '4_AÑOS': '4 años',
      '5_AÑOS': '5 años'
    };
    return ageGroupMap[ageGroup] || ageGroup;
  }
}

export default SimplePdfExportService;