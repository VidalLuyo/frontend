/**
 * Componente: AcademicPeriodForm
 * Formulario para crear y editar períodos académicos
 */

import { useState, useEffect } from "react";
import { Calendar, AlertCircle, CheckCircle, Building, Clock } from "lucide-react";
import type { AcademicPeriod } from "../models/academicPeriod.model";

interface AcademicPeriodFormProps {
  period?: AcademicPeriod;
  onSave: (period: AcademicPeriod) => void;
  onCancel: () => void;
}

const defaultPeriod: Omit<AcademicPeriod, 'id'> = {
  institutionId: "",
  academicYear: "2025",
  periodName: "",
  startDate: "",
  endDate: "",
  enrollmentPeriodStart: "",
  enrollmentPeriodEnd: "",
  allowLateEnrollment: false,
  lateEnrollmentEndDate: "",
  status: "ACTIVE"
};

export function AcademicPeriodForm({ period, onSave, onCancel }: AcademicPeriodFormProps) {
  const [formData, setFormData] = useState<Omit<AcademicPeriod, 'id'>>(period || defaultPeriod);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (period) {
      setFormData({
        ...period,
        // Convertir fechas ISO a formato datetime-local
        startDate: period.startDate ? new Date(period.startDate).toISOString().slice(0, 16) : "",
        endDate: period.endDate ? new Date(period.endDate).toISOString().slice(0, 16) : "",
        enrollmentPeriodStart: period.enrollmentPeriodStart ? new Date(period.enrollmentPeriodStart).toISOString().slice(0, 16) : "",
        enrollmentPeriodEnd: period.enrollmentPeriodEnd ? new Date(period.enrollmentPeriodEnd).toISOString().slice(0, 16) : "",
        lateEnrollmentEndDate: period.lateEnrollmentEndDate ? new Date(period.lateEnrollmentEndDate).toISOString().slice(0, 16) : ""
      });
    }
  }, [period]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Campos requeridos según la API
    if (!formData.institutionId.trim()) {
      newErrors.institutionId = "El ID de la institución es requerido";
    }
    
    if (!formData.academicYear.trim()) {
      newErrors.academicYear = "El año académico es requerido";
    }
    
    if (!formData.periodName.trim()) {
      newErrors.periodName = "El nombre del período es requerido";
    }
    
    if (!formData.startDate) {
      newErrors.startDate = "La fecha de inicio es requerida";
    }
    
    if (!formData.endDate) {
      newErrors.endDate = "La fecha de fin es requerida";
    }
    
    if (!formData.enrollmentPeriodStart) {
      newErrors.enrollmentPeriodStart = "El inicio del período de matrícula es requerido";
    }
    
    if (!formData.enrollmentPeriodEnd) {
      newErrors.enrollmentPeriodEnd = "El fin del período de matrícula es requerido";
    }
    
    // Validaciones de fechas lógicas
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (startDate >= endDate) {
        newErrors.endDate = "La fecha de fin debe ser posterior a la fecha de inicio";
      }
    }
    
    if (formData.enrollmentPeriodStart && formData.enrollmentPeriodEnd) {
      const enrollStart = new Date(formData.enrollmentPeriodStart);
      const enrollEnd = new Date(formData.enrollmentPeriodEnd);
      
      if (enrollStart >= enrollEnd) {
        newErrors.enrollmentPeriodEnd = "El fin del período de matrícula debe ser posterior al inicio";
      }
    }
    
    // Validar matrícula tardía
    if (formData.allowLateEnrollment && !formData.lateEnrollmentEndDate) {
      newErrors.lateEnrollmentEndDate = "La fecha límite de matrícula tardía es requerida cuando se permite matrícula tardía";
    }
    
    if (formData.allowLateEnrollment && formData.lateEnrollmentEndDate && formData.enrollmentPeriodEnd) {
      const enrollEnd = new Date(formData.enrollmentPeriodEnd);
      const lateEnd = new Date(formData.lateEnrollmentEndDate);
      
      if (lateEnd <= enrollEnd) {
        newErrors.lateEnrollmentEndDate = "La fecha límite de matrícula tardía debe ser posterior al fin del período normal de matrícula";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Convertir fechas de datetime-local a ISO
      const periodData = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : "",
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : "",
        enrollmentPeriodStart: formData.enrollmentPeriodStart ? new Date(formData.enrollmentPeriodStart).toISOString() : "",
        enrollmentPeriodEnd: formData.enrollmentPeriodEnd ? new Date(formData.enrollmentPeriodEnd).toISOString() : "",
        lateEnrollmentEndDate: formData.lateEnrollmentEndDate ? new Date(formData.lateEnrollmentEndDate).toISOString() : undefined
      };
      
      if (period && period.id) {
        onSave({ ...periodData, id: period.id });
      } else {
        onSave(periodData as AcademicPeriod);
      }
    }
  };

  // Verificar si las fechas son válidas
  const isDateRangeValid = () => {
    if (!formData.startDate || !formData.endDate) return true;
    return new Date(formData.startDate) < new Date(formData.endDate);
  };

  const isEnrollmentDateRangeValid = () => {
    if (!formData.enrollmentPeriodStart || !formData.enrollmentPeriodEnd) return true;
    return new Date(formData.enrollmentPeriodStart) < new Date(formData.enrollmentPeriodEnd);
  };

  return (
    <div className="bg-white">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información General */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-100">
          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Información General
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="periodName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Período *
              </label>
              <input
                type="text"
                id="periodName"
                name="periodName"
                value={formData.periodName || ''}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  errors.periodName ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                }`}
                placeholder="Ej: Primer Bimestre, Segundo Semestre"
              />
              {errors.periodName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.periodName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-2">
                Año Académico *
              </label>
              <input
                type="text"
                id="academicYear"
                name="academicYear"
                value={formData.academicYear || ''}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  errors.academicYear ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                }`}
                placeholder="Ej: 2025, 2024-2025"
              />
              {errors.academicYear && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.academicYear}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="institutionId" className="block text-sm font-medium text-gray-700 mb-2">
                ID de la Institución *
              </label>
              <input
                type="text"
                id="institutionId"
                name="institutionId"
                value={formData.institutionId || ''}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  errors.institutionId ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                }`}
                placeholder="Ej: inst_001"
              />
              {errors.institutionId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.institutionId}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Estado del Período
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-gray-400 transition-all"
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="COMPLETED">Completado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Fechas del Período Académico */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Fechas del Período Académico
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio *
              </label>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                value={formData.startDate || ''}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.startDate ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.startDate}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin *
              </label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={formData.endDate || ''}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.endDate ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Indicador de validez de fechas */}
          {formData.startDate && formData.endDate && (
            <div className="mt-4 p-3 rounded-lg border">
              {isDateRangeValid() ? (
                <div className="flex items-center text-green-700 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Rango de fechas válido</span>
                </div>
              ) : (
                <div className="flex items-center text-red-700 bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">La fecha de fin debe ser posterior a la fecha de inicio</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Período de Matrícula */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Período de Matrícula
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="enrollmentPeriodStart" className="block text-sm font-medium text-gray-700 mb-2">
                Inicio del Período de Matrícula *
              </label>
              <input
                type="datetime-local"
                id="enrollmentPeriodStart"
                name="enrollmentPeriodStart"
                value={formData.enrollmentPeriodStart || ''}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                  errors.enrollmentPeriodStart ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                }`}
              />
              {errors.enrollmentPeriodStart && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.enrollmentPeriodStart}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="enrollmentPeriodEnd" className="block text-sm font-medium text-gray-700 mb-2">
                Fin del Período de Matrícula *
              </label>
              <input
                type="datetime-local"
                id="enrollmentPeriodEnd"
                name="enrollmentPeriodEnd"
                value={formData.enrollmentPeriodEnd || ''}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                  errors.enrollmentPeriodEnd ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                }`}
              />
              {errors.enrollmentPeriodEnd && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.enrollmentPeriodEnd}
                </p>
              )}
            </div>
          </div>

          {/* Indicador de validez de fechas de matrícula */}
          {formData.enrollmentPeriodStart && formData.enrollmentPeriodEnd && (
            <div className="mt-4 p-3 rounded-lg border">
              {isEnrollmentDateRangeValid() ? (
                <div className="flex items-center text-green-700 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Período de matrícula válido</span>
                </div>
              ) : (
                <div className="flex items-center text-red-700 bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">El fin del período de matrícula debe ser posterior al inicio</span>
                </div>
              )}
            </div>
          )}

          {/* Matrícula Tardía */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center">
              <input
                id="allowLateEnrollment"
                name="allowLateEnrollment"
                type="checkbox"
                checked={formData.allowLateEnrollment}
                onChange={handleChange}
                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="allowLateEnrollment" className="ml-3 block text-sm font-medium text-gray-900">
                Permitir matrícula tardía
              </label>
            </div>

            {formData.allowLateEnrollment && (
              <div>
                <label htmlFor="lateEnrollmentEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Límite para Matrícula Tardía *
                </label>
                <input
                  type="datetime-local"
                  id="lateEnrollmentEndDate"
                  name="lateEnrollmentEndDate"
                  value={formData.lateEnrollmentEndDate || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    errors.lateEnrollmentEndDate ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                />
                {errors.lateEnrollmentEndDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.lateEnrollmentEndDate}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Esta fecha debe ser posterior al fin del período normal de matrícula
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          >
            {period ? "Actualizar" : "Crear"} Período
          </button>
        </div>
      </form>
    </div>
  );
}