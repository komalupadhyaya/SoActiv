// biometric/adapters/zkteco.adapter.ts

import type {
  BiometricAdapter,
  NormalizedBiometricEvent,
  BiometricEventType,
  BiometricVerificationType,
} from '../biometric.types';

/**
 * ZKTeco Biometric Adapter [PLACEHOLDER]
 *
 * NOTE: This is a placeholder for future ZKTeco push / BioTime protocol integration.
 * It contains NO vendor SDK or device protocol dependencies.
 */
export class ZktecoBiometricAdapter implements BiometricAdapter {
  public readonly adapterName = 'ZKTECO_ADAPTER';

  public normalizeEvent(rawZkPayload: any): NormalizedBiometricEvent {
    if (!rawZkPayload) {
      throw new Error('Invalid ZKTeco event payload');
    }

    const deviceSerialNumber = rawZkPayload.device_sn || rawZkPayload.SN;
    const biometricUserId = String(rawZkPayload.user_id || rawZkPayload.pin || rawZkPayload.card_no || '');

    let eventType: BiometricEventType = 'CHECK_IN';
    if (rawZkPayload.punch_state === 1 || rawZkPayload.punch_state === '1') {
      eventType = 'CHECK_OUT';
    }

    let verificationType: BiometricVerificationType = 'FINGERPRINT';
    if (rawZkPayload.verify_type === 15 || rawZkPayload.verify_type === '15') {
      verificationType = 'FACE';
    } else if (rawZkPayload.verify_type === 2 || rawZkPayload.verify_type === '2') {
      verificationType = 'RFID';
    }

    const eventTime = rawZkPayload.punch_time ? new Date(rawZkPayload.punch_time) : new Date();
    const transactionId = rawZkPayload.punch_id ? String(rawZkPayload.punch_id) : null;

    return {
      deviceSerialNumber,
      biometricUserId,
      eventType,
      verificationType,
      eventTime,
      transactionId,
      rawData: rawZkPayload,
    };
  }
}

export const zktecoBiometricAdapter = new ZktecoBiometricAdapter();
