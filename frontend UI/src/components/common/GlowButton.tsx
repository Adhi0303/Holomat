import { ReactNode, ButtonHTMLAttributes } from 'react'
import './GlowButton.css'

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: ReactNode
    loading?: boolean
    variant?: 'primary' | 'secondary' | 'danger'
}

export function GlowButton({
    icon,
    loading = false,
    variant = 'primary',
    children,
    className = '',
    disabled,
    ...props
}: GlowButtonProps) {
    return (
        <button
            className={`glow-button glow-button--${variant} ${loading ? 'loading' : ''} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            <span className="glow-button__content">
                {icon && <span className="glow-button__icon">{icon}</span>}
                {loading ? (
                    <span className="glow-button__spinner"></span>
                ) : (
                    <span className="glow-button__text">{children}</span>
                )}
            </span>
            <span className="glow-button__ripple"></span>
        </button>
    )
}
