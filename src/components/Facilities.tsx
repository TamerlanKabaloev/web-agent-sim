import { useSimulationStore } from '../store'

// Helper component for single generic Turnstile
export const SingleTurnstile = () => (
  <group>
    {/* Left Box */}
    <mesh position={[-0.4, 0.5, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.1, 1, 1]} />
      <meshStandardMaterial color="#silver" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Right Box */}
    <mesh position={[0.4, 0.5, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.1, 1, 1]} />
      <meshStandardMaterial color="#silver" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Gate Arms (Visual) */}
    <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.6, 0.05, 0.05]} />
        <meshStandardMaterial color="red" />
    </mesh>
    {/* Floor Plate */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[0.8, 1]} />
        <meshStandardMaterial color="#333" />
    </mesh>
  </group>
)

// Helper for Introscope
export const SingleIntroscope = () => (
  <group>
    {/* Machine Body */}
    <mesh position={[0.4, 0.75, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#444" />
    </mesh>
    {/* Belt */}
    <mesh position={[-0.3, 0.4, 0]} castShadow receiveShadow>
      <boxGeometry args={[1, 0.1, 2]} />
      <meshStandardMaterial color="#222" />
    </mesh>
      {/* Operator Screen */}
    <mesh position={[0.4, 1.2, 0.5]} rotation={[0, -0.5, 0]}>
      <boxGeometry args={[0.1, 0.3, 0.4]} />
      <meshStandardMaterial color="#88ccff" emissive="#0044aa" />
    </mesh>
  </group>
)

// Helper for Metal Detector (Frame)
export const SingleMetalDetector = () => (
  <group>
    {/* Left Pillar */}
    <mesh position={[-0.4, 1, 0]} castShadow>
      <boxGeometry args={[0.1, 2, 0.2]} />
      <meshStandardMaterial color="#555" />
    </mesh>
    {/* Right Pillar */}
    <mesh position={[0.4, 1, 0]} castShadow>
      <boxGeometry args={[0.1, 2, 0.2]} />
      <meshStandardMaterial color="#555" />
    </mesh>
    {/* Top */}
    <mesh position={[0, 1.95, 0]} castShadow>
      <boxGeometry args={[0.9, 0.1, 0.2]} />
      <meshStandardMaterial color="#555" />
    </mesh>
    {/* Light indicator */}
    <mesh position={[0, 1.9, 0]}>
       <cylinderGeometry args={[0.02, 0.02, 0.1]} rotation={[Math.PI/2, 0, 0]} />
       <meshBasicMaterial color="green" />
    </mesh>
  </group>
)

export const Turnstiles = () => {
  const width = useSimulationStore(state => state.tunnelWidth)
  const count = useSimulationStore(state => state.gateCount)
  const spacing = width / (count + 1)

  return (
    <group position={[0, 0, 0]}>
      {Array.from({ length: count }).map((_, i) => {
        const x = -width/2 + spacing * (i + 1)
        return (
          <group key={i} position={[x, 0, 0]}>
             <SingleTurnstile />
          </group>
        )
      })}
    </group>
  )
}

export const Introscopes = () => {
  const width = useSimulationStore(state => state.tunnelWidth)
  const count = useSimulationStore(state => state.gateCount)
  const spacing = width / (count + 1)

  return (
    <group position={[0, 0, 0]}>
      {Array.from({ length: count }).map((_, i) => {
        const x = -width/2 + spacing * (i + 1)
        return (
          <group key={i} position={[x, 0, 0]}>
            <SingleIntroscope />
          </group>
        )
      })}
    </group>
  )
}

export const Escalator = () => {
  const width = useSimulationStore(state => state.tunnelWidth)
  const length = useSimulationStore(state => state.tunnelLength)
  const height = useSimulationStore(state => state.escalatorHeight)
  const direction = useSimulationStore(state => state.escalatorDirection)
  
  // Calculate slope angle
  const angle = Math.atan2(height, length)
  const hypotenuse = Math.sqrt(length * length + height * height)
  
  // Position offset: The center of the rotated plane needs to be shifted up by height/2
  const yOffset = height / 2
  // Rotation direction depends on Escalator direction? 
  // Actually geometry is same, just agent movement changes. 
  // But visual representation of UP vs DOWN could imply steps texture direction, but simplified here.
  // We rotate around X axis. +Angle tilts it up towards +Z.
  
  // If UP: Start (Z negative) is low, End (Z positive) is high. This is positive rotation around X? 
  // Standard plane lies on XZ. Rotate -Math.PI/2 to face up.
  // Then rotate by 'angle' around X.
  
  // Let's group it and rotate the group.
  // The pivot is the center [0, 0, 0] which is at Z=0, Y=0.
  // But our tunnel goes from -L/2 to L/2.
  // If we rotate around center, -L/2 goes down, L/2 goes up.
  // So we need to shift it up so start is at 0.
  // Start (-L/2) should be at Y=0 (for UP) or Y=H (for DOWN)?
  // Visual representation: always slope up from -Z to +Z.
  // Agents decide if they walk UP or DOWN that slope.
  
  return (
    <group>
      <group position={[0, height/2, 0]} rotation={[angle, 0, 0]}>
         {/* Base */}
         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
            <boxGeometry args={[width, hypotenuse, 0.2]} />
            <meshStandardMaterial color="#222" />
         </mesh>
         
         {/* Steps Surface */}
         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[width * 0.8, hypotenuse]} />
            <meshStandardMaterial color="#333" />
         </mesh>
         
         {/* Handrails */}
         <mesh position={[-width * 0.4, 0.8, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.1, 0.1, hypotenuse]} />
            <meshStandardMaterial color="black" />
         </mesh>
         <mesh position={[width * 0.4, 0.8, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.1, 0.1, hypotenuse]} />
            <meshStandardMaterial color="black" />
         </mesh>
         
         {/* Glass Panels */}
         <mesh position={[-width * 0.4, 0.4, 0]}>
            <boxGeometry args={[0.02, 0.8, hypotenuse]} />
            <meshStandardMaterial color="cyan" transparent opacity={0.3} />
         </mesh>
         <mesh position={[width * 0.4, 0.4, 0]}>
            <boxGeometry args={[0.02, 0.8, hypotenuse]} />
            <meshStandardMaterial color="cyan" transparent opacity={0.3} />
         </mesh>
         
         {/* Direction Indicator (Arrow) */}
         <group position={[0, 2, 0]} rotation={[-angle, 0, 0]}> 
            {/* Counter-rotate to keep text/arrow upright-ish relative to world? No, keep relative to slope */}
         </group>
      </group>
      
      {/* Approach Floor for Escalator */}
      <group position={[0, 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -length / 2 - 10]} receiveShadow>
             <planeGeometry args={[width * 1.2, 20]} />
             <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0, 0.01, -length / 2 - 20]} rotation={[-Math.PI / 2, 0, 0]}>
             <planeGeometry args={[width, 0.5]} />
             <meshBasicMaterial color="yellow" transparent opacity={0.5} />
          </mesh>
          
          {/* Upper floor if going DOWN */}
          {direction === 'DOWN' && (
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height - 0.01, -length / 2 - 10]} receiveShadow>
                <planeGeometry args={[width * 1.2, 20]} />
                <meshStandardMaterial color="#333" />
             </mesh>
          )}
      </group>
    </group>
  )
}

