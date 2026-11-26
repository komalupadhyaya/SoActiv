// biometric/essl.routes.ts
//
// eSSL ADMS (Automatic Data Master Server) Push Protocol Endpoints
//
// The eSSL / ZKTeco biometric device is configured with our server URL.
// The device will:
//   1. Send a GET handshake to /iclock/cdata?SN=DEVICE_SN&...
//   2. Push attendance logs via POST /iclock/cdata?SN=DEVICE_SN&table=ATTLOG
//
// Response format:
//   Handshake: "GET OPTION FROM: DEVICE_SN\nATTLOG\nOPERLOG\n" (device reads server options)
//   Data push:  "OK:<count>" (acknowledge how many records were received)
//
// Device configuration (in eSSL device ADMS/Cloud settings):
//   Server URL:  http://<your-server-ip>:8000/iclock/cdata
//   Server Port: 8000 (or your backend port)

import { Router } from 'express';
import type { Request, Response } from 'express';
import { EsslBiometricAdapter } from './adapters/essl.adapter';
import { BiometricService } from './biometric.service';

const esslRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: Parse raw text body for ATTLOG (device sends text/plain)
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express';
esslRouter.use(express.text({ type: ['text/plain', 'application/octet-stream', '*/*'] }));

// ─────────────────────────────────────────────────────────────────────────────
// GET /iclock/cdata  — Device Handshake / Heartbeat
//
// The device sends this request on startup and periodically to check connectivity.
// Query params: SN (serial number), options (comma-separated data types device supports)
//
// Response must include "GET OPTION FROM: <SN>" and optionally list supported tables.
// ─────────────────────────────────────────────────────────────────────────────
esslRouter.get('/cdata', async (req: Request, res: Response) => {
  const sn = (req.query.SN || req.query.sn || '') as string;
  const stamp = (req.query.Stamp || req.query.stamp || '0') as string;

  console.log(`[eSSL] 🤝 Handshake from device SN: ${sn} | Stamp: ${stamp}`);

  // Update device last-ping timestamp if the device is registered
  if (sn) {
    try {
      const { BiometricDevice } = await import('../models/biometricDevice.model');
      await BiometricDevice.findOneAndUpdate(
        { serialNumber: sn.trim().toUpperCase() },
        { lastPingAt: new Date(), status: 'ONLINE' }
      );
    } catch (err) {
      console.warn('[eSSL] Could not update device ping:', (err as Error).message);
    }
  }

  // Respond with ADMS server options (tells device which data tables to upload)
  // The response format is: "GET OPTION FROM: <SN>\n<TABLE1>\n<TABLE2>\n..."
  res.set('Content-Type', 'text/plain');
  res.send([
    `GET OPTION FROM: ${sn}`,
    'ATTLOG',      // Attendance log data
    'OPERLOG',     // Operator log (optional)
  ].join('\n'));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /iclock/cdata  — Device Data Push (ATTLOG attendance records)
//
// The device sends tab-separated attendance records in the body:
//   Body: "PIN\tTime\tStatus\tVerify\tWorkCode\n..."
//   Query: SN=<serial>&table=ATTLOG
//
// We must respond with "OK:<count>" to tell the device we received the records.
// ─────────────────────────────────────────────────────────────────────────────
esslRouter.post('/cdata', async (req: Request, res: Response) => {
  const sn = (req.query.SN || req.query.sn || '') as string;
  const table = (req.query.table || req.query.Table || '') as string;

  // Only handle ATTLOG table (attendance events)
  if (table.toUpperCase() !== 'ATTLOG') {
    console.log(`[eSSL] Received table=${table} from SN=${sn} — acknowledged without processing`);
    res.set('Content-Type', 'text/plain');
    res.send('OK:0');
    return;
  }

  const rawBody = typeof req.body === 'string' ? req.body : '';
  console.log(`[eSSL] 📥 ATTLOG push from SN=${sn} | Records:\n${rawBody}`);

  if (!rawBody.trim()) {
    res.set('Content-Type', 'text/plain');
    res.send('OK:0');
    return;
  }

  // Split body into individual ATTLOG lines
  const lines = rawBody
    .split('\n')
    .map((l) => l.replace(/\r/g, '').trim())
    .filter((l) => l.length > 0);

  let processedCount = 0;
  const adapter = new EsslBiometricAdapter();

  for (const line of lines) {
    try {
      // Parse the ATTLOG tab-separated line
      const parsed = EsslBiometricAdapter.parseAttLogLine(line, sn);
      if (!parsed) {
        console.warn(`[eSSL] Skipping invalid ATTLOG line: "${line}"`);
        continue;
      }

      // Normalize into standard NormalizedBiometricEvent
      const normalizedEvent = adapter.normalizeEvent(parsed);

      // Run through the full business pipeline
      const result = await BiometricService.processBiometricEvent(normalizedEvent);

      console.log(
        `[eSSL] PIN=${parsed.pin} | ${result.accessAllowed ? '✅ ACCESS_ALLOWED' : '❌ ' + result.reason} | ${result.memberName || 'Unknown'}`
      );

      processedCount++;
    } catch (err) {
      console.error(`[eSSL] Error processing ATTLOG line "${line}":`, (err as Error).message);
    }
  }

  // Respond with count of records received (not necessarily processed)
  // The device uses this to clear records from its local queue
  res.set('Content-Type', 'text/plain');
  res.send(`OK:${lines.length}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /iclock/getrequest  — Device polls for commands from server
// This endpoint is used when the server wants to send commands TO the device
// (e.g. enroll users, clear records). For now, return empty (no pending commands).
// ─────────────────────────────────────────────────────────────────────────────
esslRouter.get('/getrequest', (req: Request, res: Response) => {
  const sn = (req.query.SN || req.query.sn || '') as string;
  console.log(`[eSSL] 📋 Command poll from SN=${sn}`);
  res.set('Content-Type', 'text/plain');
  res.send('OK'); // No pending commands
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /iclock/devicecmd  — Device acknowledges server commands
// ─────────────────────────────────────────────────────────────────────────────
esslRouter.post('/devicecmd', (req: Request, res: Response) => {
  const sn = (req.query.SN || req.query.sn || '') as string;
  console.log(`[eSSL] ✅ Device CMD ack from SN=${sn}`);
  res.set('Content-Type', 'text/plain');
  res.send('OK');
});

export default esslRouter;
