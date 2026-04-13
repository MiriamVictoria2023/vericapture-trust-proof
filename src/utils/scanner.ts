/**
 * Mock malware scanner that simulates security checks on uploaded files.
 * Checks file signatures, size limits, and known bad patterns.
 */

const SUSPICIOUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.ps1', '.vbs', '.scr'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface ScanResult {
  status: 'cleared' | 'rejected' | 'quarantined';
  threats: string[];
  scanDuration: number;
  checksPerformed: string[];
}

export async function scanFile(file: File): Promise<ScanResult> {
  const startTime = Date.now();
  const threats: string[] = [];
  const checksPerformed = [
    'File signature analysis',
    'Known malware hash database',
    'Macro detection scan',
    'Embedded payload check',
    'File entropy analysis',
    'Metadata integrity check',
  ];

  // Simulate scan delay (1.5 - 3 seconds)
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));

  // Check file extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (SUSPICIOUS_EXTENSIONS.includes(ext)) {
    threats.push(`Suspicious file extension: ${ext}`);
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    threats.push('File exceeds maximum allowed size (100MB)');
  }

  // Mock 5% random threat detection for demo
  if (Math.random() < 0.05) {
    threats.push('Potential embedded macro detected');
  }

  const scanDuration = Date.now() - startTime;

  return {
    status: threats.length === 0 ? 'cleared' : threats.length > 1 ? 'rejected' : 'quarantined',
    threats,
    scanDuration,
    checksPerformed,
  };
}
