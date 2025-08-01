// Simplified soft delete utilities
export interface SoftDeleteOptions {
  table: string;
  includeDeleted?: boolean;
  includeHidden?: boolean;
  deletedOnly?: boolean;
}

export const SoftDeleteUtils = {
  getSoftDeleteFilter: (options: SoftDeleteOptions) => ({
    table: options.table,
  }),
  applySoftDeleteFilter: () => true,
};

export const getSoftDeleteFilter = (options: SoftDeleteOptions) => {
  return { table: options.table };
};

export const applySoftDeleteFilter = () => {
  return true;
};
