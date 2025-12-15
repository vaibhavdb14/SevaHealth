import Replicate from "replicate";
import dotenv from "dotenv";

dotenv.config();

// The Replicate object is initialized with the API token from the environment
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Generates a chat response using the Llama 2 70B model from Replicate.
 * This function uses the replicate.run() method which handles the asynchronous
 * prediction creation and subsequent polling until the result is complete.
 * @param {string} prompt - The user's message.
 * @returns {Promise<string|string[]>} The model's response text (typically an array of strings).
 */
export async function generateReplicateChat(prompt) {
    try {
        // The Llama 2 70B model ID and version
        const model = "meta/meta-llama-3-8b-instruct";

        // Execute the prediction and wait for the result
        const output = await replicate.run(
            model,
            {
                input: {
                    prompt: prompt,
                    // Define the persona for the assistant
                    system_prompt: "You are SevaHealth AI, allowed ONLY to answer basic health awareness questions and SevaHealth platform queries (navigation, features, benefits, pricing). You must NOT answer anything outside these topics; instead reply: “I’m here only to help with health-related guidance and SevaHealth platform information.” Do NOT prescribe medicines or give treatments. Always add: “I am an AI assistant, not a substitute for professional medical advice.”",
                    temperature: 0.75, // Controls randomness (0.0 to 1.0)
                    max_new_tokens: 1024, // Limits the length of the response
                }
            }
        );

        // The result is the final output from the model
        return output;

    } catch (error) {
        // Re-throw the error to be caught by the server.js handler
        throw new Error(`Replicate run failed: ${error.message}`);
    }
}