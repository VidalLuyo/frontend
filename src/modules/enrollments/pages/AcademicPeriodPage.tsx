/**
 * Página: AcademicPeriodPage
 * Página principal para la gestión de Períodos Académicos
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  FileText
} from "lucide-react";
import { 
  academicPeriodService, 
  handleAcademicPeriodApiError,
  validateAndCreatePeriod,
  validateAndUpdatePeriod
} from "../service";
import type { AcademicPeriod } from "../models/academicPeriod.model";
import { AcademicPeriodForm } from "../components/AcademicPeriodForm";
import { AcademicPeriodList } from "../components/AcademicPeriodList";
import { Modal } from "../components/Modal";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/**
 * Módulo: Gestión de Períodos Académicos
 * Este módulo maneja la gestión completa de períodos académicos
 */

export function AcademicPeriodPage() {
  // Estados locales para manejar datos
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para modales y formularios
  const [showAcademicPeriodForm, setShowAcademicPeriodForm] = useState(false);
  const [editingAcademicPeriod, setEditingAcademicPeriod] = useState<AcademicPeriod | null>(null);
  const [showAcademicPeriodDetail, setShowAcademicPeriodDetail] = useState(false);
  const [detailAcademicPeriod, setDetailAcademicPeriod] = useState<AcademicPeriod | null>(null);

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    academicYear: '',
    institutionId: '',
    activeOnly: false,
    enrollmentOpen: false
  });
  const [showFilters, setShowFilters] = useState(false);

  // Estado para notificaciones
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Funciones para manejar las APIs
  const fetchAcademicPeriods = async () => {
    try {
      setLoading(true);
      const data = await academicPeriodService.getAllAcademicPeriods();
      setAcademicPeriods(data);
      return data;
    } catch (err) {
      const errorMsg = handleAcademicPeriodApiError(err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = useCallback(async () => {
    try {
      await fetchAcademicPeriods();
      console.log("✅ Successfully loaded academic periods:", academicPeriods.length);
    } catch (err) {
      console.error("❌ Error fetching academic periods:", err);
      showNotification('error', "Error al cargar los períodos académicos. Verifique la conexión con el servidor.");
    }
  }, []);

  useEffect(() => {
    loadInitialData();
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
      case 'CLOSED':
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
      case 'CLOSED': return 'Cerrado';
      default: return status;
    }
  }, []);

  // Manejar acciones del formulario - Memoizadas para optimización
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
      const errorMessage = handleAcademicPeriodApiError(err);
      
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

  // Manejar eliminación - Memoizadas para optimización
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
        const errorMessage = handleAcademicPeriodApiError(err);
        showNotification('error', `Error al eliminar el período académico: ${errorMessage}`);
      }
    }
  }, [showNotification]);

  // Manejar vista de detalles - Memoizada para optimización
  const handleViewAcademicPeriodDetail = useCallback((period: AcademicPeriod) => {
    setDetailAcademicPeriod(period);
    setShowAcademicPeriodDetail(true);
  }, []);

  // Filtrar períodos académicos localmente - Memoizado para optimización
  const filteredAcademicPeriods = useMemo(() => {
    return academicPeriods.filter(period => {
      if (filters.status && period.status !== filters.status) return false;
      if (filters.academicYear && period.academicYear !== filters.academicYear) return false;
      if (filters.institutionId && period.institutionId !== filters.institutionId) return false;
      
      if (filters.activeOnly) {
        const now = new Date();
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        const isActive = now >= startDate && now <= endDate && period.status === 'ACTIVE';
        if (!isActive) return false;
      }
      
      if (filters.enrollmentOpen) {
        const now = new Date();
        const enrollmentStart = new Date(period.enrollmentPeriodStart);
        const enrollmentEnd = new Date(period.enrollmentPeriodEnd);
        const lateEnrollmentEnd = period.allowLateEnrollment && period.lateEnrollmentEndDate ? new Date(period.lateEnrollmentEndDate) : null;
        const isEnrollmentOpen = now >= enrollmentStart && (now <= enrollmentEnd || (lateEnrollmentEnd && now <= lateEnrollmentEnd)) && period.status === 'ACTIVE';
        if (!isEnrollmentOpen) return false;
      }
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = [
          period.periodName,
          period.id,
          period.academicYear,
          period.institutionId
        ].filter(Boolean);
        
        const matches = searchableFields.some(field => 
          field?.toLowerCase().includes(searchLower)
        );
        
        if (!matches) return false;
      }
      
      return true;
    });
  }, [academicPeriods, searchTerm, filters]);

  // Estadísticas de períodos académicos - Memoizadas para optimización
  const periodStats = useMemo(() => ({
    total: academicPeriods.length,
    active: academicPeriods.filter(p => p.status === 'ACTIVE').length,
    closed: academicPeriods.filter(p => p.status === 'CLOSED').length,
    inactive: academicPeriods.filter(p => p.status === 'INACTIVE').length,
  }), [academicPeriods]);

  // Mostrar loading si está cargando
  const isLoading = loading;
  const hasError = error;

  if (isLoading && academicPeriods.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando períodos académicos...</h3>
            <p className="text-gray-500">Por favor espere mientras se cargan los datos.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-8 w-8 text-purple-600 mr-3" />
            Períodos Académicos
          </h1>
          <p className="mt-2 text-gray-600">
            Gestiona los períodos académicos y sus fechas de matrícula
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleCreateAcademicPeriod}
            className="flex items-center px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Período
          </button>
        </div>
      </div>

      {/* Notificación */}
      {notification && (
        <div className={`rounded-lg p-4 ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' :
          notification.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mr-3" />}
            {notification.type === 'error' && <XCircle className="h-5 w-5 text-red-600 mr-3" />}
            {notification.type === 'info' && <AlertTriangle className="h-5 w-5 text-blue-600 mr-3" />}
            <span className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-green-800' :
              notification.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {notification.message}
            </span>
          </div>
        </div>
      )}

      {/* Error de conexión */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
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
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-full p-3">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Períodos</p>
              <p className="text-2xl font-bold text-gray-900">{periodStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-gray-900">{periodStats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-gray-100 rounded-full p-3">
              <XCircle className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cerrados</p>
              <p className="text-2xl font-bold text-gray-900">{periodStats.closed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-red-100 rounded-full p-3">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-gray-900">{periodStats.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de búsqueda y filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Búsqueda */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar períodos académicos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Botón de filtros */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                showFilters 
                  ? 'bg-purple-50 border-purple-200 text-purple-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
            
            <button
              onClick={loadInitialData}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="CLOSED">Cerrado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Año Académico</label>
                <input
                  type="text"
                  placeholder="2025"
                  value={filters.academicYear}
                  onChange={(e) => setFilters(prev => ({ ...prev, academicYear: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Institución</label>
                <input
                  type="text"
                  placeholder="inst_001"
                  value={filters.institutionId}
                  onChange={(e) => setFilters(prev => ({ ...prev, institutionId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Solo Activos</label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.activeOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, activeOnly: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Períodos activos</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Matrícula Abierta</label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.enrollmentOpen}
                    onChange={(e) => setFilters(prev => ({ ...prev, enrollmentOpen: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Matrícula abierta</span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFilters({
                    status: '',
                    academicYear: '',
                    institutionId: '',
                    activeOnly: false,
                    enrollmentOpen: false
                  });
                  setSearchTerm('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de períodos académicos */}
      <AcademicPeriodList 
        items={filteredAcademicPeriods} 
        onDelete={handleDeleteAcademicPeriod}
        onView={handleViewAcademicPeriodDetail}
        onEdit={handleEditAcademicPeriod}
      />

      {/* Modal de formulario de período académico */}
      {showAcademicPeriodForm && (
        <Modal
          isOpen={showAcademicPeriodForm}
          onClose={() => {
            setShowAcademicPeriodForm(false);
            setEditingAcademicPeriod(null);
          }}
          title={editingAcademicPeriod ? "Editar Período Académico" : "Nuevo Período Académico"}
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
      )}

      {/* Modal de detalles del período académico */}
      {showAcademicPeriodDetail && detailAcademicPeriod && (
        <Modal
          isOpen={showAcademicPeriodDetail}
          onClose={() => {
            setShowAcademicPeriodDetail(false);
            setDetailAcademicPeriod(null);
          }}
          title="Detalles del Período Académico"
        >
          <div className="space-y-6">
            {/* Información básica */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                Información General
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre del Período</label>
                  <p className="mt-1 text-sm text-gray-900">{detailAcademicPeriod.periodName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Año Académico</label>
                  <p className="mt-1 text-sm text-gray-900">{detailAcademicPeriod.academicYear}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Institución</label>
                  <p className="mt-1 text-sm text-gray-900">{detailAcademicPeriod.institutionId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(detailAcademicPeriod.status)}`}>
                    {getStatusText(detailAcademicPeriod.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Fechas del período */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                Fechas del Período Académico
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(detailAcademicPeriod.startDate).toLocaleDateString('es-PE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(detailAcademicPeriod.endDate).toLocaleDateString('es-PE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Fechas de matrícula */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 text-green-600 mr-2" />
                Período de Matrícula
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inicio de Matrícula</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(detailAcademicPeriod.enrollmentPeriodStart).toLocaleDateString('es-PE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fin de Matrícula</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(detailAcademicPeriod.enrollmentPeriodEnd).toLocaleDateString('es-PE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Matrícula tardía */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Matrícula Tardía</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    detailAcademicPeriod.allowLateEnrollment 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {detailAcademicPeriod.allowLateEnrollment ? 'Permitida' : 'No permitida'}
                  </span>
                </div>
                {detailAcademicPeriod.allowLateEnrollment && detailAcademicPeriod.lateEnrollmentEndDate && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">Fecha Límite Matrícula Tardía</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(detailAcademicPeriod.lateEnrollmentEndDate).toLocaleDateString('es-PE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAcademicPeriodDetail(false);
                  setDetailAcademicPeriod(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowAcademicPeriodDetail(false);
                  handleEditAcademicPeriod(detailAcademicPeriod);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 transition-colors"
              >
                Editar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}