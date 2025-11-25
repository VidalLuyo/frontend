/**
 * IntegratedEnrollmentPage - DEPRECADO
 * Esta funcionalidad ha sido consolidada en EnrollmentPage.tsx
 * Redirige automáticamente a la página principal de matrículas
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const IntegratedEnrollmentPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirigir automáticamente a la página principal de matrículas
    navigate('/enrollments', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo a la página de matrículas...</p>
      </div>
    </div>
  );
};

export default IntegratedEnrollmentPage;