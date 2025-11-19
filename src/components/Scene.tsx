import { useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useSimulationStore, BuildObject } from '../store'
import { Agent } from './Agent'
import { Tunnel } from './Tunnel'
import { Facilities } from './Facilities'
import { v4 as uuidv4 } from 'uuid'

export const Scene = () => {
  const { 
    agents, 
    mode, 
    buildTool, 
    addCustomObject, 
    removeCustomObject, 
    customObjects,
    currentLevel,
    tick 
  } = useSimulationStore()

  const { camera } = useThree()
  const [hoverPos, setHoverPos] = useState<[number, number, number] | null>(null)

  // Simulation Loop
  useFrame((state, delta) => {
     tick(delta)
  })

  // Builder Interactions
  const handlePointerMove = (e: any) => {
    if (mode !== 'BUILDER') return
    // Raycast intersection point
    if (e.point) {
       // Snap to grid (0.5m)
       const x = Math.round(e.point.x * 2) / 2
       const z = Math.round(e.point.z * 2) / 2
       setHoverPos([x, 0, z])
    }
  }

  const handleClick = (e: any) => {
    if (mode !== 'BUILDER' || !hoverPos) return
    e.stopPropagation()

    if (buildTool === 'ERASER') {
       // Find object at hoverPos (simple collision check)
       const obj = customObjects.find(o => 
          o.level === currentLevel &&
          Math.abs(o.position[0] - hoverPos[0]) < 0.5 &&
          Math.abs(o.position[2] - hoverPos[2]) < 0.5
       )
       if (obj) removeCustomObject(obj.id)
    } else if (buildTool !== 'NONE') {
       // Add object
       const scale = getScaleForTool(buildTool)
       const newObj: BuildObject = {
          id: uuidv4(),
          type: buildTool as any,
          position: hoverPos,
          scale: scale,
          rotation: 0,
          level: currentLevel
       }
       addCustomObject(newObj)
    }
  }

  const getScaleForTool = (tool: string): [number, number, number] => {
     switch(tool) {
        case 'WALL': return [1, 2, 1]
        case 'DOOR': return [1.2, 2.2, 0.2]
        case 'TURNSTILE': return [0.8, 1.1, 1] // Wider for agent to pass through visually
        case 'INTRO_SCOPE': return [1, 1.5, 2]
        case 'METAL_DETECTOR': return [1.2, 2.2, 0.5]
        case 'STAIRS': return [2, 2.5, 4]
        case 'PLATFORM': return [10, 0.5, 4]
        case 'TUNNEL': return [4, 3, 4]
        case 'SPAWNER': return [1, 0.1, 1]
        case 'TARGET': return [1, 0.1, 1]
        default: return [1, 1, 1]
     }
  }

  return (
    <group onPointerMove={handlePointerMove} onClick={handleClick}>
      <gridHelper args={[100, 100]} position={[0, -0.01, 0]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* Legacy Modes Environment */}
      {mode !== 'BUILDER' && (
         <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
               <planeGeometry args={[100, 100]} />
               <meshStandardMaterial color="#333" />
            </mesh>
            <Tunnel />
            <Facilities />
         </>
      )}

      {/* Builder Mode Environment */}
      {mode === 'BUILDER' && (
         <>
             <mesh rotation={[-Math.PI / 2, 0, 0]} visible={false}>
               <planeGeometry args={[100, 100]} />
               <meshBasicMaterial visible={false} />
            </mesh>
            
            {/* Ghost Object */}
            {hoverPos && buildTool !== 'NONE' && buildTool !== 'ERASER' && (
               <mesh position={hoverPos}>
                  <boxGeometry args={getScaleForTool(buildTool)} />
                  <meshBasicMaterial color="#00ff00" wireframe opacity={0.5} transparent />
               </mesh>
            )}

            {/* Custom Objects */}
            {customObjects.map(obj => {
                const isCurrentLevel = obj.level === currentLevel
                const opacity = isCurrentLevel ? 1 : 0.1
                const transparent = !isCurrentLevel
                
                return (
                <group key={obj.id} position={obj.position} rotation={[0, obj.rotation, 0]}>
                   {obj.type === 'WALL' && (
                      <mesh position={[0, 1, 0]}>
                         <boxGeometry args={obj.scale} />
                         <meshStandardMaterial color="#888" transparent={transparent} opacity={opacity} />
                      </mesh>
                   )}
                   {obj.type === 'DOOR' && (
                      <group>
                         <mesh position={[0, 1.1, 0]}>
                            <boxGeometry args={[obj.scale[0], 2.2, 0.1]} />
                            <meshStandardMaterial color="#555" transparent={transparent} opacity={opacity} />
                         </mesh>
                         <mesh position={[0.2, 1.1, 0]}>
                            <boxGeometry args={[obj.scale[0]*0.8, 2, 0.05]} />
                            <meshStandardMaterial color="#8d6e63" transparent={transparent} opacity={opacity} />
                         </mesh>
                      </group>
                   )}
                   {obj.type === 'TURNSTILE' && (
                      <group>
                         <mesh position={[-0.4, 0.5, 0]}>
                            <boxGeometry args={[0.1, 1, 1]} />
                            <meshStandardMaterial color="#aaa" transparent={transparent} opacity={opacity} />
                         </mesh>
                         <mesh position={[0.4, 0.5, 0]}>
                            <boxGeometry args={[0.1, 1, 1]} />
                            <meshStandardMaterial color="#aaa" transparent={transparent} opacity={opacity} />
                         </mesh>
                         {isCurrentLevel && <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI/4]}>
                            <boxGeometry args={[0.6, 0.05, 0.05]} />
                            <meshStandardMaterial color="red" />
                         </mesh>}
                      </group>
                   )}
                   {obj.type === 'INTRO_SCOPE' && (
                      <mesh position={[0, 0.75, 0]}>
                         <boxGeometry args={obj.scale} />
                         <meshStandardMaterial color="#555" transparent={transparent} opacity={opacity} />
                         <mesh position={[0, 0.2, 0]}>
                            <boxGeometry args={[obj.scale[0]*0.8, 0.5, obj.scale[2]]} />
                            <meshStandardMaterial color="#333" />
                         </mesh>
                      </mesh>
                   )}
                   {obj.type === 'METAL_DETECTOR' && (
                      <group>
                         <mesh position={[-0.5, 1.1, 0]}>
                            <boxGeometry args={[0.1, 2.2, 0.5]} />
                            <meshStandardMaterial color="#444" transparent={transparent} opacity={opacity} />
                         </mesh>
                         <mesh position={[0.5, 1.1, 0]}>
                            <boxGeometry args={[0.1, 2.2, 0.5]} />
                            <meshStandardMaterial color="#444" transparent={transparent} opacity={opacity} />
                         </mesh>
                         <mesh position={[0, 2.1, 0]}>
                            <boxGeometry args={[1.1, 0.1, 0.5]} />
                            <meshStandardMaterial color="#444" transparent={transparent} opacity={opacity} />
                         </mesh>
                      </group>
                   )}
                   
                   {(obj.type === 'SPAWNER' || obj.type === 'TARGET') && isCurrentLevel && (
                      <mesh position={[0, 0.1, 0]}>
                         <cylinderGeometry args={[0.5, 0.5, 0.2]} />
                         <meshStandardMaterial color={obj.type === 'SPAWNER' ? 'green' : 'red'} opacity={0.5} transparent />
                      </mesh>
                   )}
                </group>
            )})}
         </>
      )}

      {/* Agents */}
      {agents.map(agent => (
        <Agent key={agent.id} agent={agent} />
      ))}
    </group>
  )
}
