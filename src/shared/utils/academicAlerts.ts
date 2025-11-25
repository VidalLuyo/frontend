import Swal from 'sweetalert2';

export const showSuccessAlert = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
  });
};

export const showErrorAlert = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#ef4444',
  });
};

export const showLoadingAlert = (title: string = 'Cargando...') => {
  return Swal.fire({
    title,
    allowEscapeKey: false,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const closeAlert = () => {
  Swal.close();
};

export const showDeleteConfirm = (itemName?: string) => {
  return Swal.fire({
    icon: 'warning',
    title: '¿Estás segura?',
    text: itemName
      ? `Esta acción eliminará "${itemName}". Esta acción se puede revertir.`
      : 'Esta acción eliminará el elemento. Esta acción se puede revertir.',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
  });
};

export const showRestoreConfirm = (itemName?: string) => {
  return Swal.fire({
    icon: 'info',
    title: '¿Restaurar elemento?',
    text: itemName
      ? `Esta acción restaurará "${itemName}".`
      : 'Esta acción restaurará el elemento.',
    showCancelButton: true,
    confirmButtonText: 'Sí, restaurar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
  });
};

export const showConfirmDialog = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
  });
};
