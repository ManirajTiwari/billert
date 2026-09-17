export type UnitType = "BOX" | "STRIP" | "TABLET";

export interface MedicineStockInfo {
  noOfBoxes: number;
  stripsPerBox: number;
  tabletsPerBox: number;
}

export interface StockCalculationResult {
  hasEnoughStock: boolean;
  totalStockInTablets: number;
  requestedInTablets: number;
  remainingTablets: number;
  remainingBreakdown: {
    boxes: number;
    strips: number;
    tablets: number;
  };
}

export interface SoldItemPayload {
  medicineId: string;
  quantity: number;
  unitType: UnitType;
}

/**
 * Converts any quantity unit (BOX, STRIP, TABLET) to total loose tablets
 */
export function convertToTablets(
  quantity: number,
  unitType: UnitType,
  stripsPerBox: number,
  tabletsPerBox: number
): number {
  const tabletsPerStrip =
    stripsPerBox > 0 ? Math.floor(tabletsPerBox / stripsPerBox) : 0;

  switch (unitType.toUpperCase()) {
    case "BOX":
      return quantity * tabletsPerBox;
    case "STRIP":
      return quantity * tabletsPerStrip;
    case "TABLET":
      return quantity;
    default:
      return quantity;
  }
}

/**
 * Calculates total available stock in loose tablets
 */
export function getTotalStockInTablets(medicine: MedicineStockInfo): number {
  return (medicine.noOfBoxes || 0) * (medicine.tabletsPerBox || 0);
}

/**
 * Converts total loose tablets back into Boxes, Strips, and Loose Tablets
 */
export function formatTabletsToUnits(
  totalTablets: number,
  stripsPerBox: number,
  tabletsPerBox: number
) {
  const safeTabletsPerBox = tabletsPerBox > 0 ? tabletsPerBox : 1;
  const tabletsPerStrip =
    stripsPerBox > 0 ? Math.floor(tabletsPerBox / stripsPerBox) : 1;

  const boxes = Math.floor(totalTablets / safeTabletsPerBox);
  const remainingAfterBoxes = totalTablets % safeTabletsPerBox;

  const strips = Math.floor(remainingAfterBoxes / tabletsPerStrip);
  const looseTablets = remainingAfterBoxes % tabletsPerStrip;

  return {
    boxes,
    strips,
    tablets: looseTablets,
  };
}

/**
 * Main function: Calculates inventory deduction for a single medicine sale
 */
export function calculateMedicineStock(
  medicine: MedicineStockInfo,
  soldQuantity: number,
  unitType: UnitType
): StockCalculationResult {
  const { stripsPerBox, tabletsPerBox } = medicine;

  // 1. Calculate current total stock in loose tablets
  const totalStockInTablets = getTotalStockInTablets(medicine);

  // 2. Convert sold quantity into tablets
  const requestedInTablets = convertToTablets(
    soldQuantity,
    unitType,
    stripsPerBox,
    tabletsPerBox
  );

  // 3. Check stock availability
  const hasEnoughStock = totalStockInTablets >= requestedInTablets;
  const remainingTablets = Math.max(0, totalStockInTablets - requestedInTablets);

  // 4. Breakdown remaining tablets back to Boxes, Strips, and Loose Tablets
  const remainingBreakdown = formatTabletsToUnits(
    remainingTablets,
    stripsPerBox,
    tabletsPerBox
  );

  return {
    hasEnoughStock,
    totalStockInTablets,
    requestedInTablets,
    remainingTablets,
    remainingBreakdown,
  };
}

/**
 * Optional Helper: Batch calculation for multiple bill items at once
 */
export function calculateBatchItemsStock(
  medicines: Array<MedicineStockInfo & { id: string }>,
  soldItems: SoldItemPayload[]
) {
  return soldItems.map((item) => {
    const medicine = medicines.find((m) => m.id === item.medicineId);

    if (!medicine) {
      return {
        medicineId: item.medicineId,
        hasEnoughStock: false,
        error: "Medicine not found",
      };
    }

    const result = calculateMedicineStock(
      medicine,
      item.quantity,
      item.unitType
    );

    return {
      medicineId: item.medicineId,
      ...result,
    };
  });
}