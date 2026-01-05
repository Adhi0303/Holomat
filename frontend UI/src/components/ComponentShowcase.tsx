import { Panel, GlowButton, CircularMeter, StatusIndicator, ProgressBar } from './common'
import { SystemStats } from './SystemStats'
import './ComponentShowcase.css'

/**
 * Component showcase - demonstrates all reusable components
 * This can be used for testing or as a component library reference
 */
export function ComponentShowcase() {
    return (
        <div className="component-showcase">
            <h1 className="showcase-title">Holomat Component Library</h1>

            {/* Panels */}
            <section className="showcase-section">
                <h2 className="showcase-heading">Panels</h2>
                <div className="showcase-grid">
                    <Panel title="Basic Panel" icon="📦">
                        <p>This is a basic panel with title and icon.</p>
                    </Panel>
                    <Panel title="Information Panel" icon="ℹ️">
                        <p>Glassmorphism background with glowing border.</p>
                    </Panel>
                </div>
            </section>

            {/* Buttons */}
            <section className="showcase-section">
                <h2 className="showcase-heading">Buttons</h2>
                <div className="showcase-row">
                    <GlowButton>Primary Button</GlowButton>
                    <GlowButton variant="secondary">Secondary</GlowButton>
                    <GlowButton variant="danger">Danger</GlowButton>
                    <GlowButton icon="⚡">With Icon</GlowButton>
                    <GlowButton loading>Loading</GlowButton>
                    <GlowButton disabled>Disabled</GlowButton>
                </div>
            </section>

            {/* Circular Meters */}
            <section className="showcase-section">
                <h2 className="showcase-heading">Circular Meters</h2>
                <div className="showcase-row">
                    <CircularMeter value={45} label="CPU" />
                    <CircularMeter value={70} label="RAM" />
                    <CircularMeter value={85} label="TEMP" />
                    <CircularMeter value={100} label="MAX" />
                </div>
            </section>

            {/* Status Indicators */}
            <section className="showcase-section">
                <h2 className="showcase-heading">Status Indicators</h2>
                <div className="showcase-column">
                    <StatusIndicator status="active" label="Motion Sensor" pulsing />
                    <StatusIndicator status="inactive" label="Gesture Sensor" />
                    <StatusIndicator status="warning" label="Light Sensor" />
                    <StatusIndicator status="error" label="Camera Offline" />
                </div>
            </section>

            {/* Progress Bars */}
            <section className="showcase-section">
                <h2 className="showcase-heading">Progress Bars</h2>
                <div className="showcase-column" style={{ width: '100%', maxWidth: '500px' }}>
                    <ProgressBar value={35} label="CPU Usage" variant="success" />
                    <ProgressBar value={65} label="Memory" variant="warning" />
                    <ProgressBar value={85} label="Disk Space" variant="error" />
                    <ProgressBar value={50} />
                </div>
            </section>

            {/* System Stats */}
            <section className="showcase-section">
                <h2 className="showcase-heading">System Stats Component</h2>
                <Panel>
                    <SystemStats />
                </Panel>
            </section>
        </div>
    )
}
