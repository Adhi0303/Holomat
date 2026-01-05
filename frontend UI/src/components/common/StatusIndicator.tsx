import './StatusIndicator.css'

interface StatusIndicatorProps {
    status: 'active' | 'inactive' | 'warning' | 'error'
    label: string
    pulsing?: boolean
}

export function StatusIndicator({ status, label, pulsing = false }: StatusIndicatorProps) {
    return (
        <div className="status-indicator">
            <span className={`status-indicator__dot status-indicator__dot--${status} ${pulsing ? 'pulsing' : ''}`}></span>
            <span className="status-indicator__label">{label}</span>
        </div>
    )
}
