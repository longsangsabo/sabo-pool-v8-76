// Mock Base Entity Service - simplified for build compatibility

export interface SoftDeleteOptions {
  table: string;
  adminId?: string;
  deletedOnly?: boolean;
  includeDeleted?: boolean;
  includeHidden?: boolean;
}

export interface QueryBuilderOptions {
  table: string;
  includeDeleted?: boolean;
}

export class BaseEntityService {
  static async create(tableName: string, data: any) {
    return { success: true, data: { id: 'mock-id', ...data } };
  }

  static async update(tableName: string, id: string, data: any) {
    return { success: true, data: { id, ...data } };
  }

  static async delete(tableName: string, id: string) {
    return { success: true };
  }

  static async get(tableName: string, id: string) {
    return { success: true, data: { id, mock: true } };
  }

  static async list(tableName: string, options?: any) {
    return { success: true, data: [] };
  }

  static async softDelete(
    tableName: string,
    entityId: string,
    adminId?: string
  ) {
    return { success: true };
  }

  static async restore(tableName: string, entityId: string, adminId?: string) {
    return { success: true };
  }

  static async getSoftDeleteStats(tableName: string) {
    return { success: true, stats: { total: 0, deleted: 0 } };
  }

  static async getRecentlyDeleted(tableName?: string) {
    return [];
  }

  static async permanentDelete(tableName: string, entityId: string) {
    return { success: true };
  }
}
