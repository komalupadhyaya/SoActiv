// biometric/biometric.constants.ts

export const BIOMETRIC_CONSTANTS = {
  // Default duplicate suppression time window in seconds
  DEFAULT_DUPLICATE_WINDOW_SECONDS: 30,

  // Event Types
  EVENT_TYPES: {
    CHECK_IN: 'CHECK_IN',
    CHECK_OUT: 'CHECK_OUT',
    ACCESS: 'ACCESS',
    UNKNOWN: 'UNKNOWN',
  } as const,

  // Verification Types
  VERIFICATION_TYPES: {
    FINGERPRINT: 'FINGERPRINT',
    FACE: 'FACE',
    RFID: 'RFID',
    CARD: 'CARD',
    PIN: 'PIN',
    UNKNOWN: 'UNKNOWN',
  } as const,

  // Device Statuses
  DEVICE_STATUS: {
    ONLINE: 'ONLINE',
    OFFLINE: 'OFFLINE',
    DISABLED: 'DISABLED',
    UNKNOWN: 'UNKNOWN',
  } as const,

  // Default Timezone for attendance calculation
  TIMEZONE: 'Asia/Kolkata',
};
