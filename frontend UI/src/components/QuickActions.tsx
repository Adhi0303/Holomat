interface QuickAction {
    id: string
    icon: string
    label: string
    isActive?: boolean
    onClick?: () => void
}

interface QuickActionsProps {
    actions?: QuickAction[]
}

const defaultActions: QuickAction[] = [
    { id: 'jarvis', icon: '🎤', label: 'JARVIS', isActive: true },
    { id: 'stats', icon: '📊', label: 'STATS' },
    { id: 'settings', icon: '⚙️', label: 'SETTINGS' },
]

export function QuickActions({ actions = defaultActions }: QuickActionsProps) {
    return (
        <div className="panel-section quick-actions">
            <h3 className="panel-title">QUICK ACTIONS</h3>
            <div className="action-buttons">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        className={`action-btn ${action.isActive ? 'jarvis' : ''}`}
                        onClick={action.onClick}
                    >
                        <span className="action-icon">{action.icon}</span>
                        <span className="action-label">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
