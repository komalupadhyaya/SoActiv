// biometric/adapters/essl.adapter.ts

import type {
  BiometricAdapter,
  NormalizedBiometricEvent,
  BiometricEventType,
  BiometricVerificationType,
} from '../biometric.types';


/**
 * eSSL ADMS Push Protocol Adapter
 *
 * Normalizes eSSL ADMS push payloads into NormalizedBiometricEvent.
 *
 * Supports two input modes:
 *  1. Parsed ATTLOG line object  (from essl.routes.ts ATTLOG parser)
 *  2. Raw JSON push payload      (JSON body style used by some firmware versions)
 *
 * eSSL ATTLOG Record Format (tab-separated):
 *   PIN \t Time \t Status \t Verify \t WorkCode
 *
 * eSSL Status codes:
 *   0 = Check-In
 *   1 = Check-Out
 *   2 = Break-Out
 *   3 = Break-In
 *   4 = Overtime-In
 *   5 = Overtime-Out
 *
 * eSSL VerifyMode codes:
 *   0  = Password (PIN)
 *   1  = Fingerprint
 *   2  = Card / RFID
 *   3  = FP + Card
 *   4  = PIN + FP
 *   11 = Face (some firmware)
 *   15 = Face (most common for eSSL/ZKTeco)
 */
export class EsslBiometricAdapter implements BiometricAdapter {
  public readonly adapterName = 'ESSL_ADAPTER';

  /**
   * Parse a single ATTLOG tab-separated record line into an object.
   * Expected format: PIN \t Time \t Status \t Verify \t WorkCode
   */
  public static parseAttLogLine(
    line: string,
    deviceSerialNumber: string
  ): {
    pin: string;
    time: string;
    status: string;
    verify: string;
    workCode: string;
    deviceSerialNumber: string;
  } | null {
    const parts = line.trim().split('\t');
    if (parts.length < 2) return null;

    return {
      pin: (parts[0] || '').trim(),
      time: (parts[1] || '').trim(),
      status: (parts[2] || '0').trim(),
      verify: (parts[3] || '1').trim(),
      workCode: (parts[4] || '0').trim(),
      deviceSerialNumber: deviceSerialNumber.trim().toUpperCase(),
    };
  }

  /**
   * Normalize a parsed ATTLOG record (or JSON push body) into NormalizedBiometricEvent.
   */
  public normalizeEvent(rawPayload: any): NormalizedBiometricEvent {
    if (!rawPayload || typeof rawPayload !== 'object') {
      throw new Error('Invalid eSSL event payload: must be an object');
    }

    // ── Device Serial Number ──────────────────────────────────────────
    const snRaw =
      rawPayload.deviceSerialNumber ||
      rawPayload.SN ||
      rawPayload.sn ||
      '';
    const deviceSerialNumber = snRaw.toString().trim().toUpperCase() || undefined;

    // ── Biometric User ID (PIN / UserID / uid) ───────────────────────
    const rawUserId =
      rawPayload.pin ??
      rawPayload.PIN ??
      rawPayload.UserID ??
      rawPayload.uid ??
      rawPayload.biometricUserId;

    if (rawUserId === undefined || rawUserId === null || String(rawUserId).trim() === '') {
      throw new Error('Invalid eSSL event: missing user PIN / UserID');
    }
    const biometricUserId = String(rawUserId).trim();

    // ── Event Type ────────────────────────────────────────────────────
    // Status: 0=Check-In, 1=Check-Out, 2=Break-Out, 3=Break-In, 4=OT-In, 5=OT-Out
    let eventType: BiometricEventType = 'CHECK_IN';
    const statusCode = String(
      rawPayload.status ?? rawPayload.Status ?? rawPayload.InOutState ?? '0'
    ).trim();

    if (statusCode === '1' || statusCode === '2' || statusCode === '5') {
      eventType = 'CHECK_OUT';
    } else if (statusCode === '0' || statusCode === '3' || statusCode === '4') {
      eventType = 'CHECK_IN';
    } else {
      // Fallback string matching for JSON push payloads
      const rawType = String(rawPayload.eventType || rawPayload.type || '').toUpperCase();
      if (rawType.includes('OUT') || rawType === 'CHECK_OUT') {
        eventType = 'CHECK_OUT';
      }
    }

    // ── Verification Type ─────────────────────────────────────────────
    // VerifyMode: 0=Password, 1=Fingerprint, 2=Card, 3=FP+Card, 4=PIN+FP, 11/15=Face
    let verificationType: BiometricVerificationType = 'FINGERPRINT';
    const verifyCode = String(
      rawPayload.verify ??
      rawPayload.Verify ??
      rawPayload.VerifyMode ??
      rawPayload.verifyMode ??
      '1'
    ).trim();

    if (verifyCode === '0') {
      verificationType = 'PIN';
    } else if (verifyCode === '1') {
      verificationType = 'FINGERPRINT';
    } else if (verifyCode === '2' || verifyCode === '3') {
      verificationType = 'RFID';
    } else if (verifyCode === '4') {
      verificationType = 'FINGERPRINT'; // FP+Card – primary is fingerprint
    } else if (verifyCode === '11' || verifyCode === '15') {
      verificationType = 'FACE';
    }

    // ── Event Time ────────────────────────────────────────────────────
    // Supports: "YYYY-MM-DD HH:MM:SS", ISO string, or JS Date
    const rawTime =
      rawPayload.time ||
      rawPayload.Time ||
      rawPayload.AttTime ||
      rawPayload.eventTime ||
      rawPayload.timestamp;

    let eventTime = new Date();
    if (rawTime) {
      const parsed = new Date(rawTime);
      if (!isNaN(parsed.getTime())) {
        eventTime = parsed;
      }
    }

    // ── Transaction / Log ID ──────────────────────────────────────────
    const rawLogId =
      rawPayload.logId ||
      rawPayload.LogID ||
      rawPayload.transactionId ||
      rawPayload.recordId;
    const transactionId = rawLogId ? String(rawLogId).trim() : null;

    return {
      deviceSerialNumber,
      biometricUserId,
      eventType,
      verificationType,
      eventTime,
      transactionId,
      rawData: rawPayload,
    };
  }
}

export const esslBiometricAdapter = new EsslBiometricAdapter();
