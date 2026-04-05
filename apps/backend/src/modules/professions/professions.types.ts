export interface ProfessionListFilters {
  page: number;
  pageSize: number;
  campId?: number;
  active?: boolean;
  collectsResources?: boolean;
  search?: string;
}

export interface ProfessionWriteInput {
  pfs_name?: string;
  pfs_description?: string;
  pfs_collects_resources?: boolean;
  pfs_food_generated_per_day?: number;
  pfs_water_generated_per_day?: number;
  id_camp?: number | null;
  pfs_is_active?: boolean;
}

export interface ProfessionSummary {
  id: number;
  name: string;
  description: string;
  collectsResources: boolean;
  foodGeneratedPerDay: number;
  waterGeneratedPerDay: number;
  campId: number | null;
  isActive: boolean;
}
