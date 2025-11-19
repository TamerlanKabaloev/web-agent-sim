import { useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useSimulationStore, BuildTool } from '../store'
import { Tunnel } from './Tunnel'
import { Turnstiles, Introscopes, Escalator } from './Facilities'
import { Agent } from './Agent'

export const Scene = () => {
  const { 
    mode, agents, buildTool, addCustomObject, customObjects, removeCustomObject,
    tunnelWidth, tunnelLength, currentLevel 
  } = useSimulationStore()
  
  const { camera, raycaster, pointer, scene } = useThree()
  const [hoverPos, setHoverPos] = useState<[number, number, number] | null>(null)

  useFrame((state, delta) => {
    useSimulationStore.getState().tick(delta)
  })

  const getScaleForTool = (tool: string) => {
     switch(tool) {
        case 'WALL': return [2, 2, 0.5]
        case 'DOOR': return [1.2, 2.2, 0.2]
        case 'TURNSTILE': return [0.8, 1, 1]
        case 'INTRO_SCOPE': return [1, 1.5, 2]
        case 'METAL_DETECTOR': return [1, 2.2, 0.5]
        case 'STAIRS': return [2, 2.5, 4] // Ramp
        case 'PLATFORM': return [4, 0.5, 10]
        case 'TUNNEL': return [3, 2.5, 6]
        default: return [1, 0.5, 1]
     }
  }

  const handlePointerMove = () => {
    if (mode !== 'BUILDER') return
    // Raycast to floor
    raycaster.setFromCamera(pointer, camera)
    
    // Create a virtual plane for the current level
    const levelY = (currentLevel - 1) * 5
    const planeNormal = { x: 0, y: 1, z: 0 }
    const planeConstant = -levelY // Plane equation: y = levelY
    
    // Manual ray-plane intersection since invisible planes are annoying in Three.js raycaster
    // Or simpler: intersect the visible floor and offset y?
    // Let's intersect scene objects. We added a clickable floor at Y=levelY? No, updated below.
    
    const intersects = raycaster.intersectObjects(scene.children, true)
    const floorHit = intersects.find(i => i.object.name === 'builder-floor')
    
    if (floorHit) {
       // Snap to grid (0.5m)
       const x = Math.round(floorHit.point.x * 2) / 2
       const z = Math.round(floorHit.point.z * 2) / 2
       // Y is based on current level
       setHoverPos([x, levelY, z])
    } else {
       setHoverPos(null)
    }
  }

  const handleClick = () => {
    if (mode !== 'BUILDER' || !hoverPos) return
    
    if (buildTool === 'ERASER') {
       // Find object close to click AND on current level
       const hitObj = customObjects.find(o => {
          if (o.level !== currentLevel) return false
          const dx = o.position[0] - hoverPos[0]
          const dz = o.position[2] - hoverPos[2]
          return Math.sqrt(dx*dx + dz*dz) < 1.0
       })
       if (hitObj) removeCustomObject(hitObj.id)
       return
    }

    if (buildTool === 'NONE') return

    // Create Object
    addCustomObject({
       id: crypto.randomUUID(),
       type: buildTool as any,
       position: hoverPos,
       rotation: 0,
       scale: getScaleForTool(buildTool),
       level: currentLevel
    })
  }

  return (
    <group onPointerMove={handlePointerMove} onClick={handleClick}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      
      {/* Builder Floor (Clickable) - Adjust position based on level */}
      {mode === 'BUILDER' && (
         <mesh 
            name="builder-floor" 
            rotation={[-Math.PI/2, 0, 0]} 
            position={[0, (currentLevel - 1) * 5 - 0.01, 0]} // Move floor up/down
         >
            <planeGeometry args={[60, 60]} />
            <meshStandardMaterial color="#222" transparent opacity={0.8} />
         </mesh>
      )}
      {/* Grid helper also moves */}
      <gridHelper args={[60, 60, '#444', '#222']} position={[0, (currentLevel - 1) * 5, 0]} />

      {/* Ghost Preview */}
      {mode === 'BUILDER' && hoverPos && buildTool !== 'NONE' && buildTool !== 'ERASER' && (
         <mesh position={hoverPos}>
            <boxGeometry args={getScaleForTool(buildTool)} />
            <meshBasicMaterial color="white" transparent opacity={0.5} />
         </mesh>
      )}

      {/* Render Custom Objects */}
      {customObjects.map(obj => {
         // Opacity for other levels
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
                     <boxGeometry args={[obj.scale[0], 2.2, 0.1]} /> {/* Frame */}
                     <meshStandardMaterial color="#555" transparent={transparent} opacity={opacity} />
                  </mesh>
                  <mesh position={[0.2, 1.1, 0]}>
                     <boxGeometry args={[obj.scale[0]*0.8, 2, 0.05]} /> {/* Panel */}
                     <meshStandardMaterial color="#8d6e63" transparent={transparent} opacity={opacity} />
                  </mesh>
               </group>
            )}
            {obj.type === 'TURNSTILE' && (
               <group>
                  <mesh position={[-0.3, 0.5, 0]}>
                     <boxGeometry args={[0.1, 1, 0.8]} />
                     <meshStandardMaterial color="silver" transparent={transparent} opacity={opacity} />
                  </mesh>
                  <mesh position={[0.3, 0.5, 0]}>
                     <boxGeometry args={[0.1, 1, 0.8]} />
                     <meshStandardMaterial color="silver" transparent={transparent} opacity={opacity} />
                  </mesh>
                  {/* Arms */}
                  <mesh position={[0, 0.5, 0]}>
                     <boxGeometry args={[0.5, 0.05, 0.05]} />
                     <meshStandardMaterial color="red" transparent={transparent} opacity={opacity} />
                  </mesh>
               </group>
            )}
            {obj.type === 'INTRO_SCOPE' && (
               <group>
                  <mesh position={[0, 0.75, 0]}>
                     <boxGeometry args={[0.8, 1.5, 2]} />
                     <meshStandardMaterial color="#444" transparent={transparent} opacity={opacity} />
                  </mesh>
                  <mesh position={[0, 0.4, 0]}>
                     <boxGeometry args={[1, 0.1, 2.2]} />
                     <meshStandardMaterial color="#222" transparent={transparent} opacity={opacity} />
                  </mesh>
               </group>
            )}
            {obj.type === 'METAL_DETECTOR' && (
               <group>
                  <mesh position={[-0.4, 1.1, 0]}>
                     <boxGeometry args={[0.1, 2.2, 0.2]} />
                     <meshStandardMaterial color="#555" transparent={transparent} opacity={opacity} />
                  </mesh>
                  <mesh position={[0.4, 1.1, 0]}>
                     <boxGeometry args={[0.1, 2.2, 0.2]} />
                     <meshStandardMaterial color="#555" transparent={transparent} opacity={opacity} />
                  </mesh>
                  <mesh position={[0, 2.1, 0]}>
                     <boxGeometry args={[0.9, 0.2, 0.2]} />
                     <meshStandardMaterial color="#555" transparent={transparent} opacity={opacity} />
                  </mesh>
               </group>
            )}
            {obj.type === 'STAIRS' && (
               <group>
                  {/* Ramp representation */}
                  <mesh position={[0, 1.25, 0]} rotation={[Math.atan2(2.5, 4), 0, 0]}>
                     <boxGeometry args={[2, 4.5, 0.2]} />
                     <meshStandardMaterial color="#666" transparent={transparent} opacity={opacity} />
                  </mesh>
               </group>
            )}
            {obj.type === 'PLATFORM' && (
               <mesh position={[0, 0.25, 0]}>
                  <boxGeometry args={obj.scale} />
                  <meshStandardMaterial color="#777" transparent={transparent} opacity={opacity} />
               </mesh>
            )}
            {obj.type === 'TUNNEL' && (
               <mesh position={[0, 1.25, 0]}>
                  <cylinderGeometry args={[1.5, 1.5, 6, 16, 1, true]} />
                  <meshStandardMaterial color="#333" side={2} transparent={transparent} opacity={opacity} />
               </mesh>
            )}
            {obj.type === 'SPAWNER' && (
               <mesh position={[0, 0.1, 0]}>
                  <cylinderGeometry args={[0.5, 0.5, 0.2]} />
                  <meshStandardMaterial color="green" transparent={transparent} opacity={opacity} />
               </mesh>
            )}
            {obj.type === 'TARGET' && (
               <mesh position={[0, 0.1, 0]}>
                  <cylinderGeometry args={[0.5, 0.5, 0.2]} />
                  <meshStandardMaterial color="red" transparent={transparent} opacity={opacity} />
               </mesh>
            )}
         </group>
      )})}

      {/* Legacy Modes Render */}
      {mode === 'TUNNEL' && <Tunnel />}
      {mode === 'ESCALATOR' && <Escalator />}
      {mode === 'TURNSTILES' && <><Tunnel /><Turnstiles /></>}
      {mode === 'SECURITY' && <><Tunnel /><Introscopes /></>}
      
      {/* Agents */}
      {agents.map(agent => (
        <Agent key={agent.id} agent={agent} />
      ))}
    </group>
  )
}
