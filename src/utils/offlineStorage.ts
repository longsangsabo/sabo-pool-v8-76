interface StorageConfig {
  encrypt?: boolean;
  expiration?: number; // milliseconds
  version?: string;
}

interface StorageItem<T = any> {
  data: T;
  timestamp: number;
  expiration?: number;
  version?: string;
  encrypted?: boolean;
}

class OfflineStorageManager {
  private readonly prefix = 'sabo_offline_';
  private readonly encryptionKey = 'sabo_encrypt_key_v1';

  // Simple encryption/decryption for sensitive data
  private encrypt(data: string): string {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // In production, use proper encryption
      return btoa(data);
    }
    return btoa(data);
  }

  private decrypt(encryptedData: string): string {
    try {
      return atob(encryptedData);
    } catch {
      return encryptedData;
    }
  }

  private getStorageKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  // Store data with optional encryption and expiration
  set<T>(key: string, data: T, config: StorageConfig = {}): boolean {
    try {
      const item: StorageItem<T> = {
        data,
        timestamp: Date.now(),
        expiration: config.expiration ? Date.now() + config.expiration : undefined,
        version: config.version,
        encrypted: config.encrypt,
      };

      let serializedData = JSON.stringify(item);
      
      if (config.encrypt) {
        serializedData = this.encrypt(serializedData);
      }

      localStorage.setItem(this.getStorageKey(key), serializedData);
      return true;
    } catch (error) {
      console.error('Failed to store offline data:', error);
      return false;
    }
  }

  // Retrieve data with automatic expiration check
  get<T>(key: string): T | null {
    try {
      const storageKey = this.getStorageKey(key);
      let rawData = localStorage.getItem(storageKey);
      
      if (!rawData) return null;

      // Try to decrypt if needed
      try {
        const decrypted = this.decrypt(rawData);
        if (decrypted !== rawData) {
          rawData = decrypted;
        }
      } catch {
        // Not encrypted or decryption failed
      }

      const item: StorageItem<T> = JSON.parse(rawData);

      // Check expiration
      if (item.expiration && Date.now() > item.expiration) {
        this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Failed to retrieve offline data:', error);
      return null;
    }
  }

  // Remove specific item
  remove(key: string): boolean {
    try {
      localStorage.removeItem(this.getStorageKey(key));
      return true;
    } catch (error) {
      console.error('Failed to remove offline data:', error);
      return false;
    }
  }

  // Clear all offline data
  clear(): boolean {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.prefix)
      );
      
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      return false;
    }
  }

  // Get all keys
  keys(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.replace(this.prefix, ''));
  }

  // Check if data exists and is valid
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Get storage size
  getSize(): number {
    let size = 0;
    this.keys().forEach(key => {
      const data = localStorage.getItem(this.getStorageKey(key));
      if (data) {
        size += data.length;
      }
    });
    return size;
  }

  // Clean expired items
  cleanExpired(): number {
    let cleaned = 0;
    const keys = this.keys();
    
    keys.forEach(key => {
      const data = this.get(key);
      if (data === null) {
        cleaned++;
      }
    });
    
    return cleaned;
  }

  // Get stats
  getStats() {
    const keys = this.keys();
    return {
      totalItems: keys.length,
      totalSize: this.getSize(),
      keys,
    };
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageManager();

// Export types
export type { StorageConfig, StorageItem };
export { OfflineStorageManager };