# SnippetSync

## Your Real-Time Code Collaboration Playground

**SnippetSync** is a privacy-first, web-based platform for collaborative code editing and execution, built for **Simplicity**. Create or join temporary sessions to write, run, and discuss JavaScript snippets with your team—no accounts or persistent storage required. Sessions auto-expire after 24 hours, ensuring data privacy.

---

## 🛑 Problem

Developers need a lightweight, privacy-focused tool for real-time code collaboration during hackathons, pair programming, or teaching, but existing platforms are complex, require accounts, or store data indefinitely.

---

## ✅ Solution

**SnippetSync** offers a simple, no-database solution where users can:

- Create temporary sessions with unique URLs.
- Collaborate on JavaScript code in real-time with visible cursors.
- Run code using the Judge0 API.
- Receive lightweight AI suggestions for code improvements.
- Fork sessions for private copies.

---

## 🚀 Features

- **Real-Time Collaboration:** Sync code edits instantly with collaborator cursors.
- **Code Execution:** Run JavaScript snippets via Judge0 API, with output in a terminal pane.
- **AI Suggestions:** Toggleable, regex-based coding tips (e.g., “Add error handling?”).
- **Session Forking:** Copy sessions to new URLs for continued work.
- **Privacy-First:** No accounts; sessions auto-clear from server memory and browser after 24 hours.
- **Live User Count:** Displays connected users per session.
- **Responsive UI:** Desktop-optimized with mobile viewing support.

---

## 🛠️ Getting Started

1. **Access the App:** Visit the Hosted URL, e.g., on Vercel/Netlify].
2. **Start a Session:** Click “Start New Session” to generate a unique URL.
3. **Join a Session:** Enter a session URL on the landing page.
4. **Collaborate:** Edit code, run snippets, and view AI suggestions.
5. **Fork Session:** Click “Fork” to create a private copy.

> **Note:** No setup required for users; the app runs in the browser. For developers, see Demo Setup below.

---

## 🌐 Demo Setup

- **Live Demo:** your Hosted URL from(e.g., deployed on Vercel/Netlify).
- **Demo Flow:**
  - Create a session on the landing page.
  - Share the URL with a collaborator.
  - Edit JavaScript code together, showing real-time cursors.
  - Run code (e.g., `console.log("Hello, World!")`) to view output.
  - Toggle AI suggestions and apply one.
  - Fork a session to use AI-powered code improvement and execution.

- **Demo Video:**
Dropping Soon... 

---

## 💡 Usage Notes

- **Session Sharing:** Copy the session URL or use the “Copy URL” button to share via clipboard or WhatsApp.
- **Session Lifespan:** Sessions auto-expire after 24 hours or when all users disconnect.
- **API Limits:** Judge0 API (free plan) has daily request limits; demo optimized for minimal usage.
- **No Database:** Session data is stored in server memory and cleared automatically, ensuring privacy.

---

## 🛠️ Developer Setup (For Judges/Reviewers)

1. **Clone Repository:** Download or clone the project from my github.
2. **Frontend:** Host the single-page app on a static host (e.g., Vercel, Netlify).
3. **Backend:** Deploy the WebSocket server to a Node.js host (e.g., Render, Railway).
4. **Judge0 Integration:** Uses a free Judge0 API key for code execution.
5. **Environment:** Configure the Judge0 API key and WebSocket URL (provided in deployment).

---

## 🔮 Future Potential

- Enhanced AI suggestions with advanced models.
- Optional persistent sessions for SaaS expansion.

---

## 🏆 Built For the Change , Reliability & Simplicity!

---

## Why SnippetSync?

SnippetSync delivers a seamless, privacy-first coding experience with real-time collaboration and AI enhancements, perfect for hackathons, education, and remote coding. Its no-database design and intuitive UI make it a standout solution.

---

## 💎Fork, review, and contribute to SnippetSync.

## 📄 License

MIT
