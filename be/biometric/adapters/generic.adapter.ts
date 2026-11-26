// biometric/adapters/generic.adapter.ts

import type {
  BiometricAdapter,
  NormalizedBiometricEvent,
  BiometricEventType,
  BiometricVerificationType,
} from '../biometric.types';

/**
 * Generic Biometric Adapter
 * Normalizes standard JSON event payloads into NormalizedBiometricEvent.
 */
export class GenericBiometricAdapter implements BiometricAdapter {
  public readonly adapterName = 'GENERIC_ADAPTER';

  public normalizeEvent(rawEvent: any): NormalizedBiometricEvent {
    if (!rawEvent || typeof rawEvent !== 'object') {
      throw new Error('Invalid raw event payload: payload must be an object');
    }

    // Extract device identifier
    const deviceId = rawEvent.deviceId ? String(rawEvent.deviceId).trim() : undefined;
    const deviceSerialNumber = rawEvent.deviceSerialNumber || rawEvent.serialNumber || rawEvent.sn
      ? String(rawEvent.deviceSerialNumber || rawEvent.serialNumber || rawEvent.sn).trim().toUpperCase()
      : undefined;

    // Extract biometric user ID
    const rawUserId = rawEvent.biometricUserId ?? rawEvent.userId ?? rawEvent.uid ?? rawEvent.enrollId ?? rawEvent.pin;
    if (rawUserId === undefined || rawUserId === null || String(rawUserId).trim() === '') {
      throw new Error('Invalid biometric event: missing biometric user ID');
    }
    const biometricUserId = String(rawUserId).trim();

    // Normalize event type
    let eventType: BiometricEventType = 'CHECK_IN';
    const rawType = String(rawEvent.eventType || rawEvent.type || rawEvent.action || '').toUpperCase();
    if (rawType.includes('OUT') || rawType === 'CHECK_OUT' || rawType === 'EXIT') {
      eventType = 'CHECK_OUT';
    } else if (rawType.includes('ACCESS') || rawType === 'ENTRY') {
      eventType = 'ACCESS';
    } else if (rawType.includes('IN') || rawType === 'CHECK_IN') {
      eventType = 'CHECK_IN';
    } else if (rawEvent.eventType) {
      eventType = 'UNKNOWN';
    }

    // Normalize verification type
    let verificationType: BiometricVerificationType = 'UNKNOWN';
    const rawVerify = String(rawEvent.verificationType || rawEvent.verifyMode || rawEvent.mode || '').toUpperCase();
    if (rawVerify.includes('FINGER') || rawVerify === 'FP' || rawVerify === '1') {
      verificationType = 'FINGERPRINT';
    } else if (rawVerify.includes('FACE') || rawVerify === '15') {
      verificationType = 'FACE';
    } else if (rawVerify.includes('RFID') || rawVerify.includes('CARD') || rawVerify === '2') {
      verificationType = 'RFID';
    } else if (rawVerify.includes('PIN') || rawVerify.includes('PASS') || rawVerify === '0') {
      verificationType = 'PIN';
    }

    // Normalize event time
    let eventTime = new Date();
    if (rawEvent.eventTime || rawEvent.time || rawEvent.timestamp) {
      const parsed = new Date(rawEvent.eventTime || rawEvent.time || rawEvent.timestamp);
      if (!isNaN(parsed.getTime())) {
        eventTime = parsed;
      }
    }

    // Transaction ID for idempotency
    const transactionId = rawEvent.transactionId || rawEvent.logId || rawEvent.recordId
      ? String(rawEvent.transactionId || rawEvent.logId || rawEvent.recordId).trim()
      : null;

    return {
      deviceId,
      deviceSerialNumber,
      biometricUserId,
      eventType,
      verificationType,
      eventTime,
      transactionId,
      rawData: rawEvent,
    };
  }
}

export const genericBiometricAdapter = new GenericBiometricAdapter();
