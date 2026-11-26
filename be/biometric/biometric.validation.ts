// biometric/biometric.validation.ts

import type { NormalizedBiometricEvent } from './biometric.types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class BiometricValidator {
  /**
   * Validates a normalized biometric event before processing.
   */
  public static validateEvent(event: NormalizedBiometricEvent): ValidationResult {
    const errors: string[] = [];

    if (!event) {
      errors.push('Event payload is required');
      return { isValid: false, errors };
    }

    if (!event.deviceId && !event.deviceSerialNumber) {
      errors.push('Either deviceId or deviceSerialNumber must be provided');
    }

    if (!event.biometricUserId || String(event.biometricUserId).trim() === '') {
      errors.push('biometricUserId is required and cannot be empty');
    }

    if (!event.eventType) {
      errors.push('eventType is required');
    }

    if (!event.eventTime) {
      errors.push('eventTime is required');
    } else {
      const parsedDate = new Date(event.eventTime);
      if (isNaN(parsedDate.getTime())) {
        errors.push('eventTime must be a valid date or ISO timestamp');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates registration data for a new biometric device.
   */
  public static validateDeviceRegistration(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data.name || String(data.name).trim() === '') {
      errors.push('Device name is required');
    }

    if (!data.serialNumber || String(data.serialNumber).trim() === '') {
      errors.push('Device serialNumber is required');
    }

    if (!data.gymId) {
      errors.push('Gym ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates registration data for mapping a biometric user to a gym member.
   */
  public static validateUserMapping(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data.memberId) {
      errors.push('Member (Client) ID is required');
    }

    if (!data.deviceId) {
      errors.push('Device ID is required');
    }

    if (!data.biometricUserId || String(data.biometricUserId).trim() === '') {
      errors.push('Biometric user ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
