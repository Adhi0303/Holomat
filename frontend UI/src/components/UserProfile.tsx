interface UserProfileProps {
    userName: string
    role: string
    isAuthenticated: boolean
    authState?: 'idle' | 'scanning' | 'authenticated' | 'denied'
}

export function UserProfile({
    userName,
    role,
    isAuthenticated,
    authState = 'authenticated'
}: UserProfileProps) {
    return (
        <div className="panel-section user-profile">
            <h3 className="panel-title">USER PROFILE</h3>
            <div className="avatar-container">
                <div className={`avatar-ring ${authState === 'scanning' ? 'scanning' : ''}`}></div>
                <div className={`avatar-ring delay ${authState === 'scanning' ? 'scanning' : ''}`}></div>
                <div className="avatar">
                    <span>👤</span>
                </div>
            </div>
            <div className="user-info">
                {authState === 'scanning' ? (
                    <span className="auth-status scanning">⟳ SCANNING...</span>
                ) : authState === 'denied' ? (
                    <span className="auth-status denied">✗ ACCESS DENIED</span>
                ) : isAuthenticated ? (
                    <span className="auth-status authenticated">✓ AUTHENTICATED</span>
                ) : (
                    <span className="auth-status idle">○ AWAITING</span>
                )}
                <h2 className="user-name">{userName}</h2>
                <span className="user-role">{role}</span>
            </div>
        </div>
    )
}
