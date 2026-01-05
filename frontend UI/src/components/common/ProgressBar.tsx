import './ProgressBar.css'

interface ProgressBarProps {
    value: number // 0-100
    label?: string
    showPercentage?: boolean
    variant?: 'primary' | 'success' | 'warning' | 'error'
}

export function ProgressBar({
    value,
    label,
    showPercentage = true,
    variant = 'primary'
}: ProgressBarProps) {
    return (
        <div className="progress-bar-container">
            {(label || showPercentage) && (
                <div className="progress-bar-header">
                    {label && <span className="progress-bar-label">{label}</span>}
                    {showPercentage && <span className="progress-bar-percentage">{Math.round(value)}%</span>}
                </div>
            )}
            <div className="progress-bar">
                <div
                    className={`progress-bar-fill progress-bar-fill--${variant}`}
                    style={{ width: `${value}%` }}
                >
                    <div className="progress-bar-glow"></div>
                </div>
            </div>
        </div>
    )
}
