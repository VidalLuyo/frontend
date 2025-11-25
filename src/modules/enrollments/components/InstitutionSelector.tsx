/**
 * Componente para seleccionar institución y aula
 * Integra con el microservicio de instituciones
 */

import React, { useState, useEffect } from 'react';
import { institutionIntegrationService, integrationUtils } from '../service/Integration.service';
import type { InstitutionSummary, InstitutionWithUsersAndClassroomsResponseDto, Classroom } from '../models/integration.model';

interface InstitutionSelectorProps {
  onInstitutionSelected: (institution: InstitutionWithUsersAndClassroomsResponseDto) => void;
  onClassroomSelected: (classroom: Classroom) => void;
  selectedInstitution?: InstitutionWithUsersAndClassroomsResponseDto | null;
  selectedClassroom?: Classroom | null;
  disabled?: boolean;
}

export const InstitutionSelector: React.FC<InstitutionSelectorProps> = ({
  onInstitutionSelected,
  onClassroomSelected,
  selectedInstitution,
  selectedClassroom,
  disabled = false
}) => {
  const [institutions, setInstitutions] = useState<InstitutionSummary[]>([]);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [isLoadingInstitutionDetails, setIsLoadingInstitutionDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar instituciones disponibles
  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    setIsLoadingInstitutions(true);
    setError(null);

    try {
      console.log('🏫 Cargando instituciones...');
      const institutionsData = await institutionIntegrationService.getAvailableInstitutions();
      
      console.log('🏫 Instituciones cargadas:', institutionsData);
      
      // Validar que sea un array
      if (!Array.isArray(institutionsData)) {
        throw new Error(`Datos inválidos recibidos: esperaba array, recibió ${typeof institutionsData}`);
      }
      
      setInstitutions(institutionsData);
      console.log(`✅ ${institutionsData.length} instituciones cargadas correctamente`);
    } catch (err) {
      console.error('❌ Error al cargar instituciones:', err);
      
      let errorMessage = 'Error al cargar instituciones';
      if (err instanceof Error) {
        if (err.message.includes('ECONNREFUSED')) {
          errorMessage = 'No se puede conectar al servicio de instituciones. Verifique que esté ejecutándose en puerto 9080.';
        } else if (err.message.includes('404')) {
          errorMessage = 'Endpoint de instituciones no encontrado. Verifique la URL del API.';
        } else if (err.message.includes('array')) {
          errorMessage = `Formato de respuesta inválido: ${err.message}`;
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setInstitutions([]); // Asegurar que sea un array vacío
    } finally {
      setIsLoadingInstitutions(false);
    }
  };

  const handleInstitutionSelect = async (institutionSummary: InstitutionSummary) => {
    if (disabled) return;

    setIsLoadingInstitutionDetails(true);
    setError(null);

    try {
      const institutionDetails = await institutionIntegrationService.getInstitutionById(institutionSummary.institutionId);
      onInstitutionSelected(institutionDetails);
      
      // Limpiar selección de aula cuando se cambia de institución
      if (selectedClassroom) {
        onClassroomSelected(null as any);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar detalles de la institución';
      setError(errorMessage);
    } finally {
      setIsLoadingInstitutionDetails(false);
    }
  };

  const handleClassroomSelect = (classroom: Classroom) => {
    if (disabled) return;
    onClassroomSelected(classroom);
  };

  const filteredInstitutions = Array.isArray(institutions) 
    ? institutions.filter(institution =>
        institution?.institutionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        institution?.institutionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        institution?.address?.district?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="institution-selector">
      <div className="selector-section">
        <h3 className="section-title">
          <i className="fas fa-school"></i>
          Seleccionar Institución
        </h3>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
            <button onClick={loadInstitutions} className="retry-button">
              <i className="fas fa-redo"></i>
              Reintentar
            </button>
          </div>
        )}

        {!selectedInstitution && (
          <>
            <div className="search-box">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar institución por nombre, tipo o distrito..."
                className="search-input"
                disabled={disabled || isLoadingInstitutions}
              />
              <i className="fas fa-search search-icon"></i>
            </div>

            {isLoadingInstitutions ? (
              <div className="loading-state">
                <i className="fas fa-spinner fa-spin"></i>
                Cargando instituciones...
              </div>
            ) : (
              <div className="institutions-grid">
                {filteredInstitutions.map((institution) => (
                  <div
                    key={institution.institutionId}
                    className="institution-card"
                    onClick={() => handleInstitutionSelect(institution)}
                  >
                    <div className="institution-header">
                      {institution.logoUrl && (
                        <img 
                          src={institution.logoUrl} 
                          alt={`Logo de ${institution.institutionName}`}
                          className="institution-logo"
                        />
                      )}
                      <div className="institution-info">
                        <h4>{institution.institutionName}</h4>
                        <p className="institution-type">{institution.institutionType}</p>
                        <p className="institution-level">{institution.institutionLevel}</p>
                      </div>
                    </div>

                    <div className="institution-details">
                      <div className="address-info">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{integrationUtils.formatAddress(institution.address)}</span>
                      </div>
                      
                      <div className="classrooms-info">
                        <i className="fas fa-door-open"></i>
                        <span>{institution.availableClassrooms} aulas disponibles</span>
                      </div>
                    </div>

                    <div className="select-overlay">
                      <i className="fas fa-check-circle"></i>
                      Seleccionar
                    </div>
                  </div>
                ))}

                {filteredInstitutions.length === 0 && !isLoadingInstitutions && (
                  <div className="no-results">
                    <i className="fas fa-search"></i>
                    <p>No se encontraron instituciones que coincidan con la búsqueda</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Institución seleccionada */}
        {selectedInstitution && (
          <div className="selected-institution">
            <div className="institution-card selected">
              <div className="institution-header">
                <i className="fas fa-check-circle selected-icon"></i>
                {selectedInstitution.institutionInformation.logoUrl && (
                  <img 
                    src={selectedInstitution.institutionInformation.logoUrl} 
                    alt={`Logo de ${selectedInstitution.institutionInformation.institutionName}`}
                    className="institution-logo"
                  />
                )}
                <div className="institution-info">
                  <h4>{selectedInstitution.institutionInformation.institutionName}</h4>
                  <p className="institution-code">Código: {selectedInstitution.institutionInformation.codeInstitution}</p>
                  <p className="institution-type">{selectedInstitution.institutionInformation.institutionType}</p>
                </div>
              </div>

              <div className="institution-details">
                <div className="detail-row">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{integrationUtils.formatAddress(selectedInstitution.address)}</span>
                </div>
                
                <div className="detail-row">
                  <i className="fas fa-graduation-cap"></i>
                  <span>{selectedInstitution.institutionInformation.institutionLevel}</span>
                </div>

                <div className="detail-row">
                  <i className="fas fa-clock"></i>
                  <span>
                    {selectedInstitution.schedules.map(schedule => 
                      `${schedule.type}: ${schedule.entryTime} - ${schedule.exitTime}`
                    ).join(', ')}
                  </span>
                </div>

                {selectedInstitution.director && (
                  <div className="detail-row">
                    <i className="fas fa-user-tie"></i>
                    <span>Director: {selectedInstitution.director.firstName} {selectedInstitution.director.lastName}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onInstitutionSelected(null as any)}
                className="change-button"
                disabled={disabled}
              >
                <i className="fas fa-edit"></i>
                Cambiar Institución
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selector de Aulas */}
      {selectedInstitution && (
        <div className="classroom-section">
          <h3 className="section-title">
            <i className="fas fa-door-open"></i>
            Seleccionar Aula
          </h3>

          {isLoadingInstitutionDetails ? (
            <div className="loading-state">
              <i className="fas fa-spinner fa-spin"></i>
              Cargando aulas...
            </div>
          ) : (
            <div className="classrooms-grid">
              {selectedInstitution.classrooms
                .filter(classroom => integrationUtils.isClassroomActive(classroom.status))
                .map((classroom) => (
                  <div
                    key={classroom.classroomId}
                    className={`classroom-card ${selectedClassroom?.classroomId === classroom.classroomId ? 'selected' : ''}`}
                    onClick={() => handleClassroomSelect(classroom)}
                  >
                    <div className="classroom-header">
                      <div 
                        className="classroom-color"
                        style={{ backgroundColor: classroom.color }}
                      ></div>
                      <div className="classroom-info">
                        <h4>{classroom.classroomName}</h4>
                        <p className="classroom-age">{classroom.classroomAge}</p>
                      </div>
                      {selectedClassroom?.classroomId === classroom.classroomId && (
                        <i className="fas fa-check-circle selected-icon"></i>
                      )}
                    </div>

                    <div className="classroom-details">
                      <div className="capacity-info">
                        <i className="fas fa-users"></i>
                        <span>Capacidad: {classroom.capacity} estudiantes</span>
                      </div>
                      
                      <div className="status-info">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: integrationUtils.getStatusColor(classroom.status) }}
                        >
                          {integrationUtils.getStatusText(classroom.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

              {selectedInstitution.classrooms.filter(c => integrationUtils.isClassroomActive(c.status)).length === 0 && (
                <div className="no-results">
                  <i className="fas fa-door-closed"></i>
                  <p>No hay aulas activas disponibles en esta institución</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        .institution-selector {
          margin-bottom: 2rem;
        }

        .selector-section, .classroom-section {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 1rem;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: #333;
          font-size: 1.2rem;
        }

        .error-message {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          color: #F44336;
          background: #FFEBEE;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .retry-button {
          padding: 0.5rem 1rem;
          background: #F44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .search-box {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #2196F3;
        }

        .search-icon {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 2rem;
          color: #666;
        }

        .institutions-grid, .classrooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .institution-card, .classroom-card {
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
          position: relative;
          overflow: hidden;
        }

        .institution-card:hover, .classroom-card:hover {
          border-color: #2196F3;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .institution-card.selected, .classroom-card.selected {
          border-color: #4CAF50;
          background: #f8fff8;
        }

        .institution-header, .classroom-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          position: relative;
        }

        .institution-logo {
          width: 50px;
          height: 50px;
          object-fit: contain;
          border-radius: 4px;
        }

        .classroom-color {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .institution-info, .classroom-info {
          flex: 1;
        }

        .institution-info h4, .classroom-info h4 {
          margin: 0 0 0.25rem 0;
          color: #333;
          font-size: 1.1rem;
        }

        .institution-type, .institution-level, .institution-code, .classroom-age {
          margin: 0.25rem 0;
          color: #666;
          font-size: 0.9rem;
        }

        .selected-icon {
          color: #4CAF50;
          font-size: 1.5rem;
          position: absolute;
          top: 0;
          right: 0;
        }

        .institution-details, .classroom-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-row, .capacity-info, .status-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }

        .address-info, .classrooms-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #666;
          margin: 0.25rem 0;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          color: white;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .select-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(33, 150, 243, 0.9);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.3s ease;
          font-weight: 500;
        }

        .institution-card:hover .select-overlay {
          opacity: 1;
        }

        .change-button {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #FF9800;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .change-button:hover:not(:disabled) {
          background: #F57C00;
        }

        .change-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .no-results {
          grid-column: 1 / -1;
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .no-results i {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #ccc;
        }

        @media (max-width: 768px) {
          .institutions-grid, .classrooms-grid {
            grid-template-columns: 1fr;
          }

          .institution-header, .classroom-header {
            flex-direction: column;
            text-align: center;
          }

          .detail-row, .capacity-info {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default InstitutionSelector;