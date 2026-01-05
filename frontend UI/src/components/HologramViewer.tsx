interface HologramViewerProps {
    modelName?: string
    onPrev?: () => void
    onNext?: () => void
    onRotate?: () => void
}

export function HologramViewer({
    modelName = '3D HOLOGRAM VIEWER',
    onPrev,
    onNext,
    onRotate
}: HologramViewerProps) {
    return (
        <section className="panel center-panel">
            <div className="hologram-container">
                <div className="hologram-hud">
                    <div className="hud-corner top-left"></div>
                    <div className="hud-corner top-right"></div>
                    <div className="hud-corner bottom-left"></div>
                    <div className="hud-corner bottom-right"></div>
                    <div className="hud-ring outer"></div>
                    <div className="hud-ring inner"></div>
                </div>
                <div className="hologram-content">
                    <div className="placeholder-3d">
                        <div className="cube">
                            <div className="cube-face front"></div>
                            <div className="cube-face back"></div>
                            <div className="cube-face right"></div>
                            <div className="cube-face left"></div>
                            <div className="cube-face top"></div>
                            <div className="cube-face bottom"></div>
                        </div>
                    </div>
                    <p className="hologram-label">{modelName}</p>
                </div>
            </div>
            <div className="hologram-controls">
                <button className="control-btn" onClick={onPrev}>◀ PREV</button>
                <button className="control-btn primary" onClick={onRotate}>⟳ ROTATE</button>
                <button className="control-btn" onClick={onNext}>NEXT ▶</button>
            </div>
        </section>
    )
}
