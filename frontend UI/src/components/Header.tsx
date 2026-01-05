import { useEffect, useState } from 'react'

interface HeaderProps {
    isOnline?: boolean
}

export function Header({ isOnline = true }: HeaderProps) {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return (
        <header className="header">
            <div className="header-logo">
                <span className="logo-icon">⚡</span>
                <span className="logo-text">HOLOMAT</span>
                <span className="logo-version">v1.0</span>
            </div>
            <div className="header-time">
                <span className="time">{formatTime(time)}</span>
                <span className="separator">│</span>
                <span className="date">{formatDate(time)}</span>
            </div>
            <div className="header-status">
                <span className={`status-dot ${isOnline ? 'active' : ''}`}></span>
                <span className="status-text">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
        </header>
    )
}
