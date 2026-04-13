import { ShieldCheck, ShieldAlert, Wifi, HardDrive, Monitor, MapPin, Lock, Cpu } from 'lucide-react';
import type { DeviceHealth } from '@/types/evidence';
import { useEffect, useState } from 'react';

/**
 * Shows device security health status for attestation.
 */
const DeviceAttestation = () => {
  const [health, setHealth] = useState<DeviceHealth | null>(null);

  useEffect(() => {
    // Mock device attestation checks
    const timer = setTimeout(() => {
      setHealth({
        encryptionEnabled: true,
        osUpToDate: Math.random() > 0.2,
        firewallActive: true,
        antivirusRunning: Math.random() > 0.3,
        locationServicesOn: !!navigator.geolocation,
        secureConnection: location.protocol === 'https:' || location.hostname === 'localhost',
        score: 0,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!health) {
    return (
      <div className="glass-panel rounded-xl p-5">
        <p className="text-sm text-muted-foreground">Running device attestation...</p>
      </div>
    );
  }

  const checks = [
    { label: 'Disk Encryption', ok: health.encryptionEnabled, icon: HardDrive },
    { label: 'OS Up to Date', ok: health.osUpToDate, icon: Monitor },
    { label: 'Firewall Active', ok: health.firewallActive, icon: Lock },
    { label: 'Antivirus Running', ok: health.antivirusRunning, icon: Cpu },
    { label: 'Location Services', ok: health.locationServicesOn, icon: MapPin },
    { label: 'Secure Connection', ok: health.secureConnection, icon: Wifi },
  ];

  const score = Math.round((checks.filter(c => c.ok).length / checks.length) * 100);

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {score >= 80 ? (
            <ShieldCheck className="w-5 h-5 text-success" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-warning" />
          )}
          <h2 className="text-lg font-semibold text-foreground">Device Health</h2>
        </div>
        <span className={`text-2xl font-bold ${score >= 80 ? 'text-success' : 'text-warning'}`}>
          {score}%
        </span>
      </div>
      <div className="space-y-2">
        {checks.map(check => (
          <div key={check.label} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <check.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{check.label}</span>
            </div>
            <span className={`text-xs font-medium ${check.ok ? 'text-success' : 'text-destructive'}`}>
              {check.ok ? 'PASS' : 'FAIL'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceAttestation;
