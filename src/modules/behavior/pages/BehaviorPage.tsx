import { useState, useEffect } from 'react';
import { Eye, Edit3, Plus, Filter, Search, Calendar, User, AlertTriangle } from 'lucide-react';
import { incidentService } from '../service/incident.service';
import CreateIncidentModal from '../components/CreateIncidentModal';
import EditIncidentModal from '../components/EditIncidentModal';
import ViewIncidentModal from '../components/ViewIncidentModal';
import { 
  showSuccessAlert, 
  showErrorAlert,
  showLoadingAlert,
  closeAlert
} from '../../../shared/utils/sweetAlert';
import type { 
  IncidentResponse,
  IncidentCreateRequest,
  IncidentUpdateRequest,
  IncidentStatus,
  SeverityLevel
} from '../models/incident.interface';

// Funciones utilitarias para convertir arrays de fecha/hora
const formatIncidentDate = (dateArray: number[] | string): string => {
  const formatToCustomDate = (date: Date): string => {
    const day = date.getDate();
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                   'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  if (typeof dateArray === 'string') return formatToCustomDate(new Date(dateArray));
  if (Array.isArray(dateArray) && dateArray.length >= 3) {
    const [year, month, day] = dateArray;
    return formatToCustomDate(new Date(year, month - 1, day));
  }
  return 'N/A';
};

const formatIncidentTime = (timeArray: number[] | string): string => {
  if (typeof timeArray === 'string') return timeArray.substring(0, 5);
  if (Array.isArray(timeArray) && timeArray.length >= 2) {
    const [hour, minute] = timeArray;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  return 'N/A';
};

export function BehaviorPage() {
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | 'pendientes' | 'resueltos' | 'en_proceso'| 'cerrado'>('todos');
  const [severityFilter, setSeverityFilter] = useState<'todos' | SeverityLevel>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<IncidentResponse | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedIncidentForEdit, setSelectedIncidentForEdit] = useState<IncidentResponse | null>(null);

  const loadIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await incidentService.getAllIncidents();
      
      // Filtrar los datos según el filtro seleccionado
      switch (filter) {
        case 'pendientes':
          data = data.filter(incident => incident.status === 'OPEN');
          break;
        case 'en_proceso':
          // IN_PROGRESS removido - filtro ya no disponible
          break;
        case 'resueltos':
          data = data.filter(incident => incident.status === 'RESOLVED');
          break;
        case 'cerrado':
          data = data.filter(incident => incident.status === 'CLOSED');
          break;
        default:
          // Mantener todos los datos
          break;
      }

      // Filtrar por severidad si se seleccionó
      if (severityFilter !== 'todos') {
        data = data.filter(incident => incident.severityLevel === severityFilter);
      }

      setIncidents(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar incidentes';
      setError(errorMessage);
      await showErrorAlert('Error al cargar', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [filter, severityFilter]);

  const filteredIncidents = incidents.filter(incident =>
    incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.incidentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (data: IncidentCreateRequest) => {
    try {
      showLoadingAlert('Creando incidente...');
      await incidentService.createIncident(data);
      closeAlert();
      await showSuccessAlert('¡Creado!', 'El incidente ha sido creado correctamente');
      setShowCreateModal(false);
      loadIncidents();
    } catch (err) {
      closeAlert();
      await showErrorAlert(
        'Error al crear',
        err instanceof Error ? err.message : 'No se pudo crear el incidente'
      );
    }
  };

  const handleEdit = async (id: string, data: IncidentUpdateRequest) => {
    try {
      showLoadingAlert('Actualizando incidente...');
      await incidentService.updateIncident(id, data);
      closeAlert();
      await showSuccessAlert('¡Actualizado!', 'El incidente ha sido actualizado correctamente');
      setShowEditModal(false);
      setSelectedIncidentForEdit(null);
      loadIncidents();
    } catch (err) {
      closeAlert();
      await showErrorAlert(
        'Error al actualizar',
        err instanceof Error ? err.message : 'No se pudo actualizar el incidente'
      );
    }
  };

  const handleViewDetails = (incident: IncidentResponse) => {
    setSelectedIncident(incident);
    setShowViewModal(true);
  };

  const handleEditIncident = (incident: IncidentResponse) => {
    setSelectedIncidentForEdit(incident);
    setShowEditModal(true);
  };

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'LEVE':
        return 'bg-green-100 text-green-800';
      case 'MODERADO':
        return 'bg-yellow-100 text-yellow-800';
      case 'GRAVE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';

      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: IncidentStatus) => {
    switch (status) {
      case 'OPEN':
        return 'Abierto';

      case 'RESOLVED':
        return 'Resuelto';
      case 'CLOSED':
        return 'Cerrado';
      default:
        return status;
    }
  };

  const getSeverityLabel = (severity: SeverityLevel) => {
    switch (severity) {
      case 'LEVE':
        return 'Leve';
      case 'MODERADO':
        return 'Moderado';
      case 'GRAVE':
        return 'Grave';
      default:
        return severity;
    }
  };

  const getIncidentTypeLabel = (type: string) => {
    switch (type) {
      case 'ACCIDENTE':
        return 'Accidente';
      case 'CONFLICTO':
        return 'Conflicto';
      case 'COMPORTAMIENTO':
        return 'Comportamiento';
      case 'EMOCIONAL':
        return 'Emocional';
      case 'SALUD':
        return 'Salud';
      default:
        return type;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Encabezado */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              Gestión Disciplinaria
            </h1>
            <p className="text-gray-600">Administra incidentes y registros disciplinarios</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Crear Incidente
          </button>
        </div>

        {/* Filtros y búsqueda */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar incidentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por estado */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendientes">Abiertos</option>
              <option value="resueltos">Resueltos</option>
              <option value="cerrado">Cerrados</option>
            </select>
          </div>

          {/* Filtro por severidad */}
          <div className="relative">
            <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="todos">Todas las severidades</option>
              <option value="LEVE">Leve</option>
              <option value="MODERADO">Moderado</option>
              <option value="GRAVE">Grave</option>
            </select>
          </div>

          {/* Contador de resultados */}
          <div className="flex items-center justify-center bg-gray-100 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-600">
              {filteredIncidents.length} incidente{filteredIncidents.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadIncidents}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatIncidentDate(incident.incidentDate)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatIncidentTime(incident.incidentTime)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {incident.studentName || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getIncidentTypeLabel(incident.incidentType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(incident.severityLevel)}`}>
                          {getSeverityLabel(incident.severityLevel)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {getStatusLabel(incident.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                        {incident.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(incident)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {incident.status !== 'CLOSED' ? (
                            <button
                              onClick={() => handleEditIncident(incident)}
                              className="text-orange-600 hover:text-orange-800 p-1 rounded"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="text-gray-400 p-1 rounded cursor-not-allowed"
                              title="No se puede editar - Incidente cerrado"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredIncidents.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">
                    <AlertTriangle className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No hay incidentes
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm || filter !== 'todos' || severityFilter !== 'todos'
                      ? 'No se encontraron incidentes con los filtros aplicados'
                      : 'Aún no se han registrado incidentes disciplinarios'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <CreateIncidentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        loading={loading}
      />

      <EditIncidentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedIncidentForEdit(null);
        }}
        onSubmit={handleEdit}
        incident={selectedIncidentForEdit}
        loading={loading}
      />

      <ViewIncidentModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedIncident(null);
        }}
        incident={selectedIncident}
      />
    </div>
  );
}

