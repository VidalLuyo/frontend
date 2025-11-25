import { useState, useEffect } from 'react';
import { Eye, Edit3, Trash2, RotateCcw } from 'lucide-react';
import { institutionService } from '../service/Institution.service';
import CreateInstitutionModal from '../components/CreateInstitutionModal';
import EditInstitutionModal from '../components/EditInstitutionModal';
import { 
  showDeleteConfirm, 
  showRestoreConfirm, 
  showSuccessAlert, 
  showErrorAlert 
} from '../../../shared/utils/sweetAlert';
import type { 
  InstitutionWithUsersAndClassroomsResponse
} from '../models/Institution.interface';

export function InstitutionPage() {
  const [institutions, setInstitutions] = useState<InstitutionWithUsersAndClassroomsResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | 'activos' | 'inactivos'>('activos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionWithUsersAndClassroomsResponse | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInstitutionForEdit, setSelectedInstitutionForEdit] = useState<InstitutionWithUsersAndClassroomsResponse | null>(null);

  const loadInstitutions = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await institutionService.getAllInstitutionsWithUsersAndClassrooms();
      
      // Filtrar los datos según el filtro seleccionado
      switch (filter) {
        case 'activos':
          data = data.filter(institution => institution.status === 'ACTIVE' && !institution.deletedAt);
          break;
        case 'inactivos':
          data = data.filter(institution => institution.status === 'INACTIVE' || institution.deletedAt);
          break;
        default:
          // Mantener todos los datos
          break;
      }
      setInstitutions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar instituciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutions();
  }, [filter]);

  const filteredInstitutions = institutions.filter(institution =>
    institution.institutionInformation.institutionName
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    institution.institutionInformation.modularCode
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (institutionId: string, institutionName: string) => {
    const result = await showDeleteConfirm(institutionName);
    
    if (result.isConfirmed) {
      try {
        await institutionService.deleteInstitution(institutionId);
        await showSuccessAlert('¡Eliminado!', 'La institución ha sido eliminada correctamente');
        loadInstitutions();
      } catch (err) {
        await showErrorAlert(
          'Error al eliminar',
          err instanceof Error ? err.message : 'No se pudo eliminar la institución'
        );
      }
    }
  };

  const handleRestore = async (institutionId: string, institutionName: string) => {
    const result = await showRestoreConfirm(institutionName);
    
    if (result.isConfirmed) {
      try {
        await institutionService.restoreInstitution(institutionId);
        await showSuccessAlert('¡Restaurado!', 'La institución ha sido restaurada correctamente');
        loadInstitutions();
      } catch (err) {
        await showErrorAlert(
          'Error al restaurar',
          err instanceof Error ? err.message : 'No se pudo restaurar la institución'
        );
      }
    }
  };

  const handleViewDetails = (institution: InstitutionWithUsersAndClassroomsResponse) => {
    setSelectedInstitution(institution);
  };

  // Función para manejar la edición
  const handleEdit = (institution: InstitutionWithUsersAndClassroomsResponse) => {
    console.log('Editando institución:', institution);
    
    // Usar directamente los datos con usuarios y aulas completos
    setSelectedInstitutionForEdit(institution);
    setShowEditModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Instituciones</h1>
        <button 
          onClick={() => {
            console.log('Botón Nueva Institución clickeado');
            setShowCreateModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
        >
          Nueva Institución
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                filter === 'activos'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
              onClick={() => setFilter('activos')}
            >
              Activas
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                filter === 'inactivos'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
              onClick={() => setFilter('inactivos')}
            >
              Inactivas
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                filter === 'todos'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
              onClick={() => setFilter('todos')}
            >
              Todas
            </button>
          </div>

          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar por nombre o código modular..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Cargando instituciones...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 text-xs underline mt-1"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredInstitutions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0v-4M9 21v-4m0 4h4m-4 0v-4m4 4v-4m-4 4h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay instituciones</h3>
              <p className="mt-1 text-sm text-gray-500">No se encontraron instituciones que coincidan con los criterios seleccionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Logo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Institución
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código Modular
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo/Nivel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aulas
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInstitutions.map((institution) => {
                    const isActive = institution.status === 'ACTIVE';
                    const isDeleted = institution.deletedAt !== null;

                    return (
                      <tr key={institution.institutionId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
                            src={institution.institutionInformation.logoUrl || '/default-logo.png'}
                            alt="Logo"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iMjAiIHk9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjc3NDhkIiBmb250LXNpemU9IjEyIj5JPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                {institution.institutionInformation.institutionName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {institution.institutionInformation.institutionType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {institution.institutionInformation.modularCode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {institution.institutionInformation.institutionLevel}
                          </div>
                          <div className="text-sm text-gray-500">
                            {institution.institutionInformation.gender}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {institution.address.district}
                          </div>
                          <div className="text-sm text-gray-500">
                            {institution.address.province}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {isActive ? 'Activo' : 'Inactivo'}
                            </span>
                            {isDeleted && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Eliminado
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {institution.classrooms.length}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewDetails(institution)}
                              className="inline-flex items-center px-2 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              
                            </button>
                            {!isDeleted ? (
                              <button
                                onClick={() => handleEdit(institution)}
                                className="inline-flex items-center px-2 py-1 border border-indigo-300 rounded-md text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
                                title="Editar institución"
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                
                              </button>
                            ) : (
                              <div
                                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-500 bg-gray-100 cursor-not-allowed"
                                title="Institución eliminada - No editable"
                              >
                                <Edit3 className="h-4 w-4 mr-1 opacity-50" />
                                
                              </div>
                            )}
                            {!isDeleted ? (
                              <button
                                onClick={() => handleDelete(
                                  institution.institutionId,
                                  institution.institutionInformation.institutionName
                                )}
                                className="inline-flex items-center px-2 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors duration-200"
                                title="Eliminar institución"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRestore(
                                  institution.institutionId,
                                  institution.institutionInformation.institutionName
                                )}
                                className="inline-flex items-center px-2 py-1 border border-green-300 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors duration-200"
                                title="Restaurar institución"
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedInstitution && (
        <InstitutionDetailsModal
          institution={selectedInstitution}
          onClose={() => setSelectedInstitution(null)}
        />
      )}

      {/* Modal para crear nueva institución */}
      {showCreateModal && (
        <CreateInstitutionModal
          isOpen={showCreateModal}
          onClose={() => {
            console.log('Cerrando modal de crear institución');
            setShowCreateModal(false);
          }}
          onSuccess={() => {
            console.log('Institución creada exitosamente');
            setShowCreateModal(false);
            loadInstitutions(); // Recargar la lista de instituciones
          }}
        />
      )}

      {/* Modal para editar institución */}
      {showEditModal && selectedInstitutionForEdit && (
        <EditInstitutionModal
          isOpen={showEditModal}
          institution={selectedInstitutionForEdit}
          onClose={() => {
            console.log('Cerrando modal de editar institución');
            setShowEditModal(false);
            setSelectedInstitutionForEdit(null);
          }}
          onSuccess={() => {
            console.log('Institución editada exitosamente');
            setShowEditModal(false);
            setSelectedInstitutionForEdit(null);
            loadInstitutions(); // Recargar la lista de instituciones
          }}
        />
      )}
    </div>
  );
}

function InstitutionDetailsModal({ 
  institution, 
  onClose 
}: { 
  institution: InstitutionWithUsersAndClassroomsResponse; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-gray-900/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <img
              src={institution.institutionInformation.logoUrl}
              alt="Institution Logo"
              className="h-16 w-16 rounded-full object-cover mr-4"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {institution.institutionInformation.institutionName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Código Institución: {institution.institutionInformation.codeInstitution} | Código Modular: {institution.institutionInformation.modularCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                  Información General
                </h3>
                <div className="space-y-3">
                  <InfoField label="Nombre" value={institution.institutionInformation.institutionName} />
                  <InfoField label="Código Institución" value={institution.institutionInformation.codeInstitution} />
                  <InfoField label="Código Modular" value={institution.institutionInformation.modularCode} />
                  <InfoField label="Tipo" value={institution.institutionInformation.institutionType} />
                  <InfoField label="Nivel Educativo" value={institution.institutionInformation.institutionLevel} />
                  <InfoField label="Género" value={institution.institutionInformation.gender} />
                  {institution.institutionInformation.slogan && (
                    <InfoField label="Lema" value={institution.institutionInformation.slogan} />
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Estado:</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      institution.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {institution.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                  Información Administrativa
                </h3>
                <div className="space-y-3">
                  <InfoField label="UGEL" value={institution.ugel} />
                  <InfoField label="DRE" value={institution.dre} />
                  <InfoField label="Tipo de Calificación" value={institution.gradingType} />
                  <InfoField label="Tipo de Aula" value={institution.classroomType} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                  Director
                </h3>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-gray-900">{institution.director.firstName} {institution.director.lastName}</p>
                  <p className="text-sm text-gray-600">{institution.director.documentType}: {institution.director.documentNumber}</p>
                  <p className="text-sm text-gray-600">Email: {institution.director.email}</p>
                  <p className="text-sm text-gray-600">Teléfono: {institution.director.phone}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2 flex items-center justify-between">
                  <span>Auxiliares ({institution.auxiliaries.length})</span>
                  <span className="text-xs text-gray-500 font-normal">(Solo lectura)</span>
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {institution.auxiliaries.length > 0 ? (
                    institution.auxiliaries.map((auxiliary) => (
                      <div key={auxiliary.userId} className="p-3 bg-green-50 rounded-lg">
                        <p className="font-medium text-gray-900">{auxiliary.firstName} {auxiliary.lastName}</p>
                        <p className="text-sm text-gray-600">{auxiliary.documentType}: {auxiliary.documentNumber}</p>
                        <p className="text-sm text-gray-600">Email: {auxiliary.email}</p>
                        <p className="text-sm text-gray-600">Teléfono: {auxiliary.phone}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4 text-sm">No hay auxiliares asignados. Los auxiliares se gestionan desde el microservicio de usuarios.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                  Información del Sistema
                </h3>
                <div className="space-y-3">
                  <InfoField 
                    label="Fecha de Creación" 
                    value={new Date(institution.createdAt).toLocaleString()} 
                  />
                  <InfoField 
                    label="Última Actualización" 
                    value={new Date(institution.updatedAt).toLocaleString()} 
                  />
                  {institution.deletedAt && (
                    <InfoField 
                      label="Fecha de Eliminación" 
                      value={new Date(institution.deletedAt).toLocaleString()}
                      valueClassName="text-red-600"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                  Ubicación
                </h3>
                <div className="space-y-3">
                  <InfoField label="Departamento" value={institution.address.department} />
                  <InfoField label="Provincia" value={institution.address.province} />
                  <InfoField label="Distrito" value={institution.address.district} />
                  <InfoField label="Calle" value={institution.address.street} />
                  <InfoField label="Código Postal" value={institution.address.postalCode} />
                </div>
              </div>

              {institution.contactMethods.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                    Contactos
                  </h3>
                  <div className="space-y-3">
                    {institution.contactMethods.map((contact, index) => (
                      <InfoField 
                        key={index} 
                        label={contact.type} 
                        value={contact.value} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {institution.schedules.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                    Horarios
                  </h3>
                  <div className="space-y-2">
                    {institution.schedules.map((schedule, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{schedule.type}</span>
                        <span className="text-gray-600">{schedule.entryTime} - {schedule.exitTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                  Aulas ({institution.classrooms.length})
                </h3>
                {institution.classrooms.length > 0 ? (
                  <div className="space-y-4">
                    {/* Aulas Activas */}
                    {institution.classrooms.filter(c => c.status === 'ACTIVE').length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Aulas Activas ({institution.classrooms.filter(c => c.status === 'ACTIVE').length})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {institution.classrooms
                            .filter(classroom => classroom.status === 'ACTIVE')
                            .map((classroom) => (
                              <div key={classroom.classroomId} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{classroom.classroomName}</p>
                                    <p className="text-sm text-gray-600">
                                      {classroom.classroomAge}
                                    </p>
                                    {(classroom.gradeLevel || classroom.section) && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {classroom.gradeLevel && `Nivel: ${classroom.gradeLevel}`}
                                        {classroom.gradeLevel && classroom.section && ' - '}
                                        {classroom.section && `Sección: ${classroom.section}`}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      Color: <span className="inline-block w-3 h-3 rounded-full ml-1 align-middle" style={{ backgroundColor: classroom.color }}></span> {classroom.color}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-sm font-medium text-blue-600">
                                      Cap: {classroom.capacity}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                      Activa
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Aulas Inactivas */}
                    {institution.classrooms.filter(c => c.status === 'INACTIVE').length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          Aulas Inactivas ({institution.classrooms.filter(c => c.status === 'INACTIVE').length})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {institution.classrooms
                            .filter(classroom => classroom.status === 'INACTIVE')
                            .map((classroom) => (
                              <div key={classroom.classroomId} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500 opacity-75">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{classroom.classroomName}</p>
                                    <p className="text-sm text-gray-600">
                                      {classroom.classroomAge}
                                    </p>
                                    {(classroom.gradeLevel || classroom.section) && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {classroom.gradeLevel && `Nivel: ${classroom.gradeLevel}`}
                                        {classroom.gradeLevel && classroom.section && ' - '}
                                        {classroom.section && `Sección: ${classroom.section}`}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      Color: <span className="inline-block w-3 h-3 rounded-full ml-1 align-middle" style={{ backgroundColor: classroom.color }}></span> {classroom.color}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-sm font-medium text-gray-600">
                                      Cap: {classroom.capacity}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                      Inactiva
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay aulas registradas</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoField({ 
  label, 
  value, 
  valueClassName = "text-gray-900" 
}: { 
  label: string; 
  value: string; 
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-gray-700">{label}:</span>
      <span className={`text-sm ${valueClassName} text-right max-w-xs truncate`} title={value}>
        {value}
      </span>
    </div>
  );
}
