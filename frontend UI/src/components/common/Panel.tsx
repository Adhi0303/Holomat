import { ReactNode } from 'react'
import './Panel.css'

interface PanelProps {
    title?: string
    icon?: ReactNode
    children: ReactNode
    className?: string
}

export function Panel({ title, icon, children, className = '' }: PanelProps) {
    return (
        <div className={`panel ${className}`}>
            {title && (
                <div className="panel-header">
                    {icon && <span className="panel-icon">{icon}</span>}
                    <h3 className="panel-title">{title}</h3>
                </div>
            )}
            <div className="panel-content">
                {children}
            </div>
        </div>
    )
}
