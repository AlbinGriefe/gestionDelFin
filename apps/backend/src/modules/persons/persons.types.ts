import type {
  person_records_prr_event_type,
  persons_prn_admission_status,
} from "../../generated/prisma/client.js";

export interface PersonListFilters {
  page: number;
  pageSize: number;
  search?: string;
  campId?: number;
  professionId?: number;
  healthId?: number;
  accepted?: boolean;
  admissionStatus?: persons_prn_admission_status;
  active?: boolean;
}

export interface PersonWriteInput {
  id_camp?: number;
  id_person_health?: number | null;
  prn_name?: string;
  prn_lastname?: string;
  prn_birth_date?: Date | null;
  prn_document_number?: string | null;
  prn_profile_description?: string | null;
  prn_is_active?: boolean;
  prn_admission_notes?: string | null;
}

export interface PersonStatsSummary {
  health: number;
  maxHealth: number;
  strength: number;
  satiety: number;
  hydration: number;
  luck: number;
  level: number;
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
  identifier: string;
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
  } | null;
  healthStatus: {
    id: number;
    name: string;
    canWork: boolean;
    isTerminal: boolean;
  } | null;
  stats: PersonStatsSummary | null;
  profileDescription: string;
  profileTemplateId: number | null;
  admissionStatus: persons_prn_admission_status;
  isAccepted: boolean;
  birthDate: string | null;
  documentNumber: string | null;
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
