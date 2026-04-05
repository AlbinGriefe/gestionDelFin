import type { person_records_prr_event_type } from "../../generated/prisma/client.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";

export interface PersonListFilters {
  page: number;
  pageSize: number;
  search?: string;
  campId?: number;
  professionId?: number;
  healthId?: number;
  accepted?: boolean;
  active?: boolean;
}

export interface PersonWriteInput {
  id_camp?: number;
  id_profession?: number;
  id_person_health?: number | null;
  prn_name?: string;
  prn_lastname?: string;
  prn_birth_date?: Date | null;
  prn_document_number?: string | null;
  prn_photo_url?: string | null;
  prn_identification_card_url?: string | null;
  prn_is_accepted?: boolean;
  prn_is_active?: boolean;
  prn_admission_notes?: string | null;
}

export interface PersonsCatalogs {
  camps: Array<{
    id: number;
    name: string;
    location: string;
    status: string;
  }>;
  professions: Array<{
    id: number;
    name: string;
    description: string;
    campId: number | null;
    isActive: boolean;
  }>;
  healthStatuses: Array<{
    id: number;
    name: string;
    description: string | null;
    canWork: boolean;
    isTerminal: boolean;
    isActiveStatus: boolean;
  }>;
}

export interface PersonSummary {
  id: number;
  fullName: string;
  camp: {
    id: number;
    name: string;
    status: string;
  };
  profession: {
    id: number;
    name: string;
    description: string;
  };
  healthStatus: {
    id: number;
    name: string;
    canWork: boolean;
    isTerminal: boolean;
  } | null;
  birthDate: string | null;
  documentNumber: string | null;
  photoUrl: string | null;
  identificationCardUrl: string | null;
  isAccepted: boolean;
  isActive: boolean;
  admissionNotes: string | null;
  linkedUsersCount: number;
  historyEntriesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersonDetail extends PersonSummary {
  users: Array<{
    id: number;
    username: string;
    email: string | null;
    isActive: boolean;
    roleId: number;
  }>;
  currentHealthRecord: {
    id: number;
    startDate: string;
    endDate: string | null;
    notes: string | null;
    recordedBy: {
      id: number;
      username: string;
    } | null;
  } | null;
  recentHistory: Array<{
    id: number;
    eventType: person_records_prr_event_type;
    notes: string | null;
    createdAt: string;
    user: {
      id: number;
      username: string;
    } | null;
    oldValue: unknown;
    newValue: unknown;
  }>;
}

export interface PersonAuditEventInput {
  eventType: person_records_prr_event_type;
  notes?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  userId?: number | null;
}

export interface PersonHealthRecordInput {
  id_person_health: number;
  phr_notes?: string | null;
  phr_recorded_by_user_id?: number | null;
}

export interface PersonMutationContext {
  actor: AuthenticatedUser;
  campId: number;
  professionId: number;
  healthId: number | null;
}
