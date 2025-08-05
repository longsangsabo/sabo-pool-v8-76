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
    console.log('Mock create entity:', tableName, data);
    return { success: true, data: { id: 'mock-id', ...data } };
  }

  static async update(tableName: string, id: string, data: any) {
    console.log('Mock update entity:', tableName, id, data);
    return { success: true, data: { id, ...data } };
  }

  static async delete(tableName: string, id: string) {
    console.log('Mock delete entity:', tableName, id);
    return { success: true };
  }

  static async get(tableName: string, id: string) {
    console.log('Mock get entity:', tableName, id);
    return { success: true, data: { id, mock: true } };
  }

  static async list(tableName: string, options?: any) {
    console.log('Mock list entities:', tableName, options);
    return { success: true, data: [] };
  }

  static async softDelete(
    tableName: string,
    entityId: string,
    adminId?: string
  ) {
    console.log('Mock soft delete entity:', tableName, entityId, adminId);
    return { success: true };
  }

  static async restore(tableName: string, entityId: string, adminId?: string) {
    console.log('Mock restore entity:', tableName, entityId, adminId);
    return { success: true };
  }

  static async getSoftDeleteStats(tableName: string) {
    console.log('Mock get soft delete stats:', tableName);
    return { success: true, stats: { total: 0, deleted: 0 } };
  }

  static async getRecentlyDeleted(tableName?: string) {
    console.log('Mock get recently deleted:', tableName);
    return [];
  }

  static async permanentDelete(tableName: string, entityId: string) {
    console.log('Mock permanent delete:', tableName, entityId);
    return { success: true };
  }
}
