import type {
  transfers_tfs_state,
  transfers_tfs_type,
} from "../../generated/prisma/client.js";

export interface TransferListFilters {
  page: number;
  pageSize: number;
  campId?: number;
  state?: transfers_tfs_state;
  type?: transfers_tfs_type;
  search?: string;
}

export interface TransferCatalogFilters {
  originCampId?: number;
}

export interface TransferPersonItemInput {
  id_person: number;
  assignedRations?: number;
  notes?: string | null;
}

export interface TransferResourceItemInput {
  id_resource: number;
  quantity: number;
  notes?: string | null;
}

export interface TransferCreateInput {
  id_origin_camp?: number;
  id_destiny_camp: number;
  tfs_type: transfers_tfs_type;
  tfs_comments?: string | null;
  persons?: TransferPersonItemInput[];
  resources?: TransferResourceItemInput[];
}

export interface TransferStateUpdateInput {
  nextState: transfers_tfs_state;
  comments?: string | null;
}

export interface TransferMissionOutcome {
  requestedState: "delivered";
  resolvedState: "delivered" | "failed";
  probability: number;
  roll: number;
  baseProbability: number;
  luckBonusPoints: number;
  professionBonusPoints: number;
  failureEventType?: "zombie_attack" | "traveler_loss";
}

export interface TransferCatalogs {
  camps: Array<{
    id: number;
    name: string;
    status: string;
  }>;
  persons: Array<{
    id: number;
    fullName: string;
    documentNumber: string | null;
    campId: number;
  }>;
  resources: Array<{
    id: number;
    name: string;
    unit: string;
    availableQuantity: number;
    campId: number;
    typeId: number;
    typeName: string;
  }>;
}

export interface TransferSummary {
  id: number;
  type: transfers_tfs_type;
  state: transfers_tfs_state;
  comments: string | null;
  requestedDate: string;
  acceptedRequestDate: string | null;
  shipmentDate: string | null;
  arrivalDate: string | null;
  returnDate: string | null;
  originCamp: {
    id: number;
    name: string;
  };
  destinyCamp: {
    id: number;
    name: string;
  };
  requestedBy: {
    id: number;
    username: string;
  };
  counts: {
    persons: number;
    resources: number;
  };
}

export interface TransferDetail extends TransferSummary {
  acceptedBy: {
    id: number;
    username: string;
  } | null;
  approvedOriginBy: {
    id: number;
    username: string;
  } | null;
  approvedDestinyBy: {
    id: number;
    username: string;
  } | null;
  persons: Array<{
    id: number;
    personId: number;
    fullName: string;
    assignedRations: number;
    departureConfirmed: boolean;
    arrivalConfirmed: boolean;
    returnedToOrigin: boolean;
    notes: string | null;
  }>;
  resources: Array<{
    id: number;
    resourceId: number;
    name: string;
    unit: string;
    quantity: number;
    confirmedLeaving: boolean;
    confirmedArriving: boolean;
    notes: string | null;
  }>;
  recentEvents: Array<{
    id: number;
    action: string;
    description: string | null;
    createdAt: string;
    actorUserId: number | null;
    oldValue: unknown;
    newValue: unknown;
  }>;
}

export interface TransferAuditEventInput {
  action: string;
  description?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  actorUserId?: number | null;
}
