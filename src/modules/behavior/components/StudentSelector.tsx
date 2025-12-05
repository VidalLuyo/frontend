import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, User, X } from 'lucide-react';
import { behaviorService } from '../service/behavior.service';
import type { Student } from '../../student/models/student.model';

interface StudentSelectorProps {
  value: string;
  onChange: (studentId: string, student?: Student) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  excludeStudentIds?: string[]; // IDs de estudiantes a excluir de la lista
}

const StudentSelector: React.FC<StudentSelectorProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "Seleccionar estudiante",
  className = "",
  excludeStudentIds = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cargar estudiantes al montar el componente
  useEffect(() => {
    loadStudents();
  }, []);

  // Filtrar estudiantes cuando cambia el término de búsqueda
  useEffect(() => {
    let filtered = students;
    
    // Excluir los estudiantes especificados
    if (excludeStudentIds && excludeStudentIds.length > 0) {
      filtered = filtered.filter(student => !excludeStudentIds.includes(student.studentId));
    }
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(student => {
        if (!student.personalInfo) return false;
        const names = student.personalInfo.names || '';
        const lastNames = student.personalInfo.lastNames || '';
        const documentNumber = student.personalInfo.documentNumber || '';
        const fullName = `${names} ${lastNames}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return names.toLowerCase().includes(searchLower) ||
               lastNames.toLowerCase().includes(searchLower) ||
               documentNumber.includes(searchTerm) ||
               fullName.includes(searchLower);
      });
    }
    
    setFilteredStudents(filtered);
  }, [searchTerm, students, excludeStudentIds]);

  // Buscar el estudiante seleccionado cuando cambia el valor
  useEffect(() => {
    if (value && students.length > 0) {
      const student = students.find(s => s.studentId === value);
      setSelectedStudent(student || null);
    } else {
      setSelectedStudent(null);
    }
  }, [value, students]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const studentsData = await behaviorService.getAllStudents();
      setStudents(studentsData);
      setFilteredStudents(studentsData);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
        // Enfocar el input de búsqueda cuando se abre
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    onChange(student.studentId, student);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStudent(null);
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Campo de selección */}
      <div
        className={`
          w-full px-3 py-2 border rounded-lg cursor-pointer transition-colors
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${isOpen ? 'ring-2 ring-orange-500 border-transparent' : ''}
          flex items-center justify-between min-h-[42px]
        `}
        onClick={handleToggleDropdown}
      >
        <div className="flex items-center flex-1 min-w-0">
          <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
          {selectedStudent ? (
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {behaviorService.formatStudentName(selectedStudent)}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {selectedStudent.personalInfo?.documentNumber || 'Sin documento'}
              </div>
            </div>
          ) : (
            <span className="text-gray-500 truncate">{placeholder}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedStudent && !disabled && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Campo de búsqueda */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar estudiante..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Lista de estudiantes */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                <span className="ml-2">Cargando estudiantes...</span>
              </div>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <div
                  key={student.studentId || student.personalInfo?.documentNumber || Math.random()}
                  className={`
                    px-3 py-2 cursor-pointer transition-colors hover:bg-orange-50
                    ${selectedStudent?.studentId === student.studentId ? 'bg-orange-100' : ''}
                  `}
                  onClick={() => handleSelectStudent(student)}
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {behaviorService.formatStudentName(student)}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {student.personalInfo?.documentNumber || 'Sin documento'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes disponibles'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default StudentSelector;