import admin from "firebase-admin";
import path from "path";
import { readFileSync } from "fs";
 
// Safely load and parse the service account file
const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
 
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
 
export default admin;