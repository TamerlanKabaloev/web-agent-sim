import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { navSystem } from './nav'

export type SimulationMode = 'TUNNEL' | 'ESCALATOR' | 'TURNSTILES' | 'SECURITY' | 'BUILDER'

// Builder Types
export type BuildTool = 'WALL' | 'SPAWNER' | 'TARGET' | 'ERASER' | 'NONE' | 'TURNSTILE' | 'INTRO_SCOPE' | 'METAL_DETECTOR' | 'DOOR' | 'STAIRS' | 'PLATFORM'

export interface BuildObject {
  id: string
  type: 'WALL' | 'SPAWNER' | 'TARGET' | 'TURNSTILE' | 'INTRO_SCOPE' | 'METAL_DETECTOR' | 'DOOR' | 'STAIRS' | 'PLATFORM'
  position: [number, number, number]
  scale: [number, number, number] // x, y, z dimensions
  rotation: number // Y rotation
  level: number // Floor level (1, 2, 3...)
}

export interface Agent {
  id: string
  position: [number, number, number]
  velocity: [number, number, number]
  speed: number
  color: string
  // New Navigation props
  target: [number, number, number]
  path: [number, number][] // Current calculated path
  pathIndex: number // Current node in path
  state: 'walking' | 'processing' | 'waiting'
  assignedGateIndex?: number
  processingSince?: number
  hasPassedGate?: boolean
  hasBaggage?: boolean
}

interface SimulationState {
  // Mode
  mode: SimulationMode
  buildTool: BuildTool
  
  // Builder State
  customObjects: BuildObject[]
  currentLevel: number // For builder view
  
  // Parameters
  tunnelWidth: number
  tunnelLength: number
  passengersPer15Min: number
  maxAgents: number
  agentSpeedMin: number
  agentSpeedMax: number
  baggageProbability: number // 0-1

  // Gate Parameters
  gateCount: number
  gateServiceTime: number // seconds per person
  
  // Escalator Parameters
  escalatorHeight: number
  escalatorDirection: 'UP' | 'DOWN'
  escalatorSpeed: number
  
  // State
  agents: Agent[]
  agentsSpawnedTotal: number
  isRunning: boolean
  lastSpawnTime: number
  gateStatus: number[] 

  // Actions
  setMode: (mode: SimulationMode) => void
  setBuildTool: (tool: BuildTool) => void
  setCurrentLevel: (level: number) => void
  addCustomObject: (obj: BuildObject) => void
  removeCustomObject: (id: string) => void
  updateNavMesh: () => void
  
  setTunnelWidth: (width: number) => void
  setTunnelLength: (length: number) => void
  setPassengersPer15Min: (count: number) => void
  setMaxAgents: (count: number) => void
  setAgentSpeedRange: (min: number, max: number) => void
  setBaggageProbability: (prob: number) => void
  setGateCount: (count: number) => void
  setGateServiceTime: (time: number) => void
  setEscalatorHeight: (height: number) => void
  setEscalatorDirection: (dir: 'UP' | 'DOWN') => void
  setEscalatorSpeed: (speed: number) => void
  toggleSimulation: () => void
  resetSimulation: () => void
  
  // Simulation Loop
  tick: (delta: number) => void
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  mode: 'TUNNEL',
  buildTool: 'NONE',
  customObjects: [],
  
  tunnelWidth: 4,
  tunnelLength: 10,
  passengersPer15Min: 900,
  maxAgents: 0,
  agentSpeedMin: 2,
  agentSpeedMax: 4,
  
  gateCount: 3,
  gateServiceTime: 2.0,
  
  escalatorHeight: 5,
  escalatorDirection: 'UP',
  escalatorSpeed: 0.5,
  
  agents: [],
  agentsSpawnedTotal: 0,
  isRunning: false,
  lastSpawnTime: 0,
  gateStatus: [],

  currentLevel: 1,

  baggageProbability: 0.3,

  setMode: (mode) => {
    set({ mode })
    get().resetSimulation()
  },
  setBuildTool: (tool) => set({ buildTool: tool }),
  setCurrentLevel: (level) => set({ currentLevel: level }),
  
  addCustomObject: (obj) => {
    set((state) => ({ customObjects: [...state.customObjects, obj] }))
    get().updateNavMesh()
  },
  
  removeCustomObject: (id) => {
    set((state) => ({ customObjects: state.customObjects.filter(o => o.id !== id) }))
    get().updateNavMesh()
  },

  updateNavMesh: () => {
    const { customObjects, currentLevel } = get()
    // Only consider walls and obstacles on the CURRENT level for now to allow simple 2D pathfinding on active floor
    const obstacles = customObjects
      .filter(o => {
         // Filter by level
         if (o.level !== currentLevel) return false
         // Obstacle types
         return ['WALL', 'TURNSTILE', 'INTRO_SCOPE', 'METAL_DETECTOR', 'DOOR'].includes(o.type)
      })
      .map(o => ({ x: o.position[0], z: o.position[2], width: o.scale[0], length: o.scale[2] }))
    
    navSystem.updateObstacles(obstacles)
  },

  setTunnelWidth: (width) => set({ tunnelWidth: width }),
  setTunnelLength: (length) => set({ tunnelLength: length }),
  setPassengersPer15Min: (count) => set({ passengersPer15Min: count }),
  setMaxAgents: (count) => set({ maxAgents: count }),
  setAgentSpeedRange: (min, max) => set({ agentSpeedMin: min, agentSpeedMax: max }),
  setBaggageProbability: (prob) => set({ baggageProbability: prob }),
  setGateCount: (count) => set({ gateCount: count, gateStatus: new Array(count).fill(0) }),
  setGateServiceTime: (time) => set({ gateServiceTime: time }),
  setEscalatorHeight: (height) => set({ escalatorHeight: height }),
  setEscalatorDirection: (dir) => set({ escalatorDirection: dir }),
  setEscalatorSpeed: (speed) => set({ escalatorSpeed: speed }),
  
  toggleSimulation: () => set((state) => {
    if (!state.isRunning) {
      return { isRunning: true, lastSpawnTime: Date.now() }
    }
    return { isRunning: false }
  }),
  
  resetSimulation: () => set((state) => ({ 
    agents: [], 
    agentsSpawnedTotal: 0, 
    isRunning: false, 
    lastSpawnTime: 0,
    gateStatus: new Array(state.gateCount).fill(0)
  })),

  tick: (delta) => {
    const state = get()
    const { 
      agents, isRunning, passengersPer15Min, lastSpawnTime, 
      tunnelWidth, tunnelLength, agentSpeedMin, agentSpeedMax,
      maxAgents, agentsSpawnedTotal, mode, customObjects
    } = state

    if (!isRunning) return

    const now = Date.now() / 1000 
    const nowMs = Date.now()
    
    let newAgents = [...agents]
    let newLastSpawnTime = lastSpawnTime
    let newAgentsSpawnedTotal = agentsSpawnedTotal

    let newGateStatus = [...state.gateStatus]

    // --- SPAWNING LOGIC ---
    const spawnInterval = passengersPer15Min > 0 ? 900000 / passengersPer15Min : Infinity
    const timeSinceLastSpawn = nowMs - lastSpawnTime
    let agentsToSpawn = Math.floor(timeSinceLastSpawn / spawnInterval)
    
    if (agentsToSpawn > 50) agentsToSpawn = 50
    if (agentsToSpawn > 0) newLastSpawnTime += agentsToSpawn * spawnInterval

    if (agentsToSpawn > 0 && (maxAgents === 0 || agentsSpawnedTotal < maxAgents)) {
        for (let i = 0; i < agentsToSpawn; i++) {
            const speed = agentSpeedMin + Math.random() * (agentSpeedMax - agentSpeedMin)
            
            // Default values for preset modes
            let startPos: [number, number, number] = [0, 0, -tunnelLength/2 - 5]
            let targetPos: [number, number, number] = [0, 0, tunnelLength/2 + 5]

            // BUILDER MODE: Use Spawners and Targets
            if (mode === 'BUILDER') {
               // ... existing builder logic ...
               const spawners = customObjects.filter(o => o.type === 'SPAWNER')
               const targets = customObjects.filter(o => o.type === 'TARGET')
               
               if (spawners.length > 0 && targets.length > 0) {
                  const spawner = spawners[Math.floor(Math.random() * spawners.length)]
                  const target = targets[Math.floor(Math.random() * targets.length)]
                  
                  // Add small random noise to prevent exact overlap (which causes NaN in collision)
                  const noiseX = (Math.random() - 0.5) * 0.5
                  const noiseZ = (Math.random() - 0.5) * 0.5
                  
                  startPos = [spawner.position[0] + noiseX, 0.5, spawner.position[2] + noiseZ]
                  targetPos = [target.position[0] + noiseX, 0.5, target.position[2] + noiseZ]
               } else {
                  continue // Can't spawn without points
               }
            } else {
               // Presets Logic (simplified for update)
               startPos[0] = (Math.random() - 0.5) * (tunnelWidth - 1)
               targetPos[0] = (Math.random() - 0.5) * (tunnelWidth - 1)
            }

            // GATE ASSIGNMENT
            let assignedGateIndex = undefined
            if (mode === 'TURNSTILES' || mode === 'SECURITY') {
               // Ensure gateStatus is correct size
               if (newGateStatus.length !== state.gateCount) {
                   newGateStatus = new Array(state.gateCount).fill(0)
               }

               // Estimate arrival time at gate (Z=0) from startPos
               const dist = Math.abs(startPos[2])
               const arrivalTime = now + dist / speed
               
               let bestGate = 0
               let minFinishTime = Infinity
               
               for(let g=0; g < state.gateCount; g++) {
                  const readyAt = newGateStatus[g]
                  // Agent can start processing when they arrive AND when gate is free
                  const startAt = Math.max(arrivalTime, readyAt)
                  const finishAt = startAt + state.gateServiceTime
                  
                  if (finishAt < minFinishTime) {
                     minFinishTime = finishAt
                     bestGate = g
                  }
               }
               
               assignedGateIndex = bestGate
               newGateStatus[bestGate] = minFinishTime
            }

            // Calculate Path
            let path: [number, number][] = []
            if (mode === 'BUILDER') {
               path = navSystem.findPath(startPos, targetPos)
            }

            const hasBaggage = Math.random() < state.baggageProbability
            
            // Baggage slows down agents
            if (hasBaggage) {
               // Reduce speed by random amount (10% to 30%)
               speed *= (0.7 + Math.random() * 0.2)
            }

            newAgents.push({
                id: uuidv4(),
                position: startPos,
                velocity: [0, 0, 0],
                speed: speed,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                target: targetPos,
                path: path,
                pathIndex: 0,
                state: 'walking',
                assignedGateIndex: assignedGateIndex,
                hasBaggage: hasBaggage
            })
        }
        newAgentsSpawnedTotal += agentsToSpawn
    }

    // --- MOVEMENT LOGIC ---
    newAgents = newAgents.map(agent => {
      let nextPos = [...agent.position] as [number, number, number]
      
      // 1. GENERIC GATE LOGIC (Works in both Legacy & Builder modes)
      // Check if close to any active gate-like object
      if (agent.state === 'walking') {
         // Determine active gates based on mode
         let gates: {pos: [number, number, number], serviceTime: number, range: number}[] = []
         
         if (mode === 'TURNSTILES' || mode === 'SECURITY') {
            // Legacy Gates at Z=0
            gates.push({ pos: [agent.position[0], 0, 0], serviceTime: state.gateServiceTime, range: 0.5 })
         } else if (mode === 'BUILDER') {
            // Custom Gates
            customObjects.forEach(obj => {
               if (['TURNSTILE', 'INTRO_SCOPE', 'METAL_DETECTOR'].includes(obj.type)) {
                   // Simple box check or distance check
                   gates.push({ pos: obj.position, serviceTime: 2.0, range: 0.8 })
               }
            })
         }

         // Check proximity
         for (const gate of gates) {
            // Simple distance check (ignore Y for now)
            const dx = agent.position[0] - gate.pos[0]
            const dz = agent.position[2] - gate.pos[2]
            const dist = Math.sqrt(dx*dx + dz*dz)

            // If close enough AND not already passed this specific gate instance
            // Note: "hasPassedGate" is simple boolean, ideally we need a list of passed gate IDs.
            // For Builder mode, to prevent getting stuck in loop, we need a "cooldown" or ID tracking.
            // Simplified: if state is walking and close, stop.
            // To avoid re-triggering, we only trigger if we are "approaching" (dot product?)
            // OR: simpler -> Agent has a "currentGateId" it is processing.
            
            if (dist < gate.range) {
               // Crude check to see if we just processed this one? 
               // Let's assume if we are 'walking' inside the range, we should stop unless we just left it.
               // Time check:
               if (!agent.processingSince || (now - agent.processingSince > 5.0)) { // 5s cooldown
                  return {
                     ...agent,
                     state: 'processing',
                     processingSince: now,
                     // Snap to gate pos? Maybe not for custom builder, just stop.
                  }
               }
            }
         }
      }
      
      // Process Waiting State
      if (agent.state === 'processing') {
         const timeSpent = now - (agent.processingSince || now)
         // Hardcoded 2s for custom objects for now, or use param
         if (timeSpent >= 2.0) {
             return {
                ...agent,
                state: 'walking',
                // Keep processingSince to use as cooldown
             }
         }
         return agent // Stop moving
      }

      // PATHFINDING MOVEMENT
      if (mode === 'BUILDER' && agent.path.length > 0) {
         if (agent.pathIndex < agent.path.length) {
            const nextNode = agent.path[agent.pathIndex]
            const dx = nextNode[0] - agent.position[0]
            const dz = nextNode[1] - agent.position[2]
            const dist = Math.sqrt(dx*dx + dz*dz)
            
            if (dist < 0.2) {
               // Reached node, go to next
               return { ...agent, pathIndex: agent.pathIndex + 1 }
            }
            
            // Move towards node
            const moveDist = agent.speed * delta
            nextPos[0] += (dx / dist) * moveDist
            nextPos[2] += (dz / dist) * moveDist
         }
      } 
      // STRAIGHT LINE MOVEMENT (Legacy Modes)
      else {
         let dz = agent.speed * delta
         let dx = 0
         
         // If assigned gate, steer towards it
         if (agent.assignedGateIndex !== undefined && !agent.hasPassedGate) {
             const spacing = tunnelWidth / (state.gateCount + 1)
             const gateX = -tunnelWidth/2 + spacing * (agent.assignedGateIndex + 1)
             
             const diffX = gateX - agent.position[0]
             const diffZ = 0 - agent.position[2] // Target Z=0
             
             // Simple proportional steering
             if (Math.abs(diffX) > 0.1) {
                dx = (diffX / Math.abs(diffZ)) * dz 
                // Clamp dx if needed, but usually fine
                if (Math.abs(dx) > agent.speed * delta) dx = Math.sign(dx) * agent.speed * delta
             }
         }

         // Separation force
         let sepX = 0
         let sepZ = 0
         // Braking for person in front
         let brake = 1.0

         agents.forEach(other => {
            if (other.id === agent.id) return
            const distX = agent.position[0] - other.position[0]
            const distZ = agent.position[2] - other.position[2]
            const d = Math.sqrt(distX*distX + distZ*distZ)
            
            // Separation
            if (d < 0.8 && d > 0) { // Increased radius
               const force = (0.8 - d) / d
               sepX += distX * force
               sepZ += distZ * force
            }

            // Queuing Logic: Check if someone is directly ahead in my lane
            if (agent.assignedGateIndex !== undefined && other.assignedGateIndex === agent.assignedGateIndex) {
               // Only care about agents in front of me (higher Z) but not passed gate yet
               if (other.position[2] > agent.position[2] && other.position[2] < 0.5) {
                  const distAhead = other.position[2] - agent.position[2]
                  if (distAhead < 1.5 && Math.abs(other.position[0] - agent.position[0]) < 0.5) {
                     // Slow down significantly as we get closer
                     brake = Math.min(brake, Math.max(0, (distAhead - 0.8))) 
                  }
               }
            }
         })
         
         dx += sepX * 3 * delta // Increased force
         dz += sepZ * 3 * delta

         // Apply brake
         dz *= brake
         dx *= brake

         nextPos[0] += dx
         nextPos[2] += dz
         
         // Store velocity for animation scaling
         // We are not returning early here anymore, just falling through to return at bottom of map
         return { 
            ...agent, 
            position: nextPos,
            velocity: [dx/delta, 0, dz/delta]
         }
      }

      return { ...agent, position: nextPos }
    }).filter(agent => {
       // Despawn logic
       if (mode === 'BUILDER') {
          const targets = customObjects.filter(o => o.type === 'TARGET')
          // Despawn if close to any target
          return !targets.some(t => {
             const dx = agent.position[0] - t.position[0]
             const dz = agent.position[2] - t.position[2]
             return Math.sqrt(dx*dx + dz*dz) < 1.0
          })
       } else {
          return agent.position[2] < tunnelLength / 2 + 5
       }
    })

    set({ 
        agents: newAgents, 
        lastSpawnTime: newLastSpawnTime, 
        agentsSpawnedTotal: newAgentsSpawnedTotal,
        gateStatus: newGateStatus // Save updated gate status!
    })
  }
}))
