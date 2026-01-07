# 🤖 HoloMat - Iron Man IoT Workstation

An intelligent, sensor-driven workstation inspired by Tony Stark's lab. Features AI voice assistant (Jarvis), 3D hologram display, face recognition, and gesture control.

![HoloMat UI](../holo%20mat%20ui%20idea.png)

---

## 🚀 Quick Start for Team Members

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **Groq API Key** (shared privately by team lead)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Adhi0303/Holomat.git
cd Holomat/frontend\ UI
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

Copy the example environment file and add the API key:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env.local

# Mac/Linux
cp .env.example .env.local
```

Then edit `.env.local` and add the Groq API key:

```env
VITE_GROQ_API_KEY=your_api_key_here
VITE_AI_MODEL=openai/gpt-oss-120b
```

> ⚠️ **Important:** Get the API key from your team lead. Never commit `.env.local` to the repository!

### Step 4: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎤 Using Jarvis Voice Assistant

1. Click the **Jarvis button** (bottom-left with microphone icon)
2. **Allow microphone access** when prompted
3. Speak a command, e.g.:
   - "Hello Jarvis"
   - "What's my CPU status?"
   - "Tell me a joke"
4. Jarvis will respond with AI-generated speech!

> **Tip:** Use Chrome or Edge for best speech recognition support.

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | React 19, TypeScript, Vite |
| **3D Graphics** | Three.js, React Three Fiber |
| **State** | Zustand |
| **AI/LLM** | Groq API (openai/gpt-oss-120b) |
| **Voice** | Web Speech API |
| **Animations** | Framer Motion |
| **Face Detection** | TensorFlow.js |

---

## 📁 Project Structure

```
frontend UI/
├── src/
│   ├── components/       # UI Components
│   │   ├── common/       # Reusable components
│   │   ├── HologramScene.tsx
│   │   ├── JarvisPanel.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   │   ├── useVoiceAssistant.ts
│   │   ├── useFaceDetection.ts
│   │   └── useMockData.ts
│   ├── screens/          # Full-page screens
│   ├── services/         # API services
│   │   └── aiService.ts  # Groq AI integration
│   ├── stores/           # State management
│   └── styles/           # CSS files
├── .env.example          # Environment template
└── package.json
```

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Commit: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📞 Team Contact

**Project Lead:** Suriya  
**Repository:** [github.com/Adhi0303/Holomat](https://github.com/Adhi0303/Holomat)

---

*"Sometimes you gotta run before you can walk."* — Tony Stark
