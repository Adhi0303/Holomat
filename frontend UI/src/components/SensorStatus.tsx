export interface Sensor {
    id: string
    name: string
    value: string | number
    status: 'active' | 'ready' | 'idle' | 'error'
}

interface SensorStatusProps {
    sensors: Sensor[]
}

export function SensorStatus({ sensors }: SensorStatusProps) {
    return (
        <div className="panel-section sensor-status">
            <h3 className="panel-title">SENSOR STATUS</h3>
            <ul className="sensor-list">
                {sensors.map((sensor) => (
                    <li key={sensor.id} className="sensor-item">
                        <span className={`sensor-dot ${sensor.status}`}></span>
                        <span className="sensor-name">{sensor.name}</span>
                        <span className="sensor-value">{sensor.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

// Default sensors for initial state
export const defaultSensors: Sensor[] = [
    { id: 'motion', name: 'Motion', value: 'ACTIVE', status: 'active' },
    { id: 'light', name: 'Light', value: '65%', status: 'active' },
    { id: 'gesture', name: 'Gesture', value: 'READY', status: 'ready' },
    { id: 'camera', name: 'Camera', value: 'ON', status: 'active' },
    { id: 'jarvis', name: 'Jarvis', value: 'IDLE', status: 'idle' },
]
