import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, User as UserIcon, X } from 'lucide-react';
import { behaviorService, type BehaviorUserRole } from '../service/behavior.service';
import type { User } from '../../users/models/users.model';

interface UserSelectorProps {
  value: string;
  onChange: (userId: string, user?: User) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  allowedRoles?: BehaviorUserRole[]; // Roles permitidos para filtrar
}

const UserSelector: React.FC<UserSelectorProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "Seleccionar usuario",
  className = "",
  allowedRoles = ['PROFESOR', 'AUXILIAR', 'DIRECTOR']
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, [allowedRoles]);

  // Filtrar usuarios cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = users.filter(user => 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.documentNumber.includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        behaviorService.getRoleDisplayName(user.role as BehaviorUserRole).toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  // Buscar el usuario seleccionado cuando cambia el valor
  useEffect(() => {
    if (value && users.length > 0) {
      const user = users.find(u => u.userId === value);
      setSelectedUser(user || null);
    } else {
      setSelectedUser(null);
    }
  }, [value, users]);

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

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersData = await behaviorService.getUsersByRoles(allowedRoles || []);
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
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

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    onChange(user.userId, user);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUser(null);
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
          <UserIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
          {selectedUser ? (
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {behaviorService.formatUserName(selectedUser)}
              </div>
              <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                <span>{selectedUser.documentNumber}</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: behaviorService.getRoleColor(selectedUser.role as BehaviorUserRole) }}
                >
                  {behaviorService.getRoleDisplayName(selectedUser.role as BehaviorUserRole)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-gray-500 truncate">{placeholder}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedUser && !disabled && (
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
                placeholder="Buscar usuario..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Lista de usuarios */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                <span className="ml-2">Cargando usuarios...</span>
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.userId || user.documentNumber || Math.random()}
                  className={`
                    px-3 py-2 cursor-pointer transition-colors hover:bg-orange-50
                    ${selectedUser?.userId === user.userId ? 'bg-orange-100' : ''}
                  `}
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {behaviorService.formatUserName(user)}
                      </div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                        <span>{user.documentNumber}</span>
                        <span>{user.email}</span>
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: behaviorService.getRoleColor(user.role as BehaviorUserRole) }}
                        >
                          {behaviorService.getRoleDisplayName(user.role as BehaviorUserRole)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
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

export default UserSelector;