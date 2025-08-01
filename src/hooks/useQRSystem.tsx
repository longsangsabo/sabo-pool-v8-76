import { useState } from 'react';
import {
  QRCode,
  QRScanHistory,
  TableQRCode,
  QuickMatch,
  CreateQuickMatchRequest,
} from '../types/qr';

export const useQRSystem = () => {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [scanHistory, setScanHistory] = useState<QRScanHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchQRCodes = async () => {
    setLoading(true);
    try {
      // Mock implementation
      setQrCodes([]);
    } catch (err) {
      setError('Failed to fetch QR codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchScanHistory = async () => {
    setLoading(true);
    try {
      // Mock implementation
      setScanHistory([]);
    } catch (err) {
      setError('Failed to fetch scan history');
    } finally {
      setLoading(false);
    }
  };

  const createQRCode = async (qrData: any) => {
    setLoading(true);
    try {
      const newQR: QRCode = {
        id: Date.now().toString(),
        type: qrData.type,
        data: qrData.data,
        created_at: new Date().toISOString(),
        is_active: true,
        scan_count: 0,
      };
      setQrCodes(prev => [...prev, newQR]);
      return newQR;
    } catch (err) {
      setError('Failed to create QR code');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQRCode = async (id: string, data: any) => {
    try {
      setQrCodes(prev =>
        prev.map(qr => (qr.id === id ? { ...qr, ...data } : qr))
      );
    } catch (err) {
      setError('Failed to update QR code');
    }
  };

  const scanQRCode = async (qrCode: string) => {
    setLoading(true);
    try {
      // Mock implementation
      const scanRecord: QRScanHistory = {
        id: Date.now().toString(),
        qr_code_id: qrCode,
        scanned_by: 'current_user',
        scanned_at: new Date().toISOString(),
        scan_data: { result: 'success' },
      };
      setScanHistory(prev => [...prev, scanRecord]);
      return scanRecord;
    } catch (err) {
      setError('Failed to scan QR code');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const scanTableQR = async (qrCode: string): Promise<TableQRCode | null> => {
    setLoading(true);
    try {
      // Mock table QR scan
      const mockTable: TableQRCode = {
        id: '1',
        club_id: 'club1',
        table_number: 1,
        qr_code: qrCode,
        table_name: 'Bàn 1',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        club: {
          id: 'club1',
          name: 'CLB Test',
          address: '123 Test Street',
          description: 'Test Club',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
      return mockTable;
    } catch (err) {
      setError('Failed to scan table QR');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const scanPlayerQR = async (
    qrCode: string
  ): Promise<{ user_id: string } | null> => {
    setLoading(true);
    try {
      // Mock player QR scan
      return { user_id: 'player1' };
    } catch (err) {
      setError('Failed to scan player QR');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createQuickMatch = async (
    request: CreateQuickMatchRequest
  ): Promise<QuickMatch | null> => {
    setLoading(true);
    try {
      // Mock quick match creation
      const mockMatch: QuickMatch = {
        id: Date.now().toString(),
        table_id: request.table_id || '',
        player1_id: request.player1_id,
        player2_id: request.player2_id,
        game_type: '8_ball',
        bet_points: request.bet_amount || 0,
        status: 'pending',
        player1_score: 0,
        player2_score: 0,
        player1_confirmed: false,
        player2_confirmed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mockMatch;
    } catch (err) {
      setError('Failed to create quick match');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (
    type: 'player' | 'table',
    data: string
  ): Promise<QRCode | null> => {
    try {
      const mockQR: QRCode = {
        id: Date.now().toString(),
        type,
        data,
        created_at: new Date().toISOString(),
        is_active: true,
        scan_count: 0,
      };
      return mockQR;
    } catch (err) {
      setError('Failed to generate QR code');
      return null;
    }
  };

  const deleteQRCode = async (id: string): Promise<void> => {
    try {
      setQrCodes(prev => prev.filter(qr => qr.id !== id));
    } catch (err) {
      setError('Failed to delete QR code');
    }
  };

  const updateQRCodeStatus = async (
    id: string,
    isActive: boolean
  ): Promise<void> => {
    try {
      setQrCodes(prev =>
        prev.map(qr => (qr.id === id ? { ...qr, is_active: isActive } : qr))
      );
    } catch (err) {
      setError('Failed to update QR code status');
    }
  };

  const getQRCodesByType = (type: 'player' | 'table') => {
    return qrCodes.filter(qr => qr.type === type);
  };

  const getActiveScanHistory = () => {
    return scanHistory.filter(scan => {
      const scanDate = new Date(scan.scanned_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - scanDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24; // Last 24 hours
    });
  };

  const generateQRImageUrl = (data: string, size: number = 200): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
  };

  return {
    qrCodes,
    scanHistory,
    loading,
    error,
    fetchQRCodes,
    fetchScanHistory,
    createQRCode,
    updateQRCode,
    scanQRCode,
    scanTableQR,
    scanPlayerQR,
    createQuickMatch,
    generateQRCode,
    deleteQRCode,
    updateQRCodeStatus,
    getQRCodesByType,
    getActiveScanHistory,
    generateQRImageUrl,
  };
};
