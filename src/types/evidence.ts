export interface EvidenceRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  sha256Hash: string;
  caseId: string;
  capturedAt: string;
  geoLocation: { lat: number; lng: number } | null;
  deviceInfo: string;
  status: 'scanning' | 'cleared' | 'rejected' | 'quarantined';
  notaryHash: string;
  blockIndex: number;
  custodyLog: CustodyEntry[];
}

export interface CustodyEntry {
  id: string;
  timestamp: string;
  action: 'uploaded' | 'viewed' | 'downloaded' | 'transferred' | 'verified';
  actor: string;
  ipAddress: string;
  details: string;
}

export interface CaseRecord {
  id: string;
  name: string;
  createdAt: string;
  status: 'active' | 'closed' | 'archived';
  evidenceCount: number;
  assignedTo: string;
  accessExpiry: string;
}

export interface DeviceHealth {
  encryptionEnabled: boolean;
  osUpToDate: boolean;
  firewallActive: boolean;
  antivirusRunning: boolean;
  locationServicesOn: boolean;
  secureConnection: boolean;
  score: number;
}

export interface BlockchainEntry {
  index: number;
  timestamp: string;
  evidenceHash: string;
  previousHash: string;
  nonce: number;
  hash: string;
}
