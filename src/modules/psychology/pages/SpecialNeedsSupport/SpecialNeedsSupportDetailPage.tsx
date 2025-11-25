import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { showErrorAlert } from '../../../../shared/utils/sweetAlert';
import { getSupportById } from '../../service/SpecialNeedsSupport.service';
import psychologyService from '../../service/Psychology.service';
import type { SpecialNeedsSupport } from '../../models/specialNeedSupport';

interface EnrichedSupport extends SpecialNeedsSupport {
  studentName?: string;
  classroomName?: string;
  institutionName?: string;
  diagnosedByName?: string;
}

export function SpecialNeedsSupportDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [support, setSupport] = useState<EnrichedSupport | null>(null);
  const [loading, setLoading] = useState(true);

  // ---------- CSS Styles ----------
  const formStyles = `
    /* Green color classes */
    .bg-green-100 { background-color: #dcfce7; }
    .text-green-800 { color: #166534; }
    .text-green-600 { color: #16a34a; }
    .text-green-900 { color: #14532d; }
    .hover\\:text-green-900:hover { color: #14532d; }
  `;

  // ------------------ CARGAR DATOS ------------------
  useEffect(() => {
    if (id) loadSupport(id);
  }, [id]);

  const loadSupport = async (supportId: string) => {
    try {
      const data = await getSupportById(supportId);
      
      // llama nombres reales
      try {
        const [studentName, classroomName, institutionName, diagnosedByName] = await Promise.all([
          psychologyService.getStudentName(data.studentId),
          psychologyService.getClassroomName(data.classroomId),
          psychologyService.getInstitutionName(data.institutionId),
          psychologyService.getEvaluatorName(data.diagnosedBy),
        ]);

        setSupport({
          ...data,
          studentName,
          classroomName,
          institutionName,
          diagnosedByName,
        });
      } catch (nameError) {
        console.warn('Error loading names:', nameError);
        // Si falla, usar IDs truncados como respaldo
        setSupport({
          ...data,
          studentName: `Estudiante ${data.studentId.substring(0, 8)}`,
          classroomName: `Aula ${data.classroomId.substring(0, 8)}`,
          institutionName: `Institución ${data.institutionId.substring(0, 8)}`,
          diagnosedByName: `Evaluador ${data.diagnosedBy.substring(0, 8)}`,
        });
      }
    } catch (error) {
      console.error('Error loading support:', error);
      showErrorAlert('Error', 'No se pudo cargar el soporte.');
      navigate('/psychology/supports');
    } finally {
      setLoading(false);
    }
  };

  // ------------------ LABEL DE TIPO DE SOPORTE ------------------
  const getSupportTypeLabel = (type: string) => {
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
    return labels[type] ?? type;
  };

  // ------------------ BADGE DE ESTADO ------------------
  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE') =>
    status === 'ACTIVE' ? (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        Activo
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
        Inactivo
      </span>
    );

  // ------------------ LOADING ... ------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h3 className="font-semibold text-gray-900">Cargando soporte</h3>
              <p className="text-gray-600 text-sm">
                Obteniendo datos del servidor...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------ALERTA DE ERROR: NO SE ENCONTRÓ ------------------
  if (!support) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-200 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-6 text-sm">
              No se pudo cargar la información del soporte
            </p>
            <button
              onClick={() => navigate('/psychology/supports')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------ DETALLE ------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{formStyles}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          {/* HEADER */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Detalle del Soporte Especial
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Información detallada del apoyo para necesidades especiales
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/psychology/supports')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500"
              >
                Volver
              </button>
              <button
                onClick={() =>
                  navigate(`/psychology/supports/edit/${support.id}`)
                }
                className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
              >
                Editar
              </button>
            </div>
          </div>

          {/* CONTENIDO */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* INFORMACIÓN PRINCIPAL */}
              <div className="lg:col-span-2 space-y-6">
                {/* Información General */}
                <section className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Información General
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Estudiante" value={support.studentName || support.studentId} />
                    <Field label="Aula" value={support.classroomName || support.classroomId} />
                    <Field label="Institución" value={support.institutionName || support.institutionId} />
                    <Field label="Año Académico" value={String(support.academicYear)} />
                  </div>
                </section>

                {/* Diagnóstico */}
                <section className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Diagnóstico
                  </h2>
                  <div className="space-y-4">
                    <Field label="Diagnóstico" value={support.diagnosis} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Field label="Fecha de Diagnóstico" value={support.diagnosisDate} />
                      <Field label="Diagnosticado Por" value={support.diagnosedByName || support.diagnosedBy} />
                      <Field label="Tipo de Soporte" value={getSupportTypeLabel(support.supportType)} />
                    </div>
                    <Field label="Descripción" value={support.description ?? 'No disponible'} />
                  </div>
                </section>

                {/* Adaptaciones y Materiales */}
                <section className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Adaptaciones y Materiales
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ListField label="Adaptaciones Requeridas" items={support.adaptationsRequired} />
                    <ListField label="Materiales de Soporte" items={support.supportMaterials} />
                  </div>
                </section>
              </div>

              {/* INFORMACIÓN ADICIONAL */}
              <div className="space-y-6">
                <section className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Información Adicional
                  </h2>
                  <div className="space-y-3">
                    <Field label="Especialista Involucrado" value={support.specialistInvolved ?? 'No especificado'} />
                    <Field label="Fecha de Última Revisión" value={support.lastReviewDate ?? 'No disponible'} />
                    <Field label="Fecha de Próxima Revisión" value={support.nextReviewDate ?? 'No disponible'} />
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Estado</label>
                      <div className="mt-1">{getStatusBadge(support.status)}</div>
                    </div>
                  </div>
                </section>

                <section className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Notas de Progreso</h2>
                  <Field label="" value={support.progressNotes ?? 'No hay notas de progreso'} />
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------ COMPONENTES AUXILIARES ------------------
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-500">{label}</label>}
      <p className="mt-1 text-sm text-gray-900">{value}</p>
    </div>
  );
}

function ListField({ label, items }: { label: string; items?: string[] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500">{label}</label>
      {items && items.length > 0 ? (
        <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-gray-900">No se requiere información</p>
      )}
    </div>
  );
}