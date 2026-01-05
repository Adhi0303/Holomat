import { motion } from 'framer-motion'

interface StandbyScreenProps {
    onActivate: () => void
}

export function StandbyScreen({ onActivate }: StandbyScreenProps) {
    return (
        <motion.div
            className="screen standby-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={onActivate}
        >
            <div className="standby-content">
                {/* Scanning rings */}
                <div className="scan-rings">
                    <div className="scan-ring ring-1"></div>
                    <div className="scan-ring ring-2"></div>
                    <div className="scan-ring ring-3"></div>
                    <div className="scan-ring ring-4"></div>
                </div>

                {/* Center icon */}
                <div className="standby-icon">
                    <svg viewBox="0 0 100 100" className="face-icon">
                        <circle cx="50" cy="35" r="20" fill="none" stroke="currentColor" strokeWidth="2" />
                        <path d="M20 85 Q20 55 50 55 Q80 55 80 85" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                </div>

                {/* Text */}
                <motion.h1
                    className="standby-title"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    SYSTEM IN STANDBY
                </motion.h1>

                <p className="standby-subtitle">
                    Approach to activate facial recognition
                </p>

                <motion.div
                    className="activate-hint"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <span>Click anywhere to simulate approach</span>
                    <span className="arrow">↓</span>
                </motion.div>
            </div>

            {/* Decorative elements */}
            <div className="standby-decoration left"></div>
            <div className="standby-decoration right"></div>
        </motion.div>
    )
}
