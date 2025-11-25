/**
 * Componente para seleccionar estudiante por ID o CUI
 * Integra con el microservicio de estudiantes
 */

import React, { useState, useCallback } from 'react';
import { studentIntegrationService, integrationUtils } from '../service/Integration.service';
import type { StudentData } from '../models/integration.model';

interface StudentSelectorProps {
  onStudentSelected: (student: StudentData) => void;
  selectedStudent?: StudentData | null;
  disabled?: boolean;
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  onStudentSelected,
  selectedStudent,
  disabled = false
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState<'id' | 'cui'>('cui');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<StudentData | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchValue.trim()) {
      setError('Ingrese un valor para buscar');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      let response;
      if (searchType === 'cui') {
        response = await studentIntegrationService.getStudentByCui(searchValue.trim());
      } else {
        response = await studentIntegrationService.getStudentById(searchValue.trim());
      }

      if (response.success && response.data) {
        // Debug: mostrar información del estado del estudiante
        console.log('🔍 Debug - Datos del estudiante:', {
          studentId: response.data.studentId,
          cui: response.data.cui,
          status: response.data.status,
          statusType: typeof response.data.status,
          isActive: integrationUtils.isStudentActive(response.data.status)
        });

        // Mostrar el estudiante encontrado independientemente del estado
        setSearchResults(response.data);
        
        // Verificar que el estudiante esté activo y mostrar advertencia si no lo está
        if (!integrationUtils.isStudentActive(response.data.status)) {
          setError(`⚠️ Advertencia: El estudiante tiene estado "${response.data.status}" (${integrationUtils.getStatusText(response.data.status)}). Verifique si puede ser matriculado.`);
        } else {
          setError(null);
        }
      } else {
        setError(response.message || 'No se encontró el estudiante');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al buscar estudiante';
      setError(errorMessage);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [searchValue, searchType]);

  const handleSelectStudent = () => {
    if (searchResults) {
      onStudentSelected(searchResults);
      setSearchResults(null);
      setSearchValue('');
    }
  };

  const handleClearSelection = () => {
    onStudentSelected(null as any);
    setSearchResults(null);
    setSearchValue('');
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="student-selector">
      <div className="search-section">
        <h3 className="section-title">
          <i className="fas fa-user-graduate"></i>
          Buscar Estudiante
        </h3>

        {!selectedStudent && (
          <div className="search-form">
            <div className="search-type-selector">
              <label className="radio-option">
                <input
                  type="radio"
                  value="cui"
                  checked={searchType === 'cui'}
                  onChange={(e) => setSearchType(e.target.value as 'cui')}
                  disabled={disabled}
                />
                <span>Buscar por CUI</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="id"
                  checked={searchType === 'id'}
                  onChange={(e) => setSearchType(e.target.value as 'id')}
                  disabled={disabled}
                />
                <span>Buscar por ID</span>
              </label>
            </div>

            <div className="search-input-group">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={searchType === 'cui' ? 'Ingrese el CUI del estudiante' : 'Ingrese el ID del estudiante'}
                className="search-input"
                disabled={disabled || isLoading}
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={disabled || isLoading || !searchValue.trim()}
                className="search-button"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Buscando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search"></i>
                    Buscar
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Resultados de búsqueda */}
        {searchResults && !selectedStudent && (
          <div className="search-results">
            <div className="student-card">
              <div className="student-header">
                <div className="student-photo">
                  {searchResults.photoPerfil ? (
                    <img src={searchResults.photoPerfil} alt="Foto del estudiante" />
                  ) : (
                    <div className="photo-placeholder">
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                </div>
                <div className="student-info">
                  <h4>{integrationUtils.formatStudentName(searchResults.personalInfo)}</h4>
                  <p className="student-details">
                    <span><strong>CUI:</strong> {searchResults.cui}</span>
                    <span><strong>DNI:</strong> {searchResults.personalInfo.documentNumber}</span>
                    <span><strong>Fecha de Nacimiento:</strong> {searchResults.dateOfBirth}</span>
                  </p>
                  <p className="student-address">
                    <i className="fas fa-map-marker-alt"></i>
                    {searchResults.address}
                  </p>
                  <div className="student-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: integrationUtils.getStatusColor(searchResults.status) }}
                    >
                      {integrationUtils.getStatusText(searchResults.status)}
                    </span>
                  </div>
                </div>
              </div>

              {searchResults.guardians && searchResults.guardians.length > 0 && (
                <div className="guardians-info">
                  <h5>Apoderados:</h5>
                  <div className="guardians-list">
                    {searchResults.guardians.map((guardian, index) => (
                      <div key={index} className="guardian-item">
                        <span className="guardian-name">
                          {guardian.names} {guardian.lastNames}
                        </span>
                        <span className="guardian-relationship">({guardian.relationship})</span>
                        <span className="guardian-phone">
                          <i className="fas fa-phone"></i>
                          {guardian.phone}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="action-buttons">
                <button
                  type="button"
                  onClick={handleSelectStudent}
                  className={`select-button ${!integrationUtils.isStudentActive(searchResults.status) ? 'warning' : ''}`}
                  disabled={disabled}
                  title={!integrationUtils.isStudentActive(searchResults.status) ? 
                    `Estudiante con estado: ${integrationUtils.getStatusText(searchResults.status)}` : 
                    'Seleccionar estudiante activo'}
                >
                  <i className={`fas ${integrationUtils.isStudentActive(searchResults.status) ? 'fa-check' : 'fa-exclamation-triangle'}`}></i>
                  {integrationUtils.isStudentActive(searchResults.status) ? 
                    'Seleccionar Estudiante' : 
                    `Seleccionar (${integrationUtils.getStatusText(searchResults.status)})`}
                </button>
                <button
                  type="button"
                  onClick={() => setSearchResults(null)}
                  className="cancel-button"
                >
                  <i className="fas fa-times"></i>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Estudiante seleccionado */}
        {selectedStudent && (
          <div className="selected-student">
            <div className="student-card selected">
              <div className="student-header">
                <div className="student-photo">
                  {selectedStudent.photoPerfil ? (
                    <img src={selectedStudent.photoPerfil} alt="Foto del estudiante" />
                  ) : (
                    <div className="photo-placeholder">
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                </div>
                <div className="student-info">
                  <h4>
                    <i className="fas fa-check-circle"></i>
                    {integrationUtils.formatStudentName(selectedStudent.personalInfo)}
                  </h4>
                  <p className="student-details">
                    <span><strong>CUI:</strong> {selectedStudent.cui}</span>
                    <span><strong>DNI:</strong> {selectedStudent.personalInfo.documentNumber}</span>
                    <span><strong>Fecha de Nacimiento:</strong> {selectedStudent.dateOfBirth}</span>
                  </p>
                  <div className="student-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: integrationUtils.getStatusColor(selectedStudent.status) }}
                    >
                      {integrationUtils.getStatusText(selectedStudent.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="change-button"
                  disabled={disabled}
                >
                  <i className="fas fa-edit"></i>
                  Cambiar Estudiante
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .student-selector {
          margin-bottom: 2rem;
        }

        .search-section {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: #333;
          font-size: 1.2rem;
        }

        .search-form {
          margin-bottom: 1rem;
        }

        .search-type-selector {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .radio-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .radio-option input[type="radio"] {
          margin: 0;
        }

        .search-input-group {
          display: flex;
          gap: 0.5rem;
        }

        .search-input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #2196F3;
        }

        .search-button {
          padding: 0.75rem 1.5rem;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .search-button:hover:not(:disabled) {
          background: #1976D2;
        }

        .search-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #F44336;
          background: #FFEBEE;
          padding: 0.75rem;
          border-radius: 4px;
          margin-top: 0.5rem;
        }

        .search-results, .selected-student {
          margin-top: 1rem;
        }

        .student-card {
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 1.5rem;
          background: white;
        }

        .student-card.selected {
          border-color: #4CAF50;
          background: #f8fff8;
        }

        .student-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .student-photo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .student-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-placeholder {
          width: 100%;
          height: 100%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 2rem;
        }

        .student-info h4 {
          margin: 0 0 0.5rem 0;
          color: #333;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .student-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin: 0.5rem 0;
          font-size: 0.9rem;
          color: #666;
        }

        .student-address {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
          font-size: 0.9rem;
          margin: 0.5rem 0;
        }

        .student-status {
          margin: 0.5rem 0;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          color: white;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .guardians-info {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e0e0e0;
        }

        .guardians-info h5 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .guardians-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .guardian-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .guardian-name {
          font-weight: 500;
          color: #333;
        }

        .guardian-relationship {
          color: #666;
          font-style: italic;
        }

        .guardian-phone {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #2196F3;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .select-button, .change-button {
          padding: 0.75rem 1.5rem;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .select-button:hover:not(:disabled), .change-button:hover:not(:disabled) {
          background: #45a049;
        }

        .select-button.warning {
          background: #FF9800;
        }

        .select-button.warning:hover:not(:disabled) {
          background: #F57C00;
        }

        .cancel-button {
          padding: 0.75rem 1.5rem;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .cancel-button:hover {
          background: #d32f2f;
        }

        .change-button {
          background: #FF9800;
        }

        .change-button:hover:not(:disabled) {
          background: #F57C00;
        }

        @media (max-width: 768px) {
          .student-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .student-details {
            align-items: center;
          }

          .action-buttons {
            flex-direction: column;
          }

          .guardian-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentSelector;