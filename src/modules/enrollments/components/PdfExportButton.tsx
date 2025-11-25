/**
 * Componente: PdfExportButton
 * Botón para exportar matrículas a PDF con opciones avanzadas
 */

import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import SimplePdfExportService from '../service/SimplePdfExport.service';
import type { Enrollment } from '../models/enrollments.model';

interface PdfExportButtonProps {
  enrollment?: Enrollment;
  enrollments?: Enrollment[];
  variant?: 'single' | 'multiple' | 'selected';
  className?: string;
}

export const PdfExportButton: React.FC<PdfExportButtonProps> = ({
  enrollment,
  enrollments = [],
  variant = 'single',
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);



  const handleExportSingle = async () => {
    if (!enrollment) return;

    setIsExporting(true);
    setExportError(null);

    try {
      await SimplePdfExportService.generateEnrollmentPdf(enrollment);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al exportar PDF';
      setExportError(errorMessage);
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMultiple = async () => {
    if (enrollments.length === 0) return;

    setIsExporting(true);
    setExportError(null);

    try {
      await SimplePdfExportService.generateMultipleEnrollmentsPdf(enrollments);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al exportar PDFs';
      setExportError(errorMessage);
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (variant === 'single') {
      handleExportSingle();
    } else {
      handleExportMultiple();
    }
  };



  const isDisabled = isExporting || 
    (variant === 'single' && !enrollment) || 
    (variant !== 'single' && enrollments.length === 0);

  return (
    <div className="pdf-export-container">
      <button
        onClick={handleExport}
        disabled={isDisabled}
        className={`
          text-purple-600 hover:text-purple-900 disabled:text-gray-400
          p-1 rounded transition-colors
          disabled:cursor-not-allowed disabled:opacity-50
          ${className}
        `}
        title="Exportar PDF"
      >
        {isExporting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <FileText size={16} />
        )}
        

      </button>

      {/* Mostrar error si existe */}
      {exportError && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error al exportar PDF</h3>
              <p className="text-sm text-red-700 mt-1">{exportError}</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pdf-export-container {
          position: relative;
        }

        .pdf-export-container button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .pdf-export-container button:active {
          transform: translateY(0);
        }

        .pdf-export-container button:disabled:hover {
          transform: none;
          box-shadow: none;
        }

        @media (max-width: 640px) {
          .pdf-export-container button {
            min-width: 44px;
            min-height: 44px;
          }
        }
      `}</style>
    </div>
  );
};

export default PdfExportButton;