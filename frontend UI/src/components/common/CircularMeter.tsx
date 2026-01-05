import './CircularMeter.css'

interface CircularMeterProps {
    value: number // 0-100
    size?: number
    label?: string
    showPercentage?: boolean
}

export function CircularMeter({
    value,
    size = 120,
    label,
    showPercentage = true
}: CircularMeterProps) {
    const radius = 45
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (value / 100) * circumference

    // Color based on value
    const getColor = () => {
        if (value >= 80) return '#ff5050' // Red
        if (value >= 60) return '#ffaa00' // Yellow
        return '#00ff88' // Green
    }

    return (
        <div className="circular-meter" style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100">
                {/* Background ring */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="rgba(0, 212, 255, 0.1)"
                    strokeWidth="6"
                />

                {/* Inner decorative ring */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius - 10}
                    fill="none"
                    stroke="rgba(0, 212, 255, 0.05)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                />

                {/* Progress ring */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={getColor()}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 50 50)"
                    className="circular-meter__progress"
                    style={{
                        filter: `drop-shadow(0 0 8px ${getColor()})`
                    }}
                />
            </svg>

            <div className="circular-meter__content">
                {showPercentage && (
                    <div className="circular-meter__value" style={{ color: getColor() }}>
                        {Math.round(value)}%
                    </div>
                )}
                {label && (
                    <div className="circular-meter__label">{label}</div>
                )}
            </div>
        </div>
    )
}
