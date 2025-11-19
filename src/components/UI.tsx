import { useSimulationStore, SimulationMode, BuildTool } from '../store'

export const UI = () => {
  const {
    mode, setMode, buildTool, setBuildTool,
    tunnelWidth, setTunnelWidth,
    tunnelLength, setTunnelLength,
    passengersPer15Min, setPassengersPer15Min,
    maxAgents, setMaxAgents,
    agentSpeedMin, agentSpeedMax, setAgentSpeedRange,
    gateCount, setGateCount,
    gateServiceTime, setGateServiceTime,
    escalatorHeight, setEscalatorHeight,
    escalatorDirection, setEscalatorDirection,
    escalatorSpeed, setEscalatorSpeed,
    isRunning, toggleSimulation, resetSimulation,
    agents, agentsSpawnedTotal
  } = useSimulationStore()

  return (
    <div className="ui-panel">
      <style>{`
        .ui-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 340px;
          max-height: 90vh;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.8);
          padding: 20px;
          border-radius: 8px;
          color: white;
          font-family: sans-serif;
          backdrop-filter: blur(5px);
        }
        .control-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-size: 14px; color: #ccc; }
        input[type="range"], select { width: 100%; }
        .value { float: right; color: #4caf50; }
        .button-group { display: flex; gap: 5px; margin-top: 10px; flex-wrap: wrap; }
        button {
          flex: 1; padding: 8px; border: none; border-radius: 4px;
          cursor: pointer; font-weight: bold; transition: background 0.2s;
          font-size: 12px;
        }
        .btn-tool { background: #444; color: white; border: 1px solid #666; min-width: 60px; }
        .btn-tool.active { background: #2196f3; border-color: #64b5f6; }
        .btn-primary { background: #2196f3; color: white; }
        .btn-danger { background: #f44336; color: white; }
        .stats { margin-top: 20px; padding-top: 10px; border-top: 1px solid #444; font-size: 12px; color: #888; }
        .level-tabs { display: flex; margin-bottom: 10px; background: #333; border-radius: 4px; padding: 2px; }
        .level-tab { flex: 1; padding: 5px; text-align: center; cursor: pointer; font-size: 12px; }
        .level-tab.active { background: #555; color: white; font-weight: bold; border-radius: 2px; }
      `}</style>

      <h2>Station Builder</h2>

      <div className="control-group">
        <label>Select Mode</label>
        <select 
           value={mode} 
           onChange={(e) => setMode(e.target.value as SimulationMode)}
           style={{ padding: '10px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
        >
           <option value="TUNNEL">Tunnel</option>
           <option value="ESCALATOR">Escalator</option>
           <option value="TURNSTILES">Turnstiles</option>
           <option value="SECURITY">Security / Introscopes</option>
           <option value="BUILDER">🛠️ CUSTOM BUILDER</option>
        </select>
      </div>

      {mode === 'BUILDER' ? (
         <div className="control-group">
            <label>Level</label>
            <div className="level-tabs">
               <div 
                  className={`level-tab ${useSimulationStore.getState().currentLevel === 1 ? 'active' : ''}`}
                  onClick={() => useSimulationStore.getState().setCurrentLevel(1)}
               >
                  Level 1 (Ground)
               </div>
               <div 
                  className={`level-tab ${useSimulationStore.getState().currentLevel === 2 ? 'active' : ''}`}
                  onClick={() => useSimulationStore.getState().setCurrentLevel(2)}
               >
                  Level 2 (Upper)
               </div>
            </div>

            <label>Builder Tools</label>
            <div className="button-group">
               <button 
                  className={`btn-tool ${buildTool === 'WALL' ? 'active' : ''}`}
                  onClick={() => setBuildTool('WALL')}
               >
                  🧱 Wall
               </button>
               <button 
                  className={`btn-tool ${buildTool === 'DOOR' ? 'active' : ''}`}
                  onClick={() => setBuildTool('DOOR')}
               >
                  🚪 Door
               </button>
               <button 
                  className={`btn-tool ${buildTool === 'TURNSTILE' ? 'active' : ''}`}
                  onClick={() => setBuildTool('TURNSTILE')}
               >
                  🛑 Gate
               </button>
               <button 
                  className={`btn-tool ${buildTool === 'INTRO_SCOPE' ? 'active' : ''}`}
                  onClick={() => setBuildTool('INTRO_SCOPE')}
               >
                  🔍 X-Ray
               </button>
               <button 
                  className={`btn-tool ${buildTool === 'METAL_DETECTOR' ? 'active' : ''}`}
                  onClick={() => setBuildTool('METAL_DETECTOR')}
               >
                  ⛩️ Metal
               </button>
               <button 
                  className={`btn-tool ${buildTool === 'STAIRS' ? 'active' : ''}`}
                  onClick={() => setBuildTool('STAIRS')}
               >
                  🪜 Stair
               </button>
               <button 
                  className={`btn-tool ${buildTool === 'TUNNEL' ? 'active' : ''}`}
                  onClick={() => setBuildTool('TUNNEL')}
               >
                  🚇 Tunnel
               </button>
            </div>
            <div className="button-group">
               <button 
                  className={`btn-tool ${buildTool === 'SPAWNER' ? 'active' : ''}`}
                  onClick={() => setBuildTool('SPAWNER')}
               >
                  🟢 Start
               </button>
               <button 
                  className={`btn-tool ${buildTool === 'TARGET' ? 'active' : ''}`}
                  onClick={() => setBuildTool('TARGET')}
               >
                  🔴 End
               </button>
               <button 
                  className={`btn-tool ${buildTool === 'ERASER' ? 'active' : ''}`}
                  onClick={() => setBuildTool('ERASER')}
               >
                  ❌ Erase
               </button>
            </div>
            <p style={{ fontSize: '11px', color: '#aaa', marginTop: '5px' }}>
               Use Level tabs to switch floors.
            </p>
         </div>
      ) : (
         <>
            {/* Existing controls for legacy modes */}
            <div className="control-group">
               <label>Width <span className="value">{tunnelWidth}m</span></label>
               <input type="range" min="1" max="20" step="0.5" value={tunnelWidth} onChange={(e) => setTunnelWidth(parseFloat(e.target.value))} />
            </div>
            {mode !== 'ESCALATOR' && (
               <div className="control-group">
                  <label>Length <span className="value">{tunnelLength}m</span></label>
                  <input type="range" min="5" max="50" step="1" value={tunnelLength} onChange={(e) => setTunnelLength(parseFloat(e.target.value))} />
               </div>
            )}
         </>
      )}

      {/* Turnstiles / Security Controls */}
      {(mode === 'TURNSTILES' || mode === 'SECURITY') && (
        <>
           <div className="control-group">
              <label>Gate Count <span className="value">{gateCount}</span></label>
              <input type="range" min="1" max="20" step="1" value={gateCount} onChange={(e) => setGateCount(parseInt(e.target.value))} />
           </div>
           <div className="control-group">
              <label>Service Time (sec) <span className="value">{gateServiceTime}s</span></label>
              <input type="range" min="0.5" max="60" step="0.5" value={gateServiceTime} onChange={(e) => setGateServiceTime(parseFloat(e.target.value))} />
           </div>
         </>
      )}

      {/* Shared Controls */}
      <div className="control-group">
        <label>Passengers / 15-min Peak <span className="value">{passengersPer15Min}</span></label>
        <input type="range" min="0" max="5000" step="10" value={passengersPer15Min} onChange={(e) => setPassengersPer15Min(parseFloat(e.target.value))} />
      </div>

      <div className="control-group">
         <label>Agent Speed (m/s)</label>
         <div style={{ display: 'flex', gap: '5px' }}>
            <div style={{ flex: 1 }}>
               <span style={{ fontSize: '10px', color: '#aaa' }}>Min: {agentSpeedMin.toFixed(1)}</span>
               <input type="range" min="0.5" max="5" step="0.1" value={agentSpeedMin} onChange={(e) => setAgentSpeedRange(parseFloat(e.target.value), agentSpeedMax)} />
            </div>
            <div style={{ flex: 1 }}>
               <span style={{ fontSize: '10px', color: '#aaa' }}>Max: {agentSpeedMax.toFixed(1)}</span>
               <input type="range" min="0.5" max="5" step="0.1" value={agentSpeedMax} onChange={(e) => setAgentSpeedRange(agentSpeedMin, parseFloat(e.target.value))} />
            </div>
         </div>
      </div>

      <div className="control-group">
         <label>Baggage % <span className="value">{Math.round(useSimulationStore.getState().baggageProbability * 100)}%</span></label>
         <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            value={useSimulationStore(state => state.baggageProbability)} 
            onChange={(e) => useSimulationStore.getState().setBaggageProbability(parseFloat(e.target.value))} 
         />
      </div>

      <div className="control-group" style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '12px', color: '#aaa' }}>Congestion Level</span>
            <span style={{ 
               fontWeight: 'bold',
               fontSize: '12px',
               color: agents.length > 100 ? '#f44336' : agents.length > 50 ? '#ff9800' : '#4caf50' 
            }}>
               {agents.length > 100 ? 'HIGH' : agents.length > 50 ? 'MED' : 'LOW'}
            </span>
         </div>
         <div style={{ width: '100%', height: '6px', background: '#222', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
               width: `${Math.min(100, (agents.length / 200) * 100)}%`, 
               height: '100%', 
               background: agents.length > 100 ? '#f44336' : agents.length > 50 ? '#ff9800' : '#4caf50',
               transition: 'width 0.5s, background 0.5s'
            }} />
         </div>
      </div>

      <div className="button-group">
        <button className="btn-primary" onClick={toggleSimulation} style={{ backgroundColor: isRunning ? '#ff9800' : '#4caf50' }}>
          {isRunning ? 'PAUSE' : 'START'}
        </button>
        <button className="btn-danger" onClick={resetSimulation}>RESET</button>
      </div>

      <div className="stats">
        Active Agents: {agents.length} <br/>
        Spawned: {agentsSpawnedTotal} / {maxAgents === 0 ? '∞' : maxAgents}
      </div>
    </div>
  )
}
