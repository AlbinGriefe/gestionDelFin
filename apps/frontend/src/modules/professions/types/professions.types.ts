export type ProfessionListFilters = {
    page: number;
    pageSize: number;
    campId?: number;
    active?: boolean;
    collectsResources?: boolean;
    search?: string;
}

export type ProfessionWriteInput = {
    pfs_name?: string;
    pfs_description?: string;
    pfs_collects_resources?: boolean;
    pfs_food_generated_per_day?: number;
    pfs_water_generated_per_day?: number;
    pfs_can_expedition?: boolean;
    pfs_can_transfer?: boolean;
    pfs_production_penalty?: number;
    pfs_valuable_bonus_pp?: number;
    pfs_transfer_bonus_pp?: number;
    pfs_extra_food_chance_pp?: number;
    pfs_extra_food_min?: number;
    pfs_extra_food_max?: number;
    pfs_healing_food_cost?: number;
    pfs_healing_amount?: number;
    id_camp?: number | null;
    pfs_is_active?: boolean;
}

export type ProfessionSummary = {
    id: number;
    name: string;
    description: string;
    collectsResources: boolean;
    foodGeneratedPerDay: number;
    waterGeneratedPerDay: number;
    canExpedition: boolean;
    canTransfer: boolean;
    productionPenalty: number;
    valuableBonusPoints: number;
    transferBonusPoints: number;
    extraFoodChancePoints: number;
    extraFoodMin: number;
    extraFoodMax: number;
    healingFoodCost: number;
    healingAmount: number;
    campId: number | null;
    isActive: boolean;
}


export type ProfessionCoverageEntry = {
    profession: ProfessionSummary;
    totalPersons: number;
    activeWorkers: number;
    outOfCamp: number;
    temporarilyAssigned: number;
    needsCoverage: boolean;
}

export type ProfessionCoverageResult = {
    campId: number;
    campName: string;
    professions: ProfessionCoverageEntry[];
    totalNeedingCoverage: number;
}

export type TemporaryReassignmentInput = {
    targetProfessionId: number;
    personIds: number[];
    notes?: string;
}

export type RevertReassignmentInput = {
    personIds: number[];
    notes?: string;
}

export type ReassignmentResultEntry = {
    personId: number;
    fullName: string;
    previousProfessionId: number;
    previousProfessionName: string;
    newProfessionId: number;
    newProfessionName: string;
    isTemporary: boolean;
}

export type ReassignmentResult = {
    reassigned: ReassignmentResultEntry[];
    skipped: { personId: number; reason: string }[];
    warnings: string[];
}

export type ProfessionList = {
    items: ProfessionSummary[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
    appliedFilters: ProfessionListFilters;
};
