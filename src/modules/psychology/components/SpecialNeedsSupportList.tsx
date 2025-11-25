import React, { useEffect, useState } from 'react';
import {
  getAllSupports,
  getAllSupportsIncludingInactive,
  deactivateSupport,
  activateSupport,
} from '../service/SpecialNeedsSupport.service';
import psychologyService from '../service/Psychology.service';
import type { SpecialNeedsSupport } from '../models/specialNeedSupport';
import { showErrorAlert, showSuccessAlert, showConfirmDialog } from '../../../shared/utils/sweetAlert';
import { useNavigate } from 'react-router-dom';

interface EnrichedSupport extends SpecialNeedsSupport {
  studentName?: string;
  classroomName?: string;
  institutionName?: string;
  diagnosedByName?: string;
}

interface SpecialNeedsSupportListProps {
  includeInactive?: boolean;
}

// ---------- CSS Styles ----------
const formStyles = `
  /* Blue color classes */
  .bg-blue-100 { background-color: #dbeafe; }
  .text-blue-800 { color: #1e40af; }
  .text-blue-600 { color: #2563eb; }
  .text-blue-900 { color: #1e3a8a; }
  .hover\\:text-blue-900:hover { color: #1e3a8a; }
  
  /* Green color classes */
  .bg-green-100 { background-color: #dcfce7; }
  .text-green-800 { color: #166534; }
  .text-green-600 { color: #16a34a; }
  .text-green-900 { color: #14532d; }
  .hover\\:text-green-900:hover { color: #14532d; }
`;

const SpecialNeedsSupportList: React.FC<SpecialNeedsSupportListProps> = ({ includeInactive = false }) => {
  const [supports, setSupports] = useState<EnrichedSupport[]>([]);
  const [filteredSupports, setFilteredSupports] = useState<EnrichedSupport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all');
  const [supportTypeFilter, setSupportTypeFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadSupports();
  }, [includeInactive]);

  useEffect(() => {
    applyFilters();
  }, [supports, searchTerm, statusFilter, supportTypeFilter]);

  // Carga los soportes con nombres reales
  const enrichWithNames = async (supportsList: SpecialNeedsSupport[]): Promise<EnrichedSupport[]> => {
    const enrichedSupports = await Promise.all(
      supportsList.map(async (support) => {
        try {
          const [studentName, classroomName, institutionName, diagnosedByName] = await Promise.all([
            psychologyService.getStudentName(support.studentId),
            psychologyService.getClassroomName(support.classroomId),
            psychologyService.getInstitutionName(support.institutionId),
            psychologyService.getEvaluatorName(support.diagnosedBy),
          ]);

          return {
            ...support,
            studentName,
            classroomName,
            institutionName,
            diagnosedByName,
          };
        } catch {
          // Si falla, usar valores por defecto
          return {
            ...support,
            studentName: `Estudiante ${support.studentId.substring(0, 8)}`,
            classroomName: `Aula ${support.classroomId.substring(0, 8)}`,
            institutionName: `Institución ${support.institutionId.substring(0, 8)}`,
            diagnosedByName: `Evaluador ${support.diagnosedBy.substring(0, 8)}`,
          };
        }
      })
    );

    return enrichedSupports;
  };

  // Cargar todos los registros
  const loadSupports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = includeInactive ? await getAllSupportsIncludingInactive() : await getAllSupports();
      const enrichedData = await enrichWithNames(data);
      setSupports(enrichedData);
    } catch (error) {
      console.error('Error al cargar los soportes:', error);
      setError('No se pudieron cargar los soportes');
      showErrorAlert('Error', 'No se pudieron cargar los soportes');
    } finally {
      setLoading(false);
    }
  };

  // Filtro de búsqueda y estado
  const applyFilters = () => {
    let filtered = [...supports];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((support) =>
        support.studentName?.toLowerCase().includes(term) ||
        support.studentId.toLowerCase().includes(term) ||
        support.diagnosis.toLowerCase().includes(term) ||
        support.supportType.toLowerCase().includes(term) ||
        support.classroomName?.toLowerCase().includes(term) ||
        support.institutionName?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((support) => support.status === statusFilter);
    }

    if (supportTypeFilter !== 'all') {
      filtered = filtered.filter((support) => support.supportType === supportTypeFilter);
    }

    setFilteredSupports(filtered);
  };

  // Desactivar
  const handleDeactivate = async (id: string) => {
    const confirmResult = await showConfirmDialog('¿Desactivar este soporte?', '¿Está seguro que desea desactivar este soporte?');

    if (confirmResult.isConfirmed) {
      try {
        await deactivateSupport(id);
        showSuccessAlert('Desactivado', 'El soporte fue desactivado correctamente.');
        await loadSupports();
      } catch (error) {
        console.error('Error al desactivar el soporte:', error);
        showErrorAlert('Error', 'No se pudo desactivar el soporte');
      }
    }
  };

  // Activar
  const handleActivate = async (id: string) => {
    try {
      await activateSupport(id);
      showSuccessAlert('Reactivado', 'El soporte fue reactivado correctamente.');
      await loadSupports();
    } catch (error) {
      console.error('Error al reactivar el soporte:', error);
      showErrorAlert('Error', 'No se pudo reactivar el soporte');
    }
  };

  // Etiquetas legibles
  const getSupportTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      MOTOR: 'Motor',
      COGNITIVO: 'Cognitivo',
      SENSORIAL: 'Sensorial',
      EMOCIONAL: 'Emocional',
      LENGUAJE: 'Lenguaje',
      CONDUCTUAL: 'Conductual',
      COGNITIVE: 'Cognitivo',
      VISUAL: 'Visual',
      AUDITORY: 'Auditivo',
      OTHER: 'Otro',
    };
    return labels[type] || type;
  };

  // ------------------ BADGE DE ESTADO ------------------
  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE') =>
    status === 'ACTIVE' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Activo
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactivo
      </span>
    );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Cargando soportes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{formStyles}</style>
      {/* Resumen de estadísticas - Arriba */}
      {supports.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-700">{filteredSupports.length}</div>
                <div className="text-sm font-medium text-blue-600 mt-1">Total Soportes</div>
              </div>
              <div className="bg-blue-200 rounded-full p-3">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-700">
                  {filteredSupports.filter(s => s.status === 'ACTIVE').length}
                </div>
                <div className="text-sm font-medium text-green-600 mt-1">Activos</div>
              </div>
              <div className="bg-green-200 rounded-full p-3">
                <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-red-700">
                  {filteredSupports.filter(s => s.status === 'INACTIVE').length}
                </div>
                <div className="text-sm font-medium text-red-600 mt-1">Inactivos</div>
              </div>
              <div className="bg-red-200 rounded-full p-3">
                <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-700">
                  {new Set(filteredSupports.map(s => s.studentId)).size}
                </div>
                <div className="text-sm font-medium text-purple-600 mt-1">Estudiantes</div>
              </div>
              <div className="bg-purple-200 rounded-full p-3">
                <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros mejorados */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                placeholder="Buscar por estudiante Y diagnóstico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="supportType" className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Soporte
            </label>
            <select
              id="supportType"
              value={supportTypeFilter}
              onChange={(e) => setSupportTypeFilter(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm bg-white"
            >
              <option value="all">Todos los tipos</option>
              <option value="COGNITIVO">Cognitivo</option>
              <option value="MOTOR">Motor</option>
              <option value="SENSORIAL">Sensorial</option>
              <option value="EMOCIONAL">Emocional</option>
              <option value="LENGUAJE">Lenguaje</option>
              <option value="CONDUCTUAL">Conductual</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
              Estado
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'ACTIVE' | 'INACTIVE')}
              className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm bg-white"
            >
              <option value="all">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadSupports}
              className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>

        {/* Indicador de resultados */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 font-medium">
            Mostrando <span className="text-indigo-600 font-semibold">{filteredSupports.length}</span> de <span className="font-semibold">{supports.length}</span> soportes
          </div>
          {(searchTerm || statusFilter !== 'all' || supportTypeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSupportTypeFilter('all');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla mejorada */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-4 pl-6 pr-3 text-left text-xs font-bold uppercase tracking-wider">Estudiante</th>
              <th className="px-3 py-4 text-left text-xs font-bold uppercase tracking-wider">Aula</th>
              <th className="px-3 py-4 text-left text-xs font-bold uppercase tracking-wider">Diagnóstico</th>
              <th className="px-3 py-4 text-left text-xs font-bold uppercase tracking-wider">Tipo</th>
              <th className="px-3 py-4 text-left text-xs font-bold uppercase tracking-wider">Año</th>
              <th className="px-3 py-4 text-left text-xs font-bold uppercase tracking-wider">Estado</th>
              <th className="relative py-4 pl-3 pr-6"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredSupports.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">No se encontraron soportes</p>
                    <p className="text-xs text-gray-400 mt-1">Intenta ajustar los filtros de búsqueda</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSupports.map((support) => (
                <tr key={support.id} className="hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 last:border-0">
                  <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm">
                    <div className="font-semibold text-gray-900">{support.studentName || support.studentId}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{support.institutionName}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 font-medium">
                    {support.classroomName || support.classroomId}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="line-clamp-2 font-medium">{support.diagnosis}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800">
                      {getSupportTypeLabel(support.supportType)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 font-medium">
                    {support.academicYear}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    {getStatusBadge(support.status)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/psychology/supports/${support.id}`)}
                        className="inline-flex items-center px-3 py-1.5 text-indigo-600 hover:text-white hover:bg-indigo-600 font-semibold rounded-lg transition-all duration-200 border border-indigo-200 hover:border-indigo-600"
                        title="Ver detalles"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => navigate(`/psychology/supports/edit/${support.id}`)}
                        className="inline-flex items-center px-3 py-1.5 text-blue-600 hover:text-white hover:bg-blue-600 font-semibold rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-600"
                        title="Editar soporte"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {support.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleDeactivate(support.id)}
                          className="inline-flex items-center px-3 py-1.5 text-red-600 hover:text-white hover:bg-red-600 font-semibold rounded-lg transition-all duration-200 border border-red-200 hover:border-red-600"
                          title="Desactivar soporte"
                        >
                          <svg
                            className="w-4 h-4 mr-1.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(support.id)}
                          className="inline-flex items-center px-3 py-1.5 text-green-600 hover:text-green-600 hover:bg-white font-semibold rounded-lg transition-all duration-200 border border-green-200 hover:border-green-600 bg-transparent"
                          title="Reactivar soporte"
                        >
                          <svg
                            className="w-4 h-4 mr-1.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Reactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpecialNeedsSupportList;