import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// Import the new chat function from the dedicated file
import { generateReplicateChat } from "./chat/replicateChat.js";

dotenv.config();
const app = express();

// Use PORT from .env, defaulting to 5000
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(express.json());

// API route to handle chat requests
app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message content is required." });
        }

        // Call the centralized Replicate function and await the full response
        const reply = await generateReplicateChat(message);

        // Replicate output is often an array of strings, join it for a clean text response.
        res.json({ reply: Array.isArray(reply) ? reply.join("") : reply });

    } catch (err) {
        // Log the full error details on the server side for proper debugging
        console.error("Server Error during Replicate chat:", err);

        // Send a generic 500 error to the client with a more informative message
        res.status(500).json({ error: "Failed to communicate with AI model. Please check server logs." });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    // Helpful log to ensure the API token is loaded
    console.log(`REPLICATE_API_TOKEN status: ${process.env.REPLICATE_API_TOKEN ? 'Loaded' : 'MISSING'}`);
    console.log("Replicate token:", process.env.REPLICATE_API_TOKEN);

});