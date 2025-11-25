import React, { useState, useEffect } from 'react';
import { usersService } from '../../users/service/User.service';
import type { User } from '../../users/models/users.model';

interface ChangeDirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDirector: (directorId: string, directorData: User) => void;
  currentDirectorId: string;
  institutionName: string;
}

const ChangeDirectorModal: React.FC<ChangeDirectorModalProps> = ({
  isOpen,
  onClose,
  onSelectDirector,
  currentDirectorId,
  institutionName
}) => {
  const [availableDirectors, setAvailableDirectors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDirectorId, setSelectedDirectorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAvailableDirectors();
    }
  }, [isOpen]);

  const loadAvailableDirectors = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener todos los usuarios
      const allUsers = await usersService.getAll();
      
      // Filtrar solo los directores que no tienen institución asignada
      // y que estén activos
      const directors = allUsers.filter(
        user => 
          user.role === 'DIRECTOR' && 
          user.status === 'ACTIVE' && 
          (!user.institutionId || user.institutionId === '' || user.institutionId.trim() === '')
      );
      
      console.log('Directores disponibles encontrados:', directors);
      
      setAvailableDirectors(directors);
      
      if (directors.length === 0) {
        setError('No hay directores disponibles sin institución asignada.');
      }
    } catch (err) {
      console.error('Error al cargar directores:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar directores disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedDirectorId) {
      console.log('Director seleccionado:', selectedDirectorId);
      console.log('Director actual:', currentDirectorId);
      
      // Buscar los datos completos del director seleccionado
      const selectedDirector = availableDirectors.find(d => d.userId === selectedDirectorId);
      if (selectedDirector) {
        onSelectDirector(selectedDirectorId, selectedDirector);
      }
      
      setSelectedDirectorId(null);
      setSearchTerm('');
    }
  };

  const filteredDirectors = availableDirectors.filter(director => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${director.firstName} ${director.lastName}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      director.email.toLowerCase().includes(searchLower) ||
      director.documentNumber.includes(searchLower)
    );
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Cambiar Director
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Seleccione un nuevo director para: <span className="font-semibold">{institutionName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mt-4">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, email o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <svg 
                className="absolute left-3 top-3 h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Directors List */}
          {!loading && !error && filteredDirectors.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-3">
                {filteredDirectors.length} {filteredDirectors.length === 1 ? 'director disponible' : 'directores disponibles'}
              </p>
              
              {filteredDirectors.map((director) => (
                <div
                  key={director.userId}
                  onClick={() => setSelectedDirectorId(director.userId)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedDirectorId === director.userId
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                        selectedDirectorId === director.userId ? 'bg-blue-500' : 'bg-gray-400'
                      }`}>
                        {director.firstName.charAt(0)}{director.lastName.charAt(0)}
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-semibold text-gray-900">
                          {director.firstName} {director.lastName}
                        </h4>
                        {selectedDirectorId === director.userId && (
                          <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-600 flex items-center">
                          <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {director.email}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          {director.documentType}: {director.documentNumber}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {director.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredDirectors.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron resultados</h3>
              <p className="mt-1 text-sm text-gray-500">
                No hay directores que coincidan con tu búsqueda.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDirectorId}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedDirectorId
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirmar Cambio
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeDirectorModal;
