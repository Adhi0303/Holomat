import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

// Holographic material with glow effect
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

// Glowing edges effect
function GlowEdges({ geometry }: { geometry: THREE.BufferGeometry }) {
    return (
        <lineSegments>
            <edgesGeometry args={[geometry]} />
            <lineBasicMaterial color="#00f5ff" linewidth={2} transparent opacity={0.8} />
        </lineSegments>
    )
}

// Rotating cube model
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

// Rotating sphere model
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

// Rotating torus model
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

// Arc Reactor inspired model
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
                {/* Outer ring */}
                <mesh>
                    <torusGeometry args={[1.5, 0.08, 16, 32]} />
                    <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.8} />
                </mesh>
                {/* Middle ring */}
                <mesh>
                    <torusGeometry args={[1.1, 0.06, 16, 32]} />
                    <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={0.6} />
                </mesh>
                {/* Inner ring */}
                <mesh>
                    <torusGeometry args={[0.7, 0.04, 16, 32]} />
                    <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.8} />
                </mesh>
                {/* Core */}
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
                {/* Spokes */}
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

// Grid floor
function GridFloor() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[20, 20, 20, 20]} />
            <meshBasicMaterial
                color="#00d4ff"
                wireframe
                transparent
                opacity={0.1}
            />
        </mesh>
    )
}

// Particle effects
function ParticleField() {
    return (
        <Sparkles
            count={100}
            scale={8}
            size={2}
            speed={0.4}
            color="#00d4ff"
            opacity={0.5}
        />
    )
}

// Model type
export type ModelType = 'cube' | 'sphere' | 'torus' | 'reactor'

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
    const renderModel = () => {
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
            {/* Lighting */}
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

            {/* Model */}
            {renderModel()}

            {/* Effects */}
            {showParticles && <ParticleField />}
            {showGrid && <GridFloor />}

            {/* Controls */}
            <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={3}
                maxDistance={10}
                autoRotate={false}
                autoRotateSpeed={0.5}
            />
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
