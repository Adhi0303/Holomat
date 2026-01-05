interface JarvisPanelProps {
    state: 'idle' | 'listening' | 'processing' | 'speaking'
    lastResponse?: string
    onActivate?: () => void
}

export function JarvisPanel({
    state = 'idle',
    lastResponse = '"Good morning, Mr. Stark. All systems are operational."',
    onActivate
}: JarvisPanelProps) {
    const getStatusText = () => {
        switch (state) {
            case 'listening': return 'LISTENING...'
            case 'processing': return 'PROCESSING...'
            case 'speaking': return 'SPEAKING...'
            default: return 'IDLE — Say "Hey Jarvis"'
        }
    }

    return (
        <div className="panel-section jarvis-panel">
            <h3 className="panel-title">JARVIS AI</h3>
            <div
                className={`jarvis-waveform ${state !== 'idle' ? 'active' : ''}`}
                onClick={onActivate}
            >
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
            </div>
            <p className={`jarvis-status ${state}`}>{getStatusText()}</p>
            <div className="jarvis-transcript">
                <p className="transcript-label">Last Response:</p>
                <p className="transcript-text">{lastResponse}</p>
            </div>
        </div>
    )
}
