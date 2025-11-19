import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Agent as AgentType } from '../store'
import { Group } from 'three'

interface AgentProps {
  agent: AgentType
}

export const Agent = ({ agent }: AgentProps) => {
  const group = useRef<Group>(null)
  const animPhase = useRef(0) // Track animation phase independently
  
  // Animation refs
  const leftLeg = useRef<Group>(null)
  const rightLeg = useRef<Group>(null)
  const leftArm = useRef<Group>(null)
  const rightArm = useRef<Group>(null)

  useFrame((state, delta) => {
    if (!group.current) return

    // Simple walking animation based on time and speed
    if (agent.state === 'walking') {
       // Use actual velocity magnitude for animation speed
       const currentSpeed = Math.sqrt(agent.velocity[0]**2 + agent.velocity[2]**2)
       
       if (currentSpeed > 0.01) {
          // Update phase based on current speed
          animPhase.current += delta * currentSpeed * 5
          const t = animPhase.current
          
          if (leftLeg.current) leftLeg.current.rotation.x = Math.sin(t) * 0.5
          if (rightLeg.current) rightLeg.current.rotation.x = Math.sin(t + Math.PI) * 0.5
          
          if (leftArm.current) leftArm.current.rotation.x = Math.sin(t + Math.PI) * 0.3
          if (rightArm.current) rightArm.current.rotation.x = Math.sin(t) * 0.3
       } else {
          // Reset if stopped (slowly return to neutral)
          if (leftLeg.current) leftLeg.current.rotation.x *= 0.9
          if (rightLeg.current) rightLeg.current.rotation.x *= 0.9
          if (leftArm.current) leftArm.current.rotation.x *= 0.9
          if (rightArm.current) rightArm.current.rotation.x *= 0.9
       }
    } else {
       // Idle / Processing / Waiting
       // Breathe animation
       const t = state.clock.elapsedTime * 2
       if (leftArm.current) leftArm.current.rotation.x = Math.sin(t) * 0.05
       if (rightArm.current) rightArm.current.rotation.x = Math.sin(t) * 0.05
       
       // Reset legs
       if (leftLeg.current) leftLeg.current.rotation.x = 0
       if (rightLeg.current) rightLeg.current.rotation.x = 0
    }

    // Rotate agent to face velocity
    if (Math.abs(agent.velocity[0]) > 0.01 || Math.abs(agent.velocity[2]) > 0.01) {
       // Note: Store velocity is not currently updated per tick for direction, 
       // but we can infer from movement if needed. 
       // For now, let's look at the next path node or target if accessible, 
       // or just trust the position update logic to set rotation?
       // Actually, simpler: look at the target logic or just face "forward" (+Z) for now
       // In future: calculate angle from velocity vector
    }
  })
  
  return (
    <group ref={group} position={agent.position}>
      {/* Torso */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.4, 0.6, 0.2]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[0.25, 0.3, 0.25]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>

      {/* Arms */}
      <group ref={leftArm} position={[-0.25, 1.3, 0]}>
         <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.1, 0.6, 0.1]} />
            <meshStandardMaterial color={agent.color} />
         </mesh>
      </group>
      <group ref={rightArm} position={[0.25, 1.3, 0]}>
         <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.1, 0.6, 0.1]} />
            <meshStandardMaterial color={agent.color} />
         </mesh>
         {/* Baggage attached to right arm if exists */}
         {agent.hasBaggage && (
            <group position={[0.1, -0.6, 0]}> {/* Shifted outwards by 0.1 */}
               <mesh castShadow>
                  <boxGeometry args={[0.2, 0.5, 0.6]} /> {/* Increased size */}
                  <meshStandardMaterial color="#3E2723" roughness={0.8} /> {/* Dark brown color */}
               </mesh>
               {/* Handle */}
               <mesh position={[0, 0.27, 0]}>
                  <boxGeometry args={[0.05, 0.05, 0.2]} />
                  <meshStandardMaterial color="#111" />
               </mesh>
               {/* Wheels (decoration) */}
               <mesh position={[0, -0.25, 0.2]}>
                  <sphereGeometry args={[0.05]} />
                  <meshStandardMaterial color="black" />
               </mesh>
               <mesh position={[0, -0.25, -0.2]}>
                  <sphereGeometry args={[0.05]} />
                  <meshStandardMaterial color="black" />
               </mesh>
            </group>
         )}
      </group>

      {/* Legs */}
      <group ref={leftLeg} position={[-0.1, 0.8, 0]}>
         <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.15, 0.8, 0.15]} />
            <meshStandardMaterial color="#334" />
         </mesh>
      </group>
      <group ref={rightLeg} position={[0.1, 0.8, 0]}>
         <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.15, 0.8, 0.15]} />
            <meshStandardMaterial color="#334" />
         </mesh>
      </group>
    </group>
  )
}

