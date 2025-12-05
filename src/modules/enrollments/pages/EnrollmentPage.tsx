/**
 * Página: EnrollmentPage
 * Página principal del módulo de Matrículas - Gestión completa de matrículas y períodos académicos
 * Consolidada con funcionalidad de IntegratedEnrollmentPage
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  X, 
  User, 
  CheckCircle,
  XCircle,
  Users,
  RefreshCw,
  Calendar,
  Building,
  GraduationCap,
  Clock
} from "lucide-react";
import { 
  enrollmentService, 
  academicPeriodService,
  handleApiError,
  validateAndCreate,
  validateAndUpdate,
  validateAndCreatePeriod,
  validateAndUpdatePeriod
} from "../service";
import { studentIntegrationService, institutionIntegrationService } from "../service/Integration.service";
import type { StudentResponse, InstitutionWithUsersAndClassroomsResponseDto, Classroom } from "../models/integration.model";
// Configuración local
const INTEGRATION_CONFIG = {
  ENABLE_LOGGING: import.meta.env.DEV === true,
} as const;
import type { Enrollment, AcademicPeriod } from "../models/enrollments.model";
import { EnrollmentForm } from "../components/EnrollmentForm";
import { AcademicPeriodForm } from "../components/AcademicPeriodForm";
import { EnrollmentList } from "../components/EnrollmentList";
import { IntegratedEnrollmentForm } from "../components/IntegratedEnrollmentForm";

import { Modal } from "../components/Modal";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/**
 * Módulo: Gestión de Matrículas y Períodos Académicos
 * Este módulo maneja la gestión transaccional de matrículas y períodos académicos de estudiantes
 */

export function EnrollmentPage() {
  // Estados locales para manejar datos
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  // Estados del formulario de matrículas
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  
  // Estados del formulario de períodos académicos
  const [showAcademicPeriodForm, setShowAcademicPeriodForm] = useState(false);
  const [editingAcademicPeriod, setEditingAcademicPeriod] = useState<AcademicPeriod | null>(null);
  
  // Estados del modal de detalles
  const [showEnrollmentDetail, setShowEnrollmentDetail] = useState(false);
  const [detailEnrollment, setDetailEnrollment] = useState<Enrollment | null>(null);
  
  // Estado del modal de matrícula integrada
  const [showIntegratedEnrollmentForm, setShowIntegratedEnrollmentForm] = useState(false);
  
  // Estados para datos reales del modal de detalles
  const [detailStudentData, setDetailStudentData] = useState<StudentResponse | null>(null);
  const [detailInstitutionData, setDetailInstitutionData] = useState<InstitutionWithUsersAndClassroomsResponseDto | null>(null);
  const [detailClassroomData, setDetailClassroomData] = useState<Classroom | null>(null);
  const [loadingDetailData, setLoadingDetailData] = useState(false);
  
  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    academicYear: "",
    ageGroup: "",
    shift: "",
    modality: ""
  });
  
  // Estado de notificaciones
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [activeTab, setActiveTab] = useState<"enrollments" | "academicPeriods">("enrollments");
  const [deletedEnrollments, setDeletedEnrollments] = useState<Enrollment[]>([]);

  // Handlers memoizados para filtros
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      status: "",
      type: "",
      academicYear: "",
      ageGroup: "",
      shift: "",
      modality: ""
    });
  }, []);

  const handleTabChange = useCallback((tab: "enrollments" | "academicPeriods") => {
    setActiveTab(tab);
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadInitialData();
  }, []);

  // Funciones para manejar las APIs
  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      // Usar getNonDeletedEnrollments para obtener solo las matrículas no eliminadas
      const data = await enrollmentService.getNonDeletedEnrollments();
      setEnrollments(data);
      return data;
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchCancelledEnrollments = async () => {
    try {
      const data = await enrollmentService.getCancelledEnrollmentsOnly();
      setDeletedEnrollments(data);
      return data;
    } catch (err) {
      console.error("❌ Error fetching cancelled enrollments:", err);
      const errorMsg = handleApiError(err);
      showNotification('error', `Error al cargar matrículas canceladas: ${errorMsg}`);
      throw err;
    }
  };

  const fetchAcademicPeriods = async () => {
    try {
      setLoading(true);
      const data = await academicPeriodService.getAllAcademicPeriods();
      setAcademicPeriods(data);
      return data;
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = useCallback(async () => {
    try {
      // Probar endpoints si estamos en modo desarrollo

      
      await Promise.all([
        fetchEnrollments(),
        fetchAcademicPeriods(),
        fetchCancelledEnrollments() // Cargar canceladas automáticamente
      ]);
      
      console.log("✅ Successfully loaded data - Enrollments:", enrollments.length, "Academic Periods:", academicPeriods.length, "Cancelled:", deletedEnrollments.length);
      
    } catch (err) {
      console.error("❌ Error fetching initial data:", err);
      showNotification('error', "Error al cargar los datos. Verifique la conexión con el servidor.");
    }
  }, []);

  // Mostrar notificación
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // Funciones de utilidad - Memoizadas para optimización
  const getStatusBadgeClass = useCallback((status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activo';
      case 'INACTIVE': return 'Inactivo';
      case 'PENDING': return 'Pendiente';
      case 'COMPLETED': return 'Completado';
      default: return status;
    }
  }, []);

  const getEnrollmentTypeText = useCallback((type: string) => {
    switch (type) {
      case 'NUEVA': return 'Nueva';
      case 'REINSCRIPCION': return 'Reinscripción';
      default: return type;
    }
  }, []);

  const getModalityText = useCallback((modality: string) => {
    switch (modality) {
      case 'PRESENCIAL': return 'Presencial';
      case 'VIRTUAL': return 'Virtual';
      case 'HIBRIDA': return 'Híbrida';
      default: return modality;
    }
  }, []);

  const getAgeGroupText = useCallback((ageGroup: string) => {
    switch (ageGroup) {
      case '3_AÑOS': return '3 años';
      case '4_AÑOS': return '4 años';
      case '5_AÑOS': return '5 años';
      default: return ageGroup;
    }
  }, []);

  const calculateDocumentProgress = useCallback((enrollment: Enrollment) => {
    const documents = [
      enrollment.birthCertificate,
      enrollment.studentDni,
      enrollment.guardianDni,
      enrollment.vaccinationCard,
      enrollment.disabilityCertificate,
      enrollment.utilityBill,
      enrollment.psychologicalReport,
      enrollment.studentPhoto,
      enrollment.healthRecord,
      enrollment.signedEnrollmentForm,
      enrollment.dniVerification
    ];
    
    const completed = documents.filter(Boolean).length;
    const total = documents.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  }, []);



  const handleEditEnrollment = useCallback((enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);
    setShowEnrollmentForm(true);
  }, []);

  const handleSaveEnrollment = useCallback(async (enrollment: Enrollment) => {
    // Mostrar confirmación antes de guardar
    const isEditing = !!enrollment.id;
    const result = await Swal.fire({
      title: isEditing ? '¿Actualizar matrícula?' : '¿Crear nueva matrícula?',
      text: isEditing 
        ? 'Se actualizarán los datos de la matrícula seleccionada.' 
        : 'Se creará una nueva matrícula con los datos ingresados.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isEditing ? 'Sí, actualizar' : 'Sí, crear',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
    });

    if (!result.isConfirmed) return;

    try {
      if (enrollment.id) {
        const updatedEnrollment = await validateAndUpdate(enrollment.id, enrollment);
        
        // Mostrar alerta de éxito
        await Swal.fire({
          title: '¡Actualizado!',
          text: 'La matrícula ha sido actualizada correctamente.',
          icon: 'success',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#059669',
          timer: 2000,
          timerProgressBar: true
        });
        
        // Actualizar la lista local con los datos del backend
        setEnrollments(prev => prev.map(e => e.id === enrollment.id ? updatedEnrollment : e));
      } else {
        const newEnrollment = await validateAndCreate(enrollment);
        
        // Mostrar alerta de éxito
        await Swal.fire({
          title: '¡Creado!',
          text: 'La matrícula ha sido creada correctamente.',
          icon: 'success',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#059669',
          timer: 2000,
          timerProgressBar: true
        });
        
        // Agregar a la lista local
        setEnrollments(prev => [...prev, newEnrollment]);
      }
      setShowEnrollmentForm(false);
      setEditingEnrollment(null);
    } catch (err) {
      console.error("❌ Error saving enrollment:", err);
      const errorMessage = handleApiError(err);
      
      // Mostrar alerta de error
      await Swal.fire({
        title: '¡Error!',
        text: `Error al guardar la matrícula: ${errorMessage}`,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc2626'
      });
    }
  }, [showNotification]);

  const handleCreateAcademicPeriod = useCallback(() => {
    setEditingAcademicPeriod(null);
    setShowAcademicPeriodForm(true);
  }, []);

  const handleEditAcademicPeriod = useCallback((period: AcademicPeriod) => {
    setEditingAcademicPeriod(period);
    setShowAcademicPeriodForm(true);
  }, []);

  const handleSaveAcademicPeriod = useCallback(async (period: AcademicPeriod) => {
    // Mostrar confirmación antes de guardar
    const isEditing = !!period.id;
    const result = await Swal.fire({
      title: isEditing ? '¿Actualizar período académico?' : '¿Crear nuevo período académico?',
      text: isEditing 
        ? 'Se actualizarán los datos del período académico seleccionado.' 
        : 'Se creará un nuevo período académico con los datos ingresados.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isEditing ? 'Sí, actualizar' : 'Sí, crear',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#6b7280',
    });

    if (!result.isConfirmed) return;

    try {
      if (period.id) {
        await validateAndUpdatePeriod(period.id, period);
        
        // Mostrar alerta de éxito
        await Swal.fire({
          title: '¡Actualizado!',
          text: 'El período académico ha sido actualizado correctamente.',
          icon: 'success',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#7c3aed',
          timer: 2000,
          timerProgressBar: true
        });
        
        // Actualizar la lista local
        setAcademicPeriods(prev => prev.map(p => p.id === period.id ? period : p));
      } else {
        const newPeriod = await validateAndCreatePeriod(period);
        
        // Mostrar alerta de éxito
        await Swal.fire({
          title: '¡Creado!',
          text: 'El período académico ha sido creado correctamente.',
          icon: 'success',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#7c3aed',
          timer: 2000,
          timerProgressBar: true
        });
        
        // Agregar a la lista local
        setAcademicPeriods(prev => [...prev, newPeriod]);
      }
      setShowAcademicPeriodForm(false);
      setEditingAcademicPeriod(null);
    } catch (err) {
      console.error("❌ Error saving academic period:", err);
      const errorMessage = handleApiError(err);
      
      // Mostrar alerta de error
      await Swal.fire({
        title: '¡Error!',
        text: `Error al guardar el período académico: ${errorMessage}`,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc2626'
      });
    }
  }, [showNotification]);

  // Manejar cancelación de matrícula (cambiar a CANCELLED)
  const handleCancelEnrollment = useCallback(async (id: string) => {
    if (!id) return;
    
    const result = await Swal.fire({
      title: '¿Cancelar matrícula?',
      text: 'Esta acción cambiará el estado de la matrícula a CANCELADA. Podrá restaurarla posteriormente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No cancelar',
      reverseButtons: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });
    
    if (result.isConfirmed) {
      try {
        console.log(`🚫 Cancelando matrícula: ${id} usando nuevo endpoint PUT /status`);
        
        const cancelledEnrollment = await enrollmentService.cancelEnrollment(id);
        console.log(`✅ Matrícula cancelada exitosamente:`, {
          id: cancelledEnrollment.id,
          status: cancelledEnrollment.enrollmentStatus,
          studentId: cancelledEnrollment.studentId
        });
        
        showNotification('success', `Matrícula ${id} cancelada correctamente (Estado: ${cancelledEnrollment.enrollmentStatus})`);
        
        // Remover de la lista principal y agregar a canceladas
        setEnrollments(prev => prev.filter(e => e.id !== id));
        setDeletedEnrollments(prev => [...prev, cancelledEnrollment]);
      } catch (err) {
        console.error("❌ Error cancelling enrollment:", err);
        const errorMessage = handleApiError(err);
        
        // Si la matrícula no existe, removerla de la lista local
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          console.warn(`⚠️ Matrícula ${id} no existe en el backend, removiendo de la lista local`);
          setEnrollments(prev => prev.filter(e => e.id !== id));
          showNotification('error', `La matrícula ${id} ya no existe en el servidor. Se ha removido de la lista.`);
        } else {
          showNotification('error', `Error al cancelar la matrícula ${id}: ${errorMessage}`);
        }
      }
    }
  }, [showNotification, enrollments]);

  // Manejar restauración de matrícula (cambiar a PENDING)
  const handleRestoreEnrollment = useCallback(async (id: string) => {
    if (!id) return;
    
    const result = await Swal.fire({
      title: '¿Restaurar matrícula?',
      text: 'Esta acción cambiará el estado de la matrícula a PENDIENTE.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
    });
    
    if (result.isConfirmed) {
      try {
        console.log(`🔄 Restaurando matrícula: ${id} usando nuevo endpoint PUT /status`);
        
        const restoredEnrollment = await enrollmentService.setPendingEnrollment(id);
        console.log(`✅ Matrícula restaurada exitosamente:`, {
          id: restoredEnrollment.id,
          status: restoredEnrollment.enrollmentStatus,
          studentId: restoredEnrollment.studentId
        });
        
        showNotification('success', `Matrícula ${id} restaurada como PENDIENTE (Estado: ${restoredEnrollment.enrollmentStatus})`);
        
        // Remover de canceladas y agregar a la lista principal
        setDeletedEnrollments(prev => prev.filter(e => e.id !== id));
        setEnrollments(prev => [...prev, restoredEnrollment]);
      } catch (err) {
        console.error("❌ Error restoring enrollment:", err);
        const errorMessage = handleApiError(err);
        showNotification('error', `Error al restaurar la matrícula ${id}: ${errorMessage}`);
      }
    }
  }, [showNotification]);

  // Manejar activación de matrícula (cambiar a ACTIVE)
  const handleActivateEnrollment = useCallback(async (id: string) => {
    if (!id) return;
    
    const result = await Swal.fire({
      title: '¿Activar matrícula?',
      text: 'Esta acción cambiará el estado de la matrícula a ACTIVA.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
    });
    
    if (result.isConfirmed) {
      try {
        console.log(`✅ Activando matrícula: ${id} usando nuevo endpoint PUT /status`);
        
        const activatedEnrollment = await enrollmentService.activateEnrollment(id);
        console.log(`✅ Matrícula activada exitosamente:`, {
          id: activatedEnrollment.id,
          status: activatedEnrollment.enrollmentStatus,
          studentId: activatedEnrollment.studentId
        });
        
        showNotification('success', `Matrícula ${id} activada correctamente (Estado: ${activatedEnrollment.enrollmentStatus})`);
        
        // Actualizar en la lista local
        setEnrollments(prev => prev.map(e => 
          e.id === id ? activatedEnrollment : e
        ));
      } catch (err) {
        console.error("❌ Error activating enrollment:", err);
        const errorMessage = handleApiError(err);
        
        // Si la matrícula no existe, removerla de la lista local
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          console.warn(`⚠️ Matrícula ${id} no existe en el backend, removiendo de la lista local`);
          setEnrollments(prev => prev.filter(e => e.id !== id));
          showNotification('error', `La matrícula ${id} ya no existe en el servidor. Se ha removido de la lista.`);
        } else {
          showNotification('error', `Error al activar la matrícula ${id}: ${errorMessage}`);
        }
      }
    }
  }, [showNotification]);

  const handleDeleteAcademicPeriod = useCallback(async (id: string) => {
    if (!id) return;
    
    const result = await Swal.fire({
      title: '¿Eliminar período académico?',
      text: 'Esta acción marcará el período como eliminado (soft delete). ¿Desea continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });
    
    if (result.isConfirmed) {
      try {
        await academicPeriodService.deleteAcademicPeriod(id);
        showNotification('success', 'Período académico eliminado correctamente');
        // Remover de la lista local
        setAcademicPeriods(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error("❌ Error deleting academic period:", err);
        const errorMessage = handleApiError(err);
        showNotification('error', `Error al eliminar el período académico: ${errorMessage}`);
      }
    }
  }, [showNotification]);

  // Cargar datos reales para el modal de detalles
  const loadDetailData = useCallback(async (enrollment: Enrollment) => {
    setLoadingDetailData(true);
    try {
      const [studentData, institutionData, classroomData] = await Promise.allSettled([
        studentIntegrationService.getStudentById(enrollment.studentId),
        institutionIntegrationService.getInstitutionById(enrollment.institutionId),
        institutionIntegrationService.getClassroomById(enrollment.classroomId)
      ]);

      // Manejar respuesta del estudiante
      if (studentData.status === 'fulfilled' && studentData.value.success) {
        setDetailStudentData(studentData.value);
      } else {
        setDetailStudentData(null);
        console.warn('No se pudo cargar datos del estudiante:', studentData);
      }

      // Manejar respuesta de la institución
      if (institutionData.status === 'fulfilled') {
        setDetailInstitutionData(institutionData.value);
      } else {
        setDetailInstitutionData(null);
        console.warn('No se pudo cargar datos de la institución:', institutionData);
      }

      // Manejar respuesta del aula
      if (classroomData.status === 'fulfilled') {
        setDetailClassroomData(classroomData.value);
      } else {
        setDetailClassroomData(null);
        console.warn('No se pudo cargar datos del aula:', classroomData);
      }
    } catch (error) {
      console.error('Error cargando datos del modal:', error);
    } finally {
      setLoadingDetailData(false);
    }
  }, []);

  // Manejar vista de detalles - Memoizada para optimización
  const handleViewEnrollmentDetail = useCallback((enrollment: Enrollment) => {
    setDetailEnrollment(enrollment);
    setShowEnrollmentDetail(true);
    // Cargar datos reales
    loadDetailData(enrollment);
  }, [loadDetailData]);



  // Filtrar matrículas localmente - Memoizado para optimización
  const filteredEnrollments = useMemo(() => {
    // Si se filtra por CANCELLED, usar las matrículas canceladas
    const sourceEnrollments = filters.status === 'CANCELLED' 
      ? deletedEnrollments 
      : enrollments;

    return sourceEnrollments.filter(enrollment => {
      if (filters.status && enrollment.enrollmentStatus !== filters.status) return false;
      if (filters.shift && enrollment.shift !== filters.shift) return false;
      if (filters.ageGroup && enrollment.ageGroup !== filters.ageGroup) return false;
      if (filters.modality && enrollment.modality !== filters.modality) return false;
      if (filters.type && enrollment.enrollmentType !== filters.type) return false;
      if (filters.academicYear && enrollment.academicYear !== filters.academicYear) return false;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = [
          enrollment.studentId,
          enrollment.observations,
          enrollment.enrollmentCode,
          enrollment.id
        ].filter(Boolean);
        
        const matches = searchableFields.some(field => 
          field?.toLowerCase().includes(searchLower)
        );
        
        if (!matches) return false;
      }
      
      return true;
    });
  }, [enrollments, deletedEnrollments, searchTerm, filters]);

  // Estadísticas de matrículas - Memoizadas para optimización
  const enrollmentStats = useMemo(() => ({
    total: enrollments.length,
    active: enrollments.filter(e => e.enrollmentStatus === 'ACTIVE').length,
    pending: enrollments.filter(e => e.enrollmentStatus === 'PENDING').length,
    cancelled: deletedEnrollments.length, // Usar las canceladas cargadas
  }), [enrollments, deletedEnrollments]);

  const periodStats = useMemo(() => ({
    total: academicPeriods.length,
    active: academicPeriods.filter(p => p.status === 'ACTIVE').length,
    closed: academicPeriods.filter(p => p.status === 'CLOSED').length,
    inactive: academicPeriods.filter(p => p.status === 'INACTIVE').length,
  }), [academicPeriods]);

  // Mostrar loading si está cargando
  const isLoading = loading;
  const hasError = error;

  if (isLoading && enrollments.length === 0 && academicPeriods.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mr-3" />
            <p className="text-lg text-gray-600">Cargando datos ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Notificación */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-400 text-green-800' 
            : notification.type === 'error'
            ? 'bg-red-50 border-red-400 text-red-800'
            : 'bg-blue-50 border-blue-400 text-blue-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
            {notification.type === 'error' && <XCircle className="h-5 w-5 mr-2" />}
            <span className="font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Advertencia de error */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error de Conexión</h3>
            <p className="text-sm text-red-700 mt-1">
              {error}
            </p>
            <button
              onClick={loadInitialData}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Reintentar conexión
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestión Académica</h1>
            <p className="text-blue-100">Administre matrículas y períodos académicos</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 rounded-lg p-3">
              <GraduationCap className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => handleTabChange("enrollments")}
            className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center transition-all duration-200 ${
              activeTab === "enrollments"
                ? "border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <User className="h-5 w-5 mr-2" />
            Matrículas
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("academicPeriods")}
            className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center transition-all duration-200 ${
              activeTab === "academicPeriods"
                ? "border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Calendar className="h-5 w-5 mr-2" />
            Períodos Académicos
          </button>
        </nav>
      </div>



      {/* Contenido de las pestañas */}
      {activeTab === "enrollments" && (
        <>
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-lg p-3 mr-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Matrículas</p>
                  <p className="text-2xl font-bold text-gray-900">{enrollmentStats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-lg p-3 mr-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Activas</p>
                  <p className="text-2xl font-bold text-gray-900">{enrollmentStats.active}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 rounded-lg p-3 mr-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{enrollmentStats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-red-100 rounded-lg p-3 mr-4">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Canceladas</p>
                  <p className="text-2xl font-bold text-gray-900">{enrollmentStats.cancelled}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por estudiante, institución, código..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center px-4 py-2.5 border rounded-lg font-medium transition-colors ${
                    showFilters 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </button>

                <button
                  onClick={loadInitialData}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>

                {/* Botón de exportar todas las matrículas a PDF */}
                {filteredEnrollments.length > 0 && (
                  <button
                    onClick={() => {
                      import('../service/SimplePdfExport.service').then(({ default: SimplePdfExportService }) => {
                        SimplePdfExportService.generateMultipleEnrollmentsPdf(filteredEnrollments);
                      });
                    }}
                    className="flex items-center px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                    title={`Exportar ${filteredEnrollments.length} matrículas a PDF`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar PDFs ({filteredEnrollments.length})
                  </button>
                )}

                <button
                  onClick={() => setShowIntegratedEnrollmentForm(true)}
                  className="flex items-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Matrícula
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos</option>
                      <option value="ACTIVE">Activa</option>
                      <option value="PENDING">Pendiente</option>
                      <option value="CANCELLED">Cancelada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos</option>
                      <option value="NUEVA">Nueva</option>
                      <option value="REINSCRIPCION">Reinscripción</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Año Académico</label>
                    <select
                      value={filters.academicYear}
                      onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grupo de Edad</label>
                    <select
                      value={filters.ageGroup}
                      onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos</option>
                      <option value="3_AÑOS">3 años</option>
                      <option value="4_AÑOS">4 años</option>
                      <option value="5_AÑOS">5 años</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                    <select
                      value={filters.shift}
                      onChange={(e) => handleFilterChange('shift', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos</option>
                      <option value="MAÑANA">Mañana</option>
                      <option value="TARDE">Tarde</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
                    <select
                      value={filters.modality}
                      onChange={(e) => handleFilterChange('modality', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todas</option>
                      <option value="PRESENCIAL">Presencial</option>
                      <option value="VIRTUAL">Virtual</option>
                      <option value="HIBRIDA">Híbrida</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lista de matrículas */}
          <EnrollmentList 
            items={filteredEnrollments} 
            onDelete={handleCancelEnrollment}
            onView={handleViewEnrollmentDetail}
            onEdit={handleEditEnrollment}
            onActivate={handleActivateEnrollment}
            onRestore={handleRestoreEnrollment}
            showCancelledActions={filters.status === 'CANCELLED'}
          />


        </>
      )}

      {activeTab === "academicPeriods" && (
        <>
          {/* Estadísticas de períodos académicos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-lg p-3 mr-4">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Períodos</p>
                  <p className="text-2xl font-bold text-gray-900">{periodStats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-lg p-3 mr-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{periodStats.active}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-lg p-3 mr-4">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Cerrados</p>
                  <p className="text-2xl font-bold text-gray-900">{periodStats.closed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-red-100 rounded-lg p-3 mr-4">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactivos</p>
                  <p className="text-2xl font-bold text-gray-900">{periodStats.inactive}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controles para períodos académicos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Períodos Académicos</h2>
                <p className="text-sm text-gray-600">Gestione los períodos académicos y calendarios de matrícula</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={loadInitialData}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>

                <button
                  onClick={handleCreateAcademicPeriod}
                  className="flex items-center px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Período
                </button>
              </div>
            </div>
          </div>

          {/* Lista de períodos académicos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {academicPeriods.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay períodos académicos</h3>
                <p className="text-gray-500 mb-6">Comience creando su primer período académico.</p>
                <button
                  onClick={handleCreateAcademicPeriod}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Período
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Período
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fechas del Período
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Matrícula
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Institución
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {academicPeriods.map((period) => (
                      <tr key={period.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-purple-100 rounded-full p-2 mr-3">
                              <GraduationCap className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {period.periodName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {period.academicYear}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">
                              {new Date(period.startDate).toLocaleDateString('es-PE')} - {new Date(period.endDate).toLocaleDateString('es-PE')}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">
                              {new Date(period.enrollmentPeriodStart).toLocaleDateString('es-PE')} - {new Date(period.enrollmentPeriodEnd).toLocaleDateString('es-PE')}
                            </div>
                            {period.allowLateEnrollment && period.lateEnrollmentEndDate && (
                              <div className="text-xs text-orange-600">
                                Tardía hasta: {new Date(period.lateEnrollmentEndDate).toLocaleDateString('es-PE')}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(period.status)}`}>
                            {getStatusText(period.status)}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {period.institutionId}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditAcademicPeriod(period)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {period.id && (
                              <button
                                onClick={() => handleDeleteAcademicPeriod(period.id!)}
                                className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de formulario de matrícula */}
      <Modal
        isOpen={showEnrollmentForm}
        onClose={() => {
          setShowEnrollmentForm(false);
          setEditingEnrollment(null);
        }}
        title={editingEnrollment ? 'Editar Matrícula' : 'Nueva Matrícula'}
        size="4xl"
      >
        <EnrollmentForm
          enrollment={editingEnrollment || undefined}
          academicPeriods={academicPeriods}
          onSave={handleSaveEnrollment}
          onCancel={() => {
            setShowEnrollmentForm(false);
            setEditingEnrollment(null);
          }}
        />
      </Modal>

      {/* Modal de formulario de período académico */}
      <Modal
        isOpen={showAcademicPeriodForm}
        onClose={() => {
          setShowAcademicPeriodForm(false);
          setEditingAcademicPeriod(null);
        }}
        title={editingAcademicPeriod ? 'Editar Período Académico' : 'Nuevo Período Académico'}
        size="4xl"
      >
        <AcademicPeriodForm
          period={editingAcademicPeriod || undefined}
          onSave={handleSaveAcademicPeriod}
          onCancel={() => {
            setShowAcademicPeriodForm(false);
            setEditingAcademicPeriod(null);
          }}
        />
      </Modal>

      {/* Modal de detalles de matrícula */}
      <Modal
        isOpen={showEnrollmentDetail && !!detailEnrollment}
        onClose={() => {
          setShowEnrollmentDetail(false);
          setDetailEnrollment(null);
          // Limpiar datos cargados
          setDetailStudentData(null);
          setDetailInstitutionData(null);
          setDetailClassroomData(null);
          setLoadingDetailData(false);
        }}
        title="Detalles de la Matrícula"
        size="4xl"
      >
        {detailEnrollment && (
              
              <div className="space-y-6">
                {/* Información básica */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    <User className="mr-2" size={20} />
                    Información del Estudiante
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wide">Estudiante</h4>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {loadingDetailData ? (
                          <span className="text-gray-500 flex items-center">
                            <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                            Cargando...
                          </span>
                        ) : detailStudentData?.data ? (
                          `${detailStudentData.data.personalInfo.names} ${detailStudentData.data.personalInfo.lastNames}`
                        ) : (
                          `Código: ${detailEnrollment.studentId}`
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wide">Grupo de Edad</h4>
                      <p className="mt-1 text-sm font-medium text-gray-900">{getAgeGroupText(detailEnrollment.ageGroup)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wide">Edad</h4>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {(() => {
                          // Calcular edad desde ageGroup para evitar problemas de concatenación
                          const ageMap: Record<string, number> = {
                            "3_AÑOS": 3,
                            "3 años": 3,
                            "4_AÑOS": 4,
                            "4 años": 4,
                            "5_AÑOS": 5,
                            "5 años": 5
                          };
                          const age = ageMap[detailEnrollment.ageGroup] || detailEnrollment.studentAge || 0;
                          return `${age} años`;
                        })()}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wide">Código de Matrícula</h4>
                      <p className="mt-1 text-sm font-medium text-gray-900">{detailEnrollment.enrollmentCode || 'No asignado'}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wide">Estado</h4>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 border ${getStatusBadgeClass(detailEnrollment.enrollmentStatus || 'PENDING')}`}>
                        {getStatusText(detailEnrollment.enrollmentStatus || 'PENDING')}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wide">Tipo de Matrícula</h4>
                      <p className="mt-1 text-sm font-medium text-gray-900">{getEnrollmentTypeText(detailEnrollment.enrollmentType || 'NUEVA')}</p>
                    </div>
                  </div>
                </div>

                {/* Información institucional */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    <Building className="mr-2" size={20} />
                    Información Institucional
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-purple-600 uppercase tracking-wide">Institución</h4>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {loadingDetailData ? (
                          <span className="text-gray-500 flex items-center">
                            <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                            Cargando...
                          </span>
                        ) : detailInstitutionData ? (
                          detailInstitutionData.institutionInformation.institutionName
                        ) : (
                          `ID: ${detailEnrollment.institutionId}`
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-purple-600 uppercase tracking-wide">Aula</h4>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {loadingDetailData ? (
                          <span className="text-gray-500 flex items-center">
                            <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                            Cargando...
                          </span>
                        ) : detailClassroomData ? (
                          detailClassroomData.classroomName
                        ) : (
                          `ID: ${detailEnrollment.classroomId}`
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-purple-600 uppercase tracking-wide">Sección</h4>
                      <p className="mt-1 text-sm font-medium text-gray-900">{detailEnrollment.section}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-purple-600 uppercase tracking-wide">Turno</h4>
                      <p className="mt-1 text-sm font-medium text-gray-900">{detailEnrollment.shift}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-purple-600 uppercase tracking-wide">Modalidad</h4>
                      <p className="mt-1 text-sm font-medium text-gray-900">{getModalityText(detailEnrollment.modality)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium text-purple-600 uppercase tracking-wide">Nivel Educativo</h4>
                      <p className="mt-1 text-sm font-medium text-gray-900">{detailEnrollment.educationalLevel}</p>
                    </div>
                  </div>
                </div>

                {/* Progreso de documentos */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    <FileText className="mr-2" size={20} />
                    Estado de Documentos
                  </h3>
                  
                  {(() => {
                    const docProgress = calculateDocumentProgress(detailEnrollment);
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-green-800">
                            {docProgress.completed} de {docProgress.total} documentos completados
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            docProgress.percentage === 100 ? 'bg-green-100 text-green-800' :
                            docProgress.percentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {docProgress.percentage}%
                          </span>
                        </div>
                        
                        <div className="bg-gray-200 rounded-full h-3 mb-4">
                          <div 
                            className={`h-3 rounded-full transition-all ${
                              docProgress.percentage === 100 ? 'bg-green-500' :
                              docProgress.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${docProgress.percentage}%` }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {[
                            { key: 'birthCertificate', label: 'Certificado de Nacimiento' },
                            { key: 'studentDni', label: 'DNI del Estudiante' },
                            { key: 'guardianDni', label: 'DNI del Apoderado' },
                            { key: 'vaccinationCard', label: 'Carné de Vacunación' },
                            { key: 'disabilityCertificate', label: 'Certificado de Discapacidad' },
                            { key: 'utilityBill', label: 'Recibo de Servicios' },
                            { key: 'psychologicalReport', label: 'Informe Psicológico' },
                            { key: 'studentPhoto', label: 'Foto del Estudiante' },
                            { key: 'healthRecord', label: 'Ficha de Salud' },
                            { key: 'signedEnrollmentForm', label: 'Formulario de Matrícula Firmado' },
                            { key: 'dniVerification', label: 'Verificación de DNI' }
                          ].map((doc) => (
                            <div key={doc.key} className="flex items-center">
                              {detailEnrollment[doc.key as keyof Enrollment] ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                              )}
                              <span className={detailEnrollment[doc.key as keyof Enrollment] ? 'text-green-700' : 'text-red-700'}>
                                {doc.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Observaciones */}
                {detailEnrollment.observations && (
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Observaciones</h3>
                    <p className="text-sm text-gray-700">{detailEnrollment.observations}</p>
                  </div>
                )}
              </div>
        )}
      </Modal>

      {/* Modal de Nueva Matrícula Integrada */}
      <Modal
        isOpen={showIntegratedEnrollmentForm}
        onClose={() => setShowIntegratedEnrollmentForm(false)}
        title="Creando Matricula"
        size="4xl"
      >
        <IntegratedEnrollmentForm
          onEnrollmentCreated={async (enrollment) => {
            // Agregar la nueva matrícula a la lista
            setEnrollments(prev => [enrollment, ...prev]);
            
            // Cerrar el modal
            setShowIntegratedEnrollmentForm(false);
            
            // Calcular progreso de documentos
            const progress = calculateDocumentProgress(enrollment);
            
            // Mostrar modal de éxito con SweetAlert2 incluyendo progreso de documentos
            await Swal.fire({
              title: '¡Matrícula Creada Exitosamente!',
              html: `
                <div style="text-align: left; margin: 1rem 0;">
                  <div style="background: #f8f9fa; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                      <strong>Código de Matrícula:</strong>
                      <span>${enrollment.enrollmentCode || enrollment.id}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                      <strong>Año Académico:</strong>
                      <span>${enrollment.academicYear}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                      <strong>Estado:</strong>
                      <span style="background: #E8F5E8; color: #2E7D32; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">
                        ${getStatusText(enrollment.enrollmentStatus || 'PENDING')}
                      </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                      <strong>Fecha de Matrícula:</strong>
                      <span>${enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString('es-PE') : 'Hoy'}</span>
                    </div>
                    <div style="border-top: 1px solid #e0e0e0; padding-top: 1rem;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <strong>Progreso de Documentos:</strong>
                        <span style="font-size: 0.9rem; color: #666;">${progress.completed}/${progress.total} (${progress.percentage}%)</span>
                      </div>
                      <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #4CAF50, #66BB6A); height: 100%; width: ${progress.percentage}%; border-radius: 4px; transition: width 0.3s ease;"></div>
                      </div>
                    </div>
                  </div>
                  <p style="text-align: center; color: #666; margin: 0;">
                    La matrícula ha sido registrada correctamente en el sistema.<br>
                    Puede proceder con la documentación requerida y el proceso de inscripción.
                  </p>
                </div>
              `,
              icon: 'success',
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#059669',
              width: '500px',
              showCloseButton: true
            });
            
            // Mostrar notificación adicional
            showNotification('success', `Matrícula creada exitosamente. Progreso de documentos: ${progress.percentage}%`);
          }}
          onCancel={() => setShowIntegratedEnrollmentForm(false)}
        />
      </Modal>
      
    </div>
  );
}
