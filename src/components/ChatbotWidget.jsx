import { useState, useEffect, useRef } from "react";
import { Send, X, MessageSquare } from 'lucide-react';

// Main component
export default function App() {
    const [open, setOpen] = useState(false);
    const messagesEndRef = useRef(null);

    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hello! I'm SevaHealth AI, your friendly assistant for the SevaHealth platform. I'm here to help you navigate our services and answer any questions you may have about your health and wellness. \n\nI'd like to suggest a few questions you can ask me to get started: \nHow can SevaHealth help me?\nWhat services are available?\nIs the platform paid or free?\nI have a symptom — what should I know? \nHow do I navigate to the consultation section? \n\n Feel free to ask me any of these questions or any others that come to mind. I'm here to support you!"
        }
    ]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // Scroll to the bottom of the message list whenever messages update
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    async function sendMessage() {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        
        // 1. Add user message to state immediately
        const newMsgs = [...messages, { role: "user", content: userMessage }];
        setMessages(newMsgs);
        setInput("");
        setLoading(true);

        try {
            // CRITICAL: Ensure this URL points to your running backend (PORT 8080)
            const res = await fetch("http://localhost:8080/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }) 
            });

            // 2. Check for successful HTTP status code (200-299)
            if (!res.ok) {
                const errorData = await res.json();
                const backendErrorMessage = errorData.error || `HTTP error! Status: ${res.status}`;
                throw new Error(backendErrorMessage);
            }

            const data = await res.json();
            
            // 3. Check for successful response body (which contains the 'reply')
            if (data.reply) {
                setMessages(prev => [
                    ...prev,
                    { role: "assistant", content: data.reply }
                ]);
            } else {
                 throw new Error("Received an unexpected empty reply from the server.");
            }

        } catch (error) {
            console.error("Fetch/API Error:", error.message);
            setMessages(prev => [
                ...prev,
                { role: "assistant", content: `Network error. Check connection. (${error.message})` }
            ]);
        } finally {
            setLoading(false);
        }
    }

    // Handle pressing Enter key
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    /**
     * MODIFIED function to convert all lists (both numbered and bulleted) into
     * bulleted (unordered) lists using <ul>.
     */
    const renderMarkdown = (markdownText) => {
        // 1. Replace **bold** and *italic*
        let htmlText = markdownText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
            
        // Use a placeholder for paragraphs before list processing
        htmlText = htmlText.replace(/\n\n/g, '<br/><br/>'); 

        // 2. MODIFICATION: Combine logic for numbered (1.) and unordered (*, -) lists
        // Matches a block of list items that start with a number (e.g., 1.) OR a bullet (*, -)
        const listRegex = /((?:\n|^)(\d+\.\s.*|[\*\-]\s.*)(?:\n(\d+\.\s.*|[\*\-]\s.*))*)/g;
        
        htmlText = htmlText.replace(listRegex, (match) => {
            // Split the matched block into individual lines
            const items = match.trim().split('\n').map(line => 
                // Remove EITHER the list number prefix (1. ) OR the bullet prefix (*, -)
                line.replace(/^\d+\.\s*|^[\*\-]\s*/, '').trim()
            ).filter(line => line.length > 0)
             .map(line => `<li>${line}</li>`)
             .join('');
             
            // Wrap the list items in a single <ul> tag (unordered list = bullet points)
            // The browser handles the bullet points automatically.
            return `<ul class="list-disc list-inside space-y-1 my-2 pl-4">${items}</ul>`;
        });

        // 3. Final cleanup for remaining single newlines (turn them into a single break)
        htmlText = htmlText.replace(/\n/g, '<br/>');

        return <div dangerouslySetInnerHTML={{ __html: htmlText }} />;
    };


    const ChatBubble = ({ message }) => {
        const isUser = message.role === 'user';
        
        return (
            <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
                <div className={`max-w-[85%] px-4 py-2 text-sm rounded-xl shadow-md ${
                    isUser
                        ? 'bg-emerald-500 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-tl-none markdown-content'
                }`}>
                    {/* Render user message as plain text, assistant message using custom Markdown renderer */}
                    {isUser ? (
                        message.content
                    ) : (
                        renderMarkdown(message.content)
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="relative h-full w-full p-4">
            {/* Floating Teal Button */}
            <button
                className="fixed bottom-8 right-8 z-50 p-4 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 transition duration-300"
                onClick={() => setOpen(!open)}
                aria-label="Toggle Chatbot"
            >
                <MessageSquare size={24} />
            </button>

            {open && (
                <div className="fixed bottom-24 right-8 z-40 w-full max-w-sm h-[80vh] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300">
                    
                    {/* Header (Teal Background) */}
                    <div className="flex items-center justify-between p-4 bg-teal-600 text-white shadow-lg rounded-t-2xl">
                        <span className="font-semibold text-lg">SevaHealth Assistant</span>
                        <button 
                            className="p-1 rounded-full hover:bg-teal-500 transition" 
                            onClick={() => setOpen(false)}
                            aria-label="Close Chatbot"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 p-4 overflow-y-auto bg-white">
                        {messages.map((m, i) => (
                            <ChatBubble key={i} message={m} />
                        ))}
                        {loading && <ChatBubble message={{ role: 'assistant', content: "AI is thinking..." }} />}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your question..."
                            className="flex-1 p-3 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            disabled={loading}
                        />
                        <button 
                            onClick={sendMessage} 
                            disabled={!input.trim() || loading}
                            className={`p-3 rounded-r-full text-white transition duration-200 flex items-center justify-center ${
                                input.trim() && !loading
                                    ? 'bg-teal-600 hover:bg-teal-700'
                                    : 'bg-gray-400 cursor-not-allowed'
                            }`}
                            aria-label="Send Message"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <Send size={20} />
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}