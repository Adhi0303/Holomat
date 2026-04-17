import { Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Float, Sparkles, useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../stores/appStore'

// ─── Hand Orbit Controls ─────────────────────────────────────────────────────
// Replaces mouse-driven OrbitControls when a grab (fist) gesture is detected.
// Tracks hand position delta and applies it as rotation to the camera orbit.

function HandOrbitControls() {
    const controlsRef = useRef<any>(null)
    const lastHandPos = useRef<{ x: number; y: number } | null>(null)
    const { camera } = useThree()

    // Sensitivity for hand → rotation mapping
    const rotSpeed = 0.008

    useFrame(() => {
        if (!controlsRef.current) return

        // Always get the freshest state without triggering React re-renders
        const handCursor = useAppStore.getState().handCursor

        if (handCursor.isGrabbing && handCursor.visible) {
            // Disable mouse orbit while hand is grabbing
            controlsRef.current.enabled = false

            if (lastHandPos.current) {
                const dx = handCursor.screenX - lastHandPos.current.x
                const dy = handCursor.screenY - lastHandPos.current.y

                // Only apply if there's actual significant movement
                if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                    // Apply delta as rotation (invert X for natural feel)
                    controlsRef.current.minAzimuthAngle = -Infinity
                    controlsRef.current.maxAzimuthAngle = Infinity

                    // Manually rotate by adjusting the spherical target
                    const spherical = new THREE.Spherical().setFromVector3(
                        camera.position.clone().sub(controlsRef.current.target)
                    )
                    spherical.theta -= dx * rotSpeed
                    spherical.phi   -= dy * rotSpeed

                    // Clamp polar angle
                    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))

                    const newPos = new THREE.Vector3().setFromSpherical(spherical).add(controlsRef.current.target)
                    camera.position.copy(newPos)
                    camera.lookAt(controlsRef.current.target)
                }
            }

            lastHandPos.current = { x: handCursor.screenX, y: handCursor.screenY }
        } else {
            // Re-enable mouse orbit when hand releases
            controlsRef.current.enabled = true
            lastHandPos.current = null
        }
    })

    return (
        <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={1}
            maxDistance={20}
            autoRotate={false}
            autoRotateSpeed={0.5}
        />
    )
}

// ─── Holographic Material ────────────────────────────────────────────────────

function HologramMaterial() {
    return (
        <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
            wireframe
            side={THREE.DoubleSide}
        />
    )
}

function GlowEdges({ geometry }: { geometry: THREE.BufferGeometry }) {
    return (
        <lineSegments>
            <edgesGeometry args={[geometry]} />
            <lineBasicMaterial color="#00f5ff" linewidth={2} transparent opacity={0.8} />
        </lineSegments>
    )
}

// ─── Models ──────────────────────────────────────────────────────────────────

function CubeModel() {
    const meshRef = useRef<THREE.Mesh>(null)
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
        }
    })
    const geometry = new THREE.BoxGeometry(2, 1.5, 1.5)
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group>
                <mesh ref={meshRef} geometry={geometry}>
                    <HologramMaterial />
                </mesh>
                <GlowEdges geometry={geometry} />
            </group>
        </Float>
    )
}

function SphereModel() {
    const meshRef = useRef<THREE.Mesh>(null)
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.2
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
        }
    })
    const geometry = new THREE.IcosahedronGeometry(1.2, 1)
    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
            <group>
                <mesh ref={meshRef} geometry={geometry}>
                    <HologramMaterial />
                </mesh>
                <GlowEdges geometry={geometry} />
            </group>
        </Float>
    )
}

function TorusModel() {
    const meshRef = useRef<THREE.Mesh>(null)
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.4
            meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
        }
    })
    const geometry = new THREE.TorusGeometry(1, 0.4, 16, 32)
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.4}>
            <group>
                <mesh ref={meshRef} geometry={geometry}>
                    <HologramMaterial />
                </mesh>
                <GlowEdges geometry={geometry} />
            </group>
        </Float>
    )
}

function ArcReactorModel() {
    const groupRef = useRef<THREE.Group>(null)
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.z = state.clock.elapsedTime * 0.5
        }
    })
    return (
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
            <group ref={groupRef}>
                <mesh>
                    <torusGeometry args={[1.5, 0.08, 16, 32]} />
                    <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.8} />
                </mesh>
                <mesh>
                    <torusGeometry args={[1.1, 0.06, 16, 32]} />
                    <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={0.6} />
                </mesh>
                <mesh>
                    <torusGeometry args={[0.7, 0.04, 16, 32]} />
                    <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.8} />
                </mesh>
                <mesh>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        emissive="#00f5ff"
                        emissiveIntensity={2}
                        transparent
                        opacity={0.9}
                    />
                </mesh>
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <mesh key={i} rotation={[0, 0, (angle * Math.PI) / 180]}>
                        <boxGeometry args={[0.05, 1.4, 0.02]} />
                        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.5} />
                    </mesh>
                ))}
            </group>
        </Float>
    )
}

function GridFloor() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[20, 20, 20, 20]} />
            <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.1} />
        </mesh>
    )
}

function ParticleField() {
    return (
        <Sparkles count={100} scale={8} size={2} speed={0.4} color="#00d4ff" opacity={0.5} />
    )
}

function CustomGLBModel({ url }: { url: string }) {
    const { scene } = useGLTF(url)
    const groupRef = useRef<THREE.Group>(null)
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
        }
    })
    return (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
            <primitive ref={groupRef} object={scene} scale={2} />
        </Float>
    )
}

// ─── Main Components ─────────────────────────────────────────────────────────

export type ModelType = 'cube' | 'sphere' | 'torus' | 'reactor' | string

interface HologramSceneProps {
    modelType?: ModelType
    showParticles?: boolean
    showGrid?: boolean
}

export function HologramScene({
    modelType = 'cube',
    showParticles = true,
    showGrid = true
}: HologramSceneProps) {
    const isCustomModel = modelType.startsWith('http') || modelType.startsWith('/static/')

    const renderModel = () => {
        if (isCustomModel) {
            return <CustomGLBModel url={modelType} />
        }
        switch (modelType) {
            case 'sphere':
                return <SphereModel />
            case 'torus':
                return <TorusModel />
            case 'reactor':
                return <ArcReactorModel />
            case 'cube':
            default:
                return <CubeModel />
        }
    }

    return (
        <Canvas
            camera={{ position: [0, 2, 5], fov: 50 }}
            style={{
                width: '100%',
                height: '100%',
                background: 'transparent'
            }}
            gl={{ alpha: true, antialias: true }}
        >
            <Suspense fallback={null}>
            {/* Lighting */}
            {!isCustomModel ? (
                <>
                    <ambientLight intensity={0.3} />
                    <pointLight position={[10, 10, 10]} intensity={0.5} color="#00d4ff" />
                    <pointLight position={[-10, -10, -10]} intensity={0.3} color="#00f5ff" />
                    <spotLight
                        position={[0, 5, 0]}
                        angle={0.5}
                        penumbra={1}
                        intensity={0.5}
                        color="#00d4ff"
                    />
                </>
            ) : (
                <>
                    <ambientLight intensity={1.5} color="#ffffff" />
                    <directionalLight position={[5, 10, 5]} intensity={2.0} color="#ffffff" />
                    <directionalLight position={[-5, 5, -5]} intensity={1.5} color="#ffffff" />
                </>
            )}

            {/* Model */}
            {renderModel()}

            {/* Environment (CRITICAL for PBR materials so they don't look black) */}
            {isCustomModel && <Environment preset="city" />}

            {/* Effects */}
            {showParticles && <ParticleField />}
            {showGrid && <GridFloor />}

            {/* Controls — Hand-aware orbit controls */}
            <HandOrbitControls />
            </Suspense>
        </Canvas>
    )
}

// Model selector component
interface ModelSelectorProps {
    currentModel: ModelType
    onSelect: (model: ModelType) => void
}

export function ModelSelector({ currentModel, onSelect }: ModelSelectorProps) {
    const models: { type: ModelType; label: string; icon: string }[] = [
        { type: 'cube', label: 'Cube', icon: '📦' },
        { type: 'sphere', label: 'Sphere', icon: '🔮' },
        { type: 'torus', label: 'Torus', icon: '⭕' },
        { type: 'reactor', label: 'Reactor', icon: '⚡' },
    ]

    return (
        <div className="model-selector">
            {models.map((model) => (
                <button
                    key={model.type}
                    className={`model-btn ${currentModel === model.type ? 'active' : ''}`}
                    onClick={() => onSelect(model.type)}
                    title={model.label}
                >
                    <span className="model-icon">{model.icon}</span>
                    <span className="model-label">{model.label}</span>
                </button>
            ))}
        </div>
    )
}
