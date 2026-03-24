/**
 * SystemInfoPanel — Zone 1 (Left)
 * Clock, CPU, RAM, Temp, Memory stats in eDEX terminal style
 */   
import { useState, useEffect } from 'react'
import { Cpu, MemoryStick, Thermometer, HardDrive, Activity } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

export function SystemInfoPanel() {
  const { systemStats } = useAppStore()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = () =>
    time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const formatDate = () =>
    time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()

  return (
    <div className="zone zone--sysinfo">
      <div className="zone-header">
        <span className="zone-dot" />
        <span>system</span>
      </div>
      <div className="zone-body">
        {/* Clock */}
        <div className="sysinfo-clock">
          <span className="sysinfo-time">{formatTime()}</span>
          <span className="sysinfo-date">{formatDate()}</span>
        </div>

        {/* Stats */}
        <div className="sysinfo-stats">
          <StatBar icon={<Cpu size={14} />} label="CPU" value={systemStats.cpu} />
          <StatBar icon={<MemoryStick size={14} />} label="RAM" value={systemStats.ram} />
          <StatBar icon={<Thermometer size={14} />} label="TEMP" value={systemStats.temp} suffix="°C" max={100} />
          <StatBar icon={<HardDrive size={14} />} label="DISK" value={65} />
        </div>

        {/* Top Processes (mock) */}
        <div className="sysinfo-processes">
          <div className="sysinfo-section-title">
            <Activity size={12} />
            <span>TOP PROCESSES</span>
          </div>
          <div className="process-list">
            <ProcessRow name="holomat-ui" cpu={12.3} mem={4.1} />
            <ProcessRow name="node" cpu={8.7} mem={3.2} />
            <ProcessRow name="uvicorn" cpu={5.4} mem={2.8} />
            <ProcessRow name="python" cpu={3.1} mem={1.4} />
            <ProcessRow name="chrome" cpu={2.0} mem={1.8} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBar({ icon, label, value, suffix = '%', max = 100 }: {
  icon: React.ReactNode; label: string; value: number; suffix?: string; max?: number
}) {
  const pct = Math.min((value / max) * 100, 100)
  const color = pct > 80 ? 'var(--color-error)' : pct > 60 ? 'var(--color-warning)' : 'var(--color-primary)'

  return (
    <div className="stat-bar-row">
      <div className="stat-bar-label">
        {icon}
        <span>{label}</span>
      </div>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="stat-bar-value" style={{ color }}>{value}{suffix}</span>
    </div>
  )
}

function ProcessRow({ name, cpu, mem }: { name: string; cpu: number; mem: number }) {
  return (
    <div className="process-row">
      <span className="process-name">{name}</span>
      <span className="process-cpu">{cpu.toFixed(1)}%</span>
      <span className="process-mem">{mem.toFixed(1)}%</span>
    </div>
  )
}
