const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Tesseract = require('tesseract.js');
const path = require("path");
const os = require("os");
const fs = require("fs");

admin.initializeApp();
const db = admin.firestore();

exports.scanMedicalReport = functions.storage.object().onFinalize(async (object) => {
  const bucket = admin.storage().bucket(object.bucket);
  const filePath = object.name;

  // Only run for reports folder
  if (!filePath.startsWith("reports/")) return;

  const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));

  // Download file locally
  await bucket.file(filePath).download({ destination: tempFilePath });

  console.log("File downloaded for OCR:", tempFilePath);

  // Run OCR
  const { data: { text }} = await Tesseract.recognize(
    tempFilePath,
    "eng"
  );

  console.log("OCR text extracted:", text);

  // Extract important fields using regex
  const extractField = (pattern) => {
    const match = text.match(pattern);
    return match ? match[1].trim() : "";
  };

  const extractedData = {
    patientName: extractField(/Name[:\- ]+(.*)/i),
    doctorName: extractField(/Doctor[:\- ]+(.*)/i),
    date: extractField(/Date[:\- ]+(.*)/i),
    symptoms: extractField(/Symptoms[:\- ]+(.*)/i),
    diagnosis: extractField(/Diagnosis[:\- ]+(.*)/i),
    medicines: extractField(/Medicines[:\- ]+(.*)/i),
    fullText: text,
    createdAt: admin.firestore.Timestamp.now(),
    status: "done",
    filePath
  };

  // Store into Firestore
  await db.collection("reports").add(extractedData);

  console.log("Stored OCR results in Firestore");

  // Cleanup
  fs.unlinkSync(tempFilePath);

  return true;
});
