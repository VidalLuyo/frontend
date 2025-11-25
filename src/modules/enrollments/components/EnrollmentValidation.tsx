/**
 * Componente para validar datos de matrícula
 * Muestra el resultado de la validación antes de crear la matrícula
 */

import React, { useState, useEffect } from 'react';
import { enrollmentValidationService } from '../service/Integration.service';
import type { EnrollmentValidationResponse } from '../models/integration.model';

interface EnrollmentValidationProps {
  studentId?: string;
  institutionId?: string;
  classroomId?: string;
  onValidationComplete: (isValid: boolean, validationData?: EnrollmentValidationResponse) => void;
  disabled?: boolean;
}

export const EnrollmentValidation: React.FC<EnrollmentValidationProps> = ({
  studentId,
  institutionId,
  classroomId,
  onValidationComplete,
  disabled = false
}) => {
  const [validationResult, setValidationResult] = useState<EnrollmentValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ejecutar validación cuando cambien los parámetros
  useEffect(() => {
    if (studentId && institutionId && classroomId) {
      validateEnrollmentData();
    } else {
      setValidationResult(null);
      setError(null);
      onValidationComplete(false);
    }
  }, [studentId, institutionId, classroomId]);

  const validateEnrollmentData = async () => {
    if (!studentId || !institutionId || !classroomId) {
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const result = await enrollmentValidationService.validateEnrollmentData(
        studentId,
        institutionId,
        classroomId
      );

      setValidationResult(result);
      onValidationComplete(result.valid, result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al validar datos de matrícula';
      setError(errorMessage);
      setValidationResult(null);
      onValidationComplete(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRetryValidation = () => {
    validateEnrollmentData();
  };

  if (!studentId || !institutionId || !classroomId) {
    return (
      <div className="validation-container">
        <div className="validation-pending">
          <i className="fas fa-info-circle"></i>
          <p>Complete la selección de estudiante, institución y aula para validar la matrícula</p>
        </div>

        <style>{`
          .validation-container {
            margin: 1rem 0;
          }

          .validation-pending {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem;
            background: #E3F2FD;
            border: 1px solid #2196F3;
            border-radius: 4px;
            color: #1976D2;
          }

          .validation-pending i {
            font-size: 1.2rem;
          }

          .validation-pending p {
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="validation-container">
      <h3 className="validation-title">
        <i className="fas fa-shield-alt"></i>
        Validación de Matrícula
      </h3>

      {isValidating && (
        <div className="validation-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Validando datos de matrícula...</span>
        </div>
      )}

      {error && (
        <div className="validation-error">
          <div className="error-content">
            <i className="fas fa-exclamation-triangle"></i>
            <div>
              <h4>Error de Validación</h4>
              <p>{error}</p>
            </div>
          </div>
          <button 
            onClick={handleRetryValidation}
            className="retry-button"
            disabled={disabled || isValidating}
          >
            <i className="fas fa-redo"></i>
            Reintentar
          </button>
        </div>
      )}

      {validationResult && !isValidating && (
        <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
          <div className="validation-header">
            <i className={`fas ${validationResult.valid ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
            <h4>
              {validationResult.valid ? 'Validación Exitosa' : 'Validación Fallida'}
            </h4>
          </div>

          <div className="validation-details">
            <div className="validation-checks">
              <div className={`check-item ${validationResult.studentValid ? 'valid' : 'invalid'}`}>
                <i className={`fas ${validationResult.studentValid ? 'fa-check' : 'fa-times'}`}></i>
                <span>Estudiante: {validationResult.studentName || 'No válido'}</span>
              </div>

              <div className={`check-item ${validationResult.institutionValid ? 'valid' : 'invalid'}`}>
                <i className={`fas ${validationResult.institutionValid ? 'fa-check' : 'fa-times'}`}></i>
                <span>Institución: {validationResult.institutionName || 'No válida'}</span>
              </div>

              <div className={`check-item ${validationResult.classroomValid ? 'valid' : 'invalid'}`}>
                <i className={`fas ${validationResult.classroomValid ? 'fa-check' : 'fa-times'}`}></i>
                <span>
                  Aula: {validationResult.classroomName || 'No válida'}
                  {validationResult.classroomCapacity && (
                    <small> (Capacidad: {validationResult.classroomCapacity})</small>
                  )}
                </span>
              </div>
            </div>

            {validationResult.validationMessage && (
              <div className="validation-message">
                <i className="fas fa-info-circle"></i>
                <p>{validationResult.validationMessage}</p>
              </div>
            )}

            {validationResult.valid && (
              <div className="success-summary">
                <i className="fas fa-thumbs-up"></i>
                <div>
                  <h5>¡Listo para Matricular!</h5>
                  <p>
                    El estudiante <strong>{validationResult.studentName}</strong> puede ser matriculado 
                    en el aula <strong>{validationResult.classroomName}</strong> de la institución{' '}
                    <strong>{validationResult.institutionName}</strong>.
                  </p>
                </div>
              </div>
            )}

            {!validationResult.valid && (
              <div className="error-summary">
                <i className="fas fa-exclamation-circle"></i>
                <div>
                  <h5>No se puede proceder con la matrícula</h5>
                  <p>
                    Hay problemas con los datos seleccionados. Por favor, verifique la información 
                    y seleccione opciones válidas.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="validation-actions">
            <button 
              onClick={handleRetryValidation}
              className="revalidate-button"
              disabled={disabled || isValidating}
            >
              <i className="fas fa-sync-alt"></i>
              Revalidar
            </button>
          </div>
        </div>
      )}

      <style>{`
        .validation-container {
          margin: 1rem 0;
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .validation-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: #333;
          font-size: 1.2rem;
        }

        .validation-loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: #FFF3E0;
          border: 1px solid #FF9800;
          border-radius: 4px;
          color: #F57C00;
        }

        .validation-error {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: #FFEBEE;
          border: 1px solid #F44336;
          border-radius: 4px;
          color: #D32F2F;
        }

        .error-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .error-content h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
        }

        .error-content p {
          margin: 0;
          font-size: 0.9rem;
        }

        .retry-button, .revalidate-button {
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

        .retry-button:hover:not(:disabled), .revalidate-button:hover:not(:disabled) {
          background: #D32F2F;
        }

        .retry-button:disabled, .revalidate-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .validation-result {
          border-radius: 4px;
          overflow: hidden;
        }

        .validation-result.valid {
          border: 2px solid #4CAF50;
          background: #F8FFF8;
        }

        .validation-result.invalid {
          border: 2px solid #F44336;
          background: #FFFBFB;
        }

        .validation-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(0,0,0,0.05);
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        .validation-result.valid .validation-header {
          background: rgba(76, 175, 80, 0.1);
          color: #2E7D32;
        }

        .validation-result.invalid .validation-header {
          background: rgba(244, 67, 54, 0.1);
          color: #C62828;
        }

        .validation-header i {
          font-size: 1.5rem;
        }

        .validation-header h4 {
          margin: 0;
          font-size: 1.1rem;
        }

        .validation-details {
          padding: 1rem;
        }

        .validation-checks {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .check-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .check-item.valid {
          background: rgba(76, 175, 80, 0.1);
          color: #2E7D32;
        }

        .check-item.invalid {
          background: rgba(244, 67, 54, 0.1);
          color: #C62828;
        }

        .check-item i {
          font-size: 1rem;
          width: 16px;
          text-align: center;
        }

        .check-item small {
          font-weight: normal;
          opacity: 0.8;
        }

        .validation-message {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #E3F2FD;
          border-radius: 4px;
          margin-bottom: 1rem;
          color: #1976D2;
        }

        .validation-message p {
          margin: 0;
          font-size: 0.9rem;
        }

        .success-summary, .error-summary {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .success-summary {
          background: rgba(76, 175, 80, 0.1);
          color: #2E7D32;
        }

        .error-summary {
          background: rgba(244, 67, 54, 0.1);
          color: #C62828;
        }

        .success-summary i, .error-summary i {
          font-size: 1.5rem;
          margin-top: 0.25rem;
        }

        .success-summary h5, .error-summary h5 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
        }

        .success-summary p, .error-summary p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .validation-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid rgba(0,0,0,0.1);
        }

        .revalidate-button {
          background: #2196F3;
        }

        .revalidate-button:hover:not(:disabled) {
          background: #1976D2;
        }

        @media (max-width: 768px) {
          .validation-error {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .success-summary, .error-summary {
            flex-direction: column;
            text-align: center;
          }

          .check-item {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default EnrollmentValidation;