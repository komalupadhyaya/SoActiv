# Device-Independent Biometric Business Layer

## 1. Overview & Architecture

The **Biometric Business Layer** is designed to be completely **device-independent** and **vendor-agnostic**. It separates physical hardware communication (eSSL, ZKTeco, RFID, Hikvision, etc.) from gym management business rules (member identification, membership validation, attendance creation, audit logging).

### Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│   Biometric Hardware / Push Server / Cloud Connectors  │
│      (eSSL ADMS / ZKTeco Push / RFID / Mock Device)    │
└──────────────────────────┬─────────────────────────────┘
                           │ Raw Device Payload (HTTP / TCP / Webhook)
                           ▼
┌────────────────────────────────────────────────────────┐
│               Adapter / Normalization Layer            │
│   (e.g., GenericBiometricAdapter, EsslBiometricAdapter) │
└──────────────────────────┬─────────────────────────────┘
                           │ NormalizedBiometricEvent
                           ▼
┌────────────────────────────────────────────────────────┐
│             BiometricService.processEvent              │
├────────────────────────────────────────────────────────┤
│ 1. Validate normalized event payload                   │
│ 2. Find and verify BiometricDevice (Active check)      │
│ 3. Prevent duplicate punches (Transaction/Time-window) │
│ 4. Update Device Health & communication timestamp      │
│ 5. Find BiometricUser mapping (deviceId + bUserId)     │
│ 6. Retrieve gym member profile (Client)                │
│ 7. Validate membership rules (Active/Expired/Frozen)   │
│ 8. Seamlessly record in ClientAttendance collection    │
│ 9. Record immutable audit record in BiometricEventLog  │
└──────────────────────────┬─────────────────────────────┘
                           │ Standardized Processing Output
                           ▼
┌────────────────────────────────────────────────────────┐
│               BiometricProcessingResult                │
│   { success: true, accessAllowed: true, reason: ... }  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Entities & Data Models

### A. `BiometricDevice` (`models/biometricDevice.model.ts`)
Represents physical biometric machines belonging to a gym branch.
- `name`: Human-readable device name (e.g., "Main Entrance Turnstile").
- `gymId`: Associated gym branch.
- `adminId`: Tenant gym admin.
- `serialNumber`: Device unique hardware serial number.
- `deviceType`: `FINGERPRINT` | `FACE` | `RFID` | `CARD` | `MULTI_MODAL` | `UNKNOWN`.
- `connectionType`: `PUSH` | `TCP_IP` | `HTTP` | `HTTPS` | `SDK` | `POLLING` | `UNKNOWN`.
- `status`: `ONLINE` | `OFFLINE` | `DISABLED` | `UNKNOWN`.
- `isActive`: Boolean toggle.
- `duplicateWindowSeconds`: Debounce window in seconds (default: 30s).
- `lastPingAt`, `lastCommunicationAt`: Device health monitoring timestamps.

### B. `BiometricUser` (`models/biometricUser.model.ts`)
Maps a physical device's local user ID to a Gym Member (`Client`).
- `memberId`: Reference to `Client`.
- `deviceId`: Reference to `BiometricDevice`.
- `biometricUserId`: String user ID on the physical machine (e.g., `"2936"`).
- `status`: `active` | `suspended` | `deleted`.
- **Compound Unique Index**: `{ deviceId: 1, biometricUserId: 1 }`
  - Allows one member to be enrolled on multiple devices with different IDs.
  - Allows different devices to have overlapping local IDs without collisions.

### C. `BiometricEventLog` (`models/biometricEventLog.model.ts`)
Complete audit trail of every access attempt received.
- `deviceId`, `deviceSerialNumber`, `memberId`, `biometricUserId`, `transactionId`.
- `eventType`: `CHECK_IN` | `CHECK_OUT` | `ACCESS` | `UNKNOWN`.
- `verificationType`: `FINGERPRINT` | `FACE` | `RFID` | `CARD` | `PIN` | `UNKNOWN`.
- `processingStatus`: `RECEIVED` | `PROCESSED` | `DUPLICATE` | `UNKNOWN_USER` | `DEVICE_DISABLED` | `MEMBERSHIP_DENIED` | `PROCESSING_FAILED`.
- `accessAllowed`: Boolean.
- `failureReason`: Standard reason code if access denied.
- `attendanceId`: Reference to generated `ClientAttendance` record.
- `rawData`: Complete raw incoming payload for debugging.

---

## 3. Normalized Biometric Event Format

All adapters convert raw incoming device data to `NormalizedBiometricEvent`:

```json
{
  "deviceId": "60d0fe4f5311236168a109ca",
  "deviceSerialNumber": "BIO-SN-9988",
  "biometricUserId": "2936",
  "eventType": "CHECK_IN",
  "verificationType": "FINGERPRINT",
  "eventTime": "2026-09-23T14:30:00.000Z",
  "transactionId": "TX_990182",
  "rawData": {}
}
```

---

## 4. API Endpoints

### Ingestion & Test Endpoints
- `POST /api/v1/biometric/events` — Main event ingestion endpoint.
- `POST /api/v1/biometric/test-event` — Mock test endpoint (executes exact same business pipeline).

### Device Management (`authMiddleware` protected)
- `POST /api/v1/biometric/devices` — Register new biometric device.
- `GET /api/v1/biometric/devices` — List devices for gym.
- `GET /api/v1/biometric/devices/:id` — Get device details.
- `PUT /api/v1/biometric/devices/:id` — Update device configuration.
- `DELETE /api/v1/biometric/devices/:id` — Delete device & associated user mappings.
- `GET /api/v1/biometric/devices/:id/status` — Get device connectivity health.

### Biometric User Mapping (`authMiddleware` protected)
- `POST /api/v1/biometric/users` — Map biometric user ID to member (`memberId`, `deviceId`, `biometricUserId`).
- `GET /api/v1/biometric/users` — List mappings with populated member & device details.
- `PUT /api/v1/biometric/users/:id` — Update mapping status.
- `DELETE /api/v1/biometric/users/:id` — Remove mapping.

### Audit & Attendance Queries (`authMiddleware` protected)
- `GET /api/v1/biometric/events` — Query event logs with pagination and filters.
- `GET /api/v1/biometric/attendance` — Query biometric attendance records.

---

## 5. How to Add Future Adapters (e.g. eSSL, ZKTeco)

When a specific physical hardware protocol is confirmed:

1. Create an adapter implementing `BiometricAdapter`:
   ```typescript
   export class MyDeviceAdapter implements BiometricAdapter {
     public readonly adapterName = 'MY_DEVICE';
     public normalizeEvent(rawPayload: any): NormalizedBiometricEvent {
       return {
         deviceSerialNumber: rawPayload.SN,
         biometricUserId: rawPayload.UID,
         eventType: rawPayload.ACTION === 1 ? 'CHECK_IN' : 'CHECK_OUT',
         verificationType: 'FINGERPRINT',
         eventTime: new Date(rawPayload.TIME),
         transactionId: rawPayload.LOG_ID,
         rawData: rawPayload,
       };
     }
   }
   ```
2. Feed the normalized event into `BiometricService.processBiometricEvent(normalizedEvent)`.
3. **No changes are needed in the core business service, membership logic, or attendance models.**
