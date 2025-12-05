import { X, Calendar, Clock, User, MapPin, AlertTriangle, FileText, Eye, CheckCircle, XCircle, Info } from 'lucide-react';
import type { ViewIncidentModalProps, IncidentStatus, SeverityLevel } from '../models/incident.interface';

// Utility functions for date/time array conversion
const formatIncidentDate = (date: string | number[]): string => {
  const formatToCustomDate = (dateObj: Date): string => {
    const day = dateObj.getDate();
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                   'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  if (Array.isArray(date)) {
    // Convert [year, month, day] to readable date format
    const [year, month, day] = date;
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed in JS Date
    return formatToCustomDate(dateObj);
  }
  return formatToCustomDate(new Date(date));
};

const formatIncidentTime = (time: string | number[]): string => {
  if (Array.isArray(time)) {
    // Convert [hour, minute] to HH:MM format
    const [hour, minute] = time;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  return time;
};

const formatReportedAt = (reportedAt: string | number[]): string => {
  const formatToCustomDateTime = (date: Date): string => {
    const day = date.getDate();
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                   'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };
  
  if (Array.isArray(reportedAt)) {
    // Convert [year, month, day, hour, minute, second, nanoseconds] to Date
    const [year, month, day, hour, minute, second] = reportedAt;
    const date = new Date(year, month - 1, day, hour, minute, second); // month is 0-indexed in JS Date
    return formatToCustomDateTime(date);
  }
  return formatToCustomDateTime(new Date(reportedAt));
};

const ViewIncidentModal: React.FC<ViewIncidentModalProps> = ({
  isOpen,
  onClose,
  incident
}) => {
  if (!isOpen || !incident) return null;

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'LEVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MODERADO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'GRAVE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';

      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: IncidentStatus) => {
    switch (status) {
      case 'OPEN':
        return 'Abierto';

      case 'RESOLVED':
        return 'Resuelto';
      case 'CLOSED':
        return 'Cerrado';
      default:
        return status;
    }
  };

  const getSeverityLabel = (severity: SeverityLevel) => {
    switch (severity) {
      case 'LEVE':
        return 'Leve';
      case 'MODERADO':
        return 'Moderado';
      case 'GRAVE':
        return 'Grave';
      default:
        return severity;
    }
  };

  const getIncidentTypeLabel = (type: string) => {
    switch (type) {
      case 'ACCIDENTE':
        return 'Accidente';
      case 'CONFLICTO':
        return 'Conflicto';
      case 'COMPORTAMIENTO':
        return 'Comportamiento';
      case 'EMOCIONAL':
        return 'Emocional';
      case 'SALUD':
        return 'Salud';
      default:
        return type;
    }
  };

  const getStatusIcon = (status: IncidentStatus) => {
    switch (status) {
      case 'OPEN':
        return <Clock className="h-4 w-4" />;

      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CLOSED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detalles del Incidente</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Priority Indicators */}
          <div className="flex flex-wrap gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(incident.status)}`}>
              {getStatusIcon(incident.status)}
              {getStatusLabel(incident.status)}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getSeverityColor(incident.severityLevel)}`}>
              <AlertTriangle className="h-4 w-4" />
              {getSeverityLabel(incident.severityLevel)}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-200 text-sm font-medium">
              {getIncidentTypeLabel(incident.incidentType)}
            </div>
          </div>

          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Date and Time */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Fecha y Hora</h3>
              </div>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Fecha:</span> {formatIncidentDate(incident.incidentDate)}</p>
                <p className="text-sm"><span className="font-medium">Hora:</span> {incident.incidentTime ? formatIncidentTime(incident.incidentTime) : 'N/A'}</p>
                <p className="text-sm"><span className="font-medium">Año académico:</span> {incident.academicYear}</p>
              </div>
            </div>

            {/* Student Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Estudiante</h3>
              </div>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Nombre:</span> {incident.studentName || 'N/A'}</p>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Ubicación</h3>
              </div>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Lugar:</span> {incident.location}</p>
                <p className="text-sm"><span className="font-medium">Aula:</span> {incident.classroomName || incident.classroomId}</p>
                <p className="text-sm"><span className="font-medium">Institución:</span> {incident.institutionName || incident.institutionId}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Descripción del Incidente</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{incident.description}</p>
          </div>

          {/* Witnesses and Involved Students */}
          {(incident.witnesses || (incident.otherStudentsInvolved && incident.otherStudentsInvolved.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Witnesses */}
              {incident.witnesses && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Testigos</h3>
                  <p className="text-sm text-gray-700">{incident.witnesses}</p>
                </div>
              )}

              {/* Other Students Involved */}
              {incident.otherStudentsInvolved && incident.otherStudentsInvolved.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Otros Estudiantes Involucrados</h3>
                  <div className="space-y-1">
                    {incident.otherStudentsInvolved.map((studentId, index) => (
                      <div key={index} className="text-sm text-gray-700">
                        • {incident.otherStudentsNames?.[index] || 'Estudiante involucrado'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Immediate Action */}
          {incident.immediateAction && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Acción Inmediata Tomada</h3>
              <p className="text-sm text-gray-700">{incident.immediateAction}</p>
            </div>
          )}

          {/* Reporting Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Información del Reporte</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm"><span className="font-medium">Reportado por:</span> {incident.reportedByName || incident.reportedBy}</p>
                <p className="text-sm"><span className="font-medium">Fecha de reporte:</span> {formatReportedAt(incident.reportedAt)}</p>
              </div>
              {incident.resolvedBy && (
                <div>
                  <p className="text-sm"><span className="font-medium">Resuelto por:</span> {incident.resolvedByName || incident.resolvedBy}</p>
                  {incident.resolvedAt && (
                    <p className="text-sm"><span className="font-medium">Fecha de resolución:</span> {(() => {
                      const formatToCustomDateTime = (date: Date): string => {
                        const day = date.getDate();
                        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                        const month = months[date.getMonth()];
                        const year = date.getFullYear();
                        const hours = date.getHours().toString().padStart(2, '0');
                        const minutes = date.getMinutes().toString().padStart(2, '0');
                        return `${day}-${month}-${year} ${hours}:${minutes}`;
                      };
                      
                      if (Array.isArray(incident.resolvedAt)) {
                        const [year, month, day, hour, minute, second] = incident.resolvedAt;
                        const date = new Date(year, month - 1, day, hour, minute, second);
                        return formatToCustomDateTime(date);
                      } else {
                        const date = new Date(incident.resolvedAt);
                        return formatToCustomDateTime(date);
                      }
                    })()}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Follow-up Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Seguimiento</h3>
            <div className="flex items-center gap-2">
              {incident.followUpRequired ? (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <span className="text-sm">
                {incident.followUpRequired ? 'Requiere seguimiento' : 'No requiere seguimiento'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewIncidentModal;