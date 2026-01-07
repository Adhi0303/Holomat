/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GROQ_API_KEY: string
    readonly VITE_AI_MODEL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
