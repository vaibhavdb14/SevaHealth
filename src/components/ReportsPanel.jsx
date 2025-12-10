import { useState } from "react";
import Tesseract from "tesseract.js";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function ReportsPanel() {
  const [loading, setLoading] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);

  // ------------------- OCR + Upload + Firestore Store -------------------
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    try {
      // 1. Read file for OCR
      const fileURL = URL.createObjectURL(file);

      // 2. Run OCR
      const { data: { text } } = await Tesseract.recognize(fileURL, "eng");

      // 3. Parse basic fields (simple regex)
      const extracted = {
        name: text.match(/Name[:\-]\s*(.*)/i)?.[1] || "",
        date: text.match(/Date[:\-]\s*(.*)/i)?.[1] || "",
        disease: text.match(/Diagnosis[:\-]\s*(.*)/i)?.[1] || "",
        symptoms: text.match(/Symptoms[:\-]\s*(.*)/i)?.[1] || "",
        rawText: text
      };

      setScannedResult(extracted);

      // 4. Upload file to Firebase Storage
      const storageRef = ref(storage, `reports/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // 5. Save extracted info to Firestore
      await addDoc(collection(db, "reports"), {
        fileURL: downloadURL,
        ...extracted,
        uploadedAt: new Date()
      });

    } catch (err) {
      console.error(err);
      alert("OCR failed");
    }

    setLoading(false);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Upload Medical Reports</CardTitle>
        <CardDescription>Automatically scan and extract key details</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* Upload Box */}
        <div
          className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center hover:bg-primary/5 cursor-pointer"
          onClick={() => document.getElementById("fileInput2").click()}
        >
          <input type="file" id="fileInput2" className="hidden" onChange={handleFileUpload} />
          <Upload className="w-12 h-12 mx-auto text-primary mb-4" />
          <h3 className="font-semibold mb-2">Upload Report</h3>
          <p className="text-sm text-muted-foreground">PDF, JPG, PNG</p>
        </div>

        {loading && <p>Scanning Document, please wait...</p>}

        {/* Show extracted result */}
        {scannedResult && (
          <div className="bg-gray-100 p-4 rounded-lg space-y-2">
            <h3 className="font-bold">Extracted Details</h3>
            <p><strong>Name:</strong> {scannedResult.name}</p>
            <p><strong>Date:</strong> {scannedResult.date}</p>
            <p><strong>Disease:</strong> {scannedResult.disease}</p>
            <p><strong>Symptoms:</strong> {scannedResult.symptoms}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
