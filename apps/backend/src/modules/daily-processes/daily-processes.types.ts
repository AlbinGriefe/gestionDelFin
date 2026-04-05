export interface DailyProcessRunInput {
  campId?: number;
}

export interface ProductionCorrectionInput {
  campId?: number;
  personId: number;
  resourceId: number;
  quantityDelta: number;
  reason: string;
}

export interface DailyProcessResult {
  campId: number;
  workingPersonsCount: number;
  totalPersonsCount: number;
  production: {
    food: {
      resourceId: number;
      amountProduced: number;
      newStorageQuantity: number;
    };
    water: {
      resourceId: number;
      amountProduced: number;
      newStorageQuantity: number;
    };
  };
  rations: {
    food: {
      resourceId: number;
      amountConsumed: number;
      newStorageQuantity: number;
      isBelowMinimum: boolean;
    };
    water: {
      resourceId: number;
      amountConsumed: number;
      newStorageQuantity: number;
      isBelowMinimum: boolean;
    };
  };
  ranAt: string;
}
