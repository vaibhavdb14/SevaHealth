import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// app.use(cors({
//   origin: "http://localhost:8080",
// }));
app.use(
  cors({
    origin: "http://localhost:8080",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());

// Supabase service role client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ---------------- GET REPORTS ---------------- */
app.get("/get-reports", async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "UID required" });

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", uid)
      .order("uploaded_at", { ascending: false });
      // .order("created_at", { ascending: false });


    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

/* ---------------- UPLOAD REPORT ---------------- */
app.post("/upload-report", upload.single("file"), async (req, res) => {
  try {
    const { firebaseUid } = req.body;
    const file = req.file;

    if (!file || !firebaseUid) {
      return res.status(400).json({ error: "Missing file or UID" });
    }

    const ext = file.originalname.split(".").pop();
    const filePath = `${firebaseUid}/${Date.now()}.${ext}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("medical-reports")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) throw uploadError;

    // Save metadata
    const { error: dbError } = await supabase.from("reports").insert({
      user_id: firebaseUid,
      file_path: filePath,
      report_name: file.originalname,
    });

    if (dbError) throw dbError;

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

/* ---------------- VIEW REPORT ---------------- */
app.get("/get-signed-url", async (req, res) => {
  try {
    const { filePath } = req.query;

    const { data, error } = await supabase.storage
      .from("medical-reports")
      .createSignedUrl(filePath, 60);

    if (error) throw error;
    res.json({ signedUrl: data.signedUrl });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate URL" });
  }
});

/* ---------------- RENAME REPORT ---------------- */
app.post("/rename-report", async (req, res) => {
  try {
    const { id, newName } = req.body;

    const { error } = await supabase
      .from("reports")
      .update({ report_name: newName })
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Rename failed" });
  }
});

/* ---------------- DELETE REPORT ---------------- */
app.delete("/delete-report", async (req, res) => {
  try {
    const { id, filePath } = req.body;

    if (!id || !filePath) {
      return res.status(400).json({ error: "Missing id or filePath" });
    }

    // 1. Delete file from storage
    const { error: storageError } = await supabase.storage
      .from("medical-reports")
      .remove([filePath]);

    if (storageError) throw storageError;

    // 2. Delete record from DB
    const { error: dbError } = await supabase
      .from("reports")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// doctors

/* ---------------- UPLOAD DOCTOR DOCUMENT ---------------- */
app.post("/upload-doctor-document", upload.single("file"), async (req, res) => {
  try {
    const { doctorUid, documentType } = req.body; // documentType = "STAMP" or "OTHER"
    const file = req.file;

    if (!doctorUid || !documentType || !file) {
      return res.status(400).json({ error: "Missing data" });
    }

    const ext = file.originalname.split(".").pop();
    const filePath = `${doctorUid}/${documentType}_${Date.now()}.${ext}`;

    // Upload to doctor-documents bucket
    const { error: storageError } = await supabase.storage
      .from("doctor-documents")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (storageError) throw storageError;

    // Save metadata
    const { error: dbError } = await supabase
      .from("doctor_documents")
      .insert({
        doctor_uid: doctorUid,
        file_path: filePath,
        document_type: documentType,
        document_name: file.originalname,
      });

    if (dbError) throw dbError;

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Doctor document upload failed" });
  }
});

/* ---------------- GET DOCTOR DOCUMENTS ---------------- */
app.get("/get-doctor-documents", async (req, res) => {
  try {
    const { doctorUid } = req.query;
    if (!doctorUid) return res.status(400).json({ error: "doctorUid required" });

    const { data, error } = await supabase
      .from("doctor_documents")
      .select("*")
      .eq("doctor_uid", doctorUid)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch doctor documents" });
  }
});

/* ---------------- VIEW DOCTOR DOCUMENT ---------------- */
app.get("/get-doctor-signed-url", async (req, res) => {
  try {
    const { filePath } = req.query;
    if (!filePath) return res.status(400).json({ error: "filePath required" });

    const { data, error } = await supabase.storage
      .from("doctor-documents")
      .createSignedUrl(filePath, 60); // valid 60 seconds

    if (error) throw error;
    res.json({ signedUrl: data.signedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
});

/* ---------------- RENAME DOCTOR DOCUMENT ---------------- */
app.put("/rename-doctor-document", async (req, res) => {
  try {
    const { id, newName } = req.body;
    if (!id || !newName) return res.status(400).json({ error: "Missing data" });

    const { error } = await supabase
      .from("doctor_documents")
      .update({ document_name: newName })
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Rename failed" });
  }
});

/* ---------------- DELETE DOCTOR DOCUMENT ---------------- */
app.delete("/delete-doctor-document", async (req, res) => {
  try {
    const { id, filePath } = req.body;
    if (!id || !filePath) return res.status(400).json({ error: "Missing data" });

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from("doctor-documents")
      .remove([filePath]);

    if (storageError) throw storageError;

    // Delete record from DB
    const { error: dbError } = await supabase
      .from("doctor_documents")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// NGOs
/* ---------------- UPLOAD NGO DOCUMENT ---------------- */
app.post("/upload-ngo-document", upload.single("file"), async (req, res) => {
  try {
    const { ngoUid, documentType } = req.body; // e.g. REGISTRATION, LICENSE, OTHER
    const file = req.file;

    if (!ngoUid || !documentType || !file) {
      return res.status(400).json({ error: "Missing data" });
    }

    const ext = file.originalname.split(".").pop();
    const filePath = `${ngoUid}/${documentType}_${Date.now()}.${ext}`;

    // Upload to NGO bucket
    const { error: storageError } = await supabase.storage
      .from("ngo-documents")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (storageError) throw storageError;

    // Save metadata
    const { error: dbError } = await supabase
      .from("ngo_documents")
      .insert({
        ngo_uid: ngoUid,
        file_path: filePath,
        document_type: documentType,
        document_name: file.originalname,
      });

    if (dbError) throw dbError;

    res.json({ success: true });
  } catch (err) {
    console.error("NGO upload error:", err);
    res.status(500).json({ error: "NGO document upload failed" });
  }
});


/* ---------------- GET NGO DOCUMENTS ---------------- */
app.get("/get-ngo-documents", async (req, res) => {
  try {
    const { ngoUid } = req.query;
    if (!ngoUid) return res.status(400).json({ error: "ngoUid required" });

    const { data, error } = await supabase
      .from("ngo_documents")
      .select("*")
      .eq("ngo_uid", ngoUid)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Fetch NGO docs error:", err);
    res.status(500).json({ error: "Failed to fetch NGO documents" });
  }
});

/* ---------------- VIEW NGO DOCUMENT ---------------- */
app.get("/get-ngo-signed-url", async (req, res) => {
  try {
    const { filePath } = req.query;
    if (!filePath) return res.status(400).json({ error: "filePath required" });

    const { data, error } = await supabase.storage
      .from("ngo-documents")
      .createSignedUrl(filePath, 60);

    if (error) throw error;
    res.json({ signedUrl: data.signedUrl });
  } catch (err) {
    console.error("Signed URL error:", err);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
});


/* ---------------- RENAME NGO DOCUMENT ---------------- */
app.post("/rename-ngo-document", async (req, res) => {
  try {
    const { id, newName } = req.body;
    if (!id || !newName) return res.status(400).json({ error: "Missing data" });

    const { error } = await supabase
      .from("ngo_documents")
      .update({ document_name: newName })
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Rename NGO doc error:", err);
    res.status(500).json({ error: "Rename failed" });
  }
});


/* ---------------- DELETE NGO DOCUMENT ---------------- */
app.delete("/delete-ngo-document", async (req, res) => {
  try {
    const { id, filePath } = req.body;
    if (!id || !filePath) return res.status(400).json({ error: "Missing data" });

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from("ngo-documents")
      .remove([filePath]);

    if (storageError) throw storageError;

    // Delete DB record
    const { error: dbError } = await supabase
      .from("ngo_documents")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    res.json({ success: true });
  } catch (err) {
    console.error("Delete NGO doc error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});


// /* ---------------- UPLOAD DOCTOR DOCUMENT ---------------- */
// app.post("/upload-doctor-document", upload.single("file"), async (req, res) => {
//   try {
//     const { doctorUid, documentType } = req.body;
//     const file = req.file;

//     if (!doctorUid || !documentType || !file) {
//       return res.status(400).json({ error: "Missing data" });
//     }

//     const ext = file.originalname.split(".").pop();
//     const filePath = `${doctorUid}/${documentType}_${Date.now()}.${ext}`;

//     // Upload to doctor bucket
//     const { error: storageError } = await supabase.storage
//       .from("doctor-documents")
//       .upload(filePath, file.buffer, {
//         contentType: file.mimetype,
//       });

//     if (storageError) throw storageError;

//     // Save metadata
//     const { error: dbError } = await supabase
//       .from("doctor_documents")
//       .insert({
//         doctor_uid: doctorUid,
//         file_path: filePath,
//         document_type: documentType,
//         document_name: file.originalname,
//       });

//     if (dbError) throw dbError;

//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Doctor document upload failed" });
//   }
// });

// // fetch doctor document
// app.get("/get-doctor-documents", async (req, res) => {
//   try {
//     const { doctorUid } = req.query;

//     if (!doctorUid) {
//       return res.status(400).json({ documents: [], error: "doctorUid required" });
//     }

//     const { data, error } = await supabase
//       .from("doctor_documents")
//       .select("*")
//       .eq("doctor_uid", doctorUid)
//       .order("created_at", { ascending: false });

//     if (error) throw error;

//     res.json({ documents: data || [] });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ documents: [], error: "Failed to fetch documents" });
//   }
// });



app.listen(3000, () => {
  console.log("Server running on port 3000");
});
