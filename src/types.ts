export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'staff';
}

export interface InventoryItem {
  id: string;
  serialNumber: string;
  productType: string;
  weight: number | null;
  photoUrl: string | null;
  capturedBy: string;
  capturedAt: string;
  status: string;
}

export interface OcrResult {
  serialNumber: string | null;
  productType: string;
  weight: number | null;
}

export type ActiveView = 'login' | 'dashboard' | 'scan' | 'confirm' | 'history';
