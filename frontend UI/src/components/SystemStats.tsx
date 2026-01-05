import { useAppStore } from '../stores/appStore'
import { CircularMeter, ProgressBar } from './common'
import './SystemStats.css'

export function SystemStats() {
    const { systemStats } = useAppStore()

    return (
        <div className="system-stats">
            <div className="system-stats__metrics">
                {/* CPU Usage */}
                <div className="system-stats__metric">
                    <CircularMeter
                        value={systemStats.cpu}
                        size={80}
                        label="CPU"
                    />
                </div>

                {/* RAM Usage */}
                <div className="system-stats__metric">
                    <CircularMeter
                        value={systemStats.ram}
                        size={80}
                        label="RAM"
                    />
                </div>

                {/* Temperature */}
                <div className="system-stats__metric">
                    <CircularMeter
                        value={systemStats.temp}
                        size={80}
                        label="TEMP"
                    />
                </div>
            </div>

            <div className="system-stats__bars">
                <ProgressBar
                    value={systemStats.cpu}
                    label="CPU Usage"
                    variant={systemStats.cpu > 80 ? 'error' : systemStats.cpu > 60 ? 'warning' : 'success'}
                />
                <ProgressBar
                    value={systemStats.ram}
                    label="Memory"
                    variant={systemStats.ram > 80 ? 'error' : systemStats.ram > 60 ? 'warning' : 'success'}
                />
                <ProgressBar
                    value={systemStats.temp}
                    label="Temperature"
                    variant={systemStats.temp > 80 ? 'error' : systemStats.temp > 60 ? 'warning' : 'success'}
                />
            </div>
        </div>
    )
}
