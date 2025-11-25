import { type InstitutionWithUsersAndClassroomsResponse } from './Institution.interface';

export interface EditInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  institution: InstitutionWithUsersAndClassroomsResponse;
}
