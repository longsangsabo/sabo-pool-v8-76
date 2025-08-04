export interface PoolTable {
  id: string;
  club_id: string;
  table_number: number;
  type: string;
  size: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  hourly_rate: number;
  current_session_id?: string;
  last_maintenance?: string;
  maintenance_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TableSession {
  id: string;
  table_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  cost?: number;
  status: 'active' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TableReservation {
  id: string;
  table_id: string;
  user_id: string;
  reserved_for: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}
