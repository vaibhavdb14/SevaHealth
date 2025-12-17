import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
  origin: "http://localhost:8080",
}));

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


app.listen(3000, () => {
  console.log("Server running on port 3000");
});
