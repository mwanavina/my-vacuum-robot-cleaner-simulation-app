"use client"

import { useState, useCallback, useEffect } from "react"
import { useInterval } from "usehooks-ts"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type RoomState = "Clean" | "Dirty"
type Location = number | "Corridor"
type Difficulty = "Easy" | "Medium"

interface Corridor {
  rooms: Record<number, RoomState>
  corridor: RoomState
}

interface SimulationState {
  corridor: Corridor
  robotLocation: Location
  performance: number
  time: number
  moves: number
  cleans: number
}

const INITIAL_CORRIDOR: Corridor = {
  rooms: { 40: "Dirty", 41: "Dirty", 42: "Dirty", 43: "Dirty", 44: "Dirty", 45: "Dirty" },
  corridor: "Clean",
}

const INITIAL_STATE: SimulationState = {
  corridor: INITIAL_CORRIDOR,
  robotLocation: "Corridor",
  performance: 0,
  time: 0,
  moves: 0,
  cleans: 0,
}

const ROOM_CLEANING_TIME = 5
const ROOM_TRAVEL_TIME = 2

export default function MUBASCorridorRobotSimulation() {
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy")
  const [isRunning, setIsRunning] = useState(false)
  const [simulationState, setSimulationState] = useState<SimulationState>(INITIAL_STATE)

  const resetSimulation = useCallback(() => {
    const newCorridor = { ...INITIAL_CORRIDOR }
    if (difficulty === "Medium") {
      Object.keys(newCorridor.rooms).forEach((room) => {
        newCorridor.rooms[Number(room)] = Math.random() < 0.5 ? "Clean" : "Dirty"
      })
    }
    setSimulationState({
      ...INITIAL_STATE,
      corridor: newCorridor,
    })
  }, [difficulty])

  useEffect(() => {
    resetSimulation()
  }, [resetSimulation])

  const moveRobot = useCallback(() => {
    setSimulationState((prevState) => {
      const newState = { ...prevState }
      const { robotLocation, corridor } = newState

      if (robotLocation === "Corridor") {
        // Find the nearest dirty room
        const dirtyRooms = Object.entries(corridor.rooms).filter(([_, state]) => state === "Dirty")
        if (dirtyRooms.length > 0) {
          const nearestRoom = dirtyRooms.reduce((nearest, current) => {
            const nearestDistance = Math.abs(Number(nearest[0]) - (robotLocation === "Corridor" ? 40 : robotLocation))
            const currentDistance = Math.abs(Number(current[0]) - (robotLocation === "Corridor" ? 40 : robotLocation))
            return currentDistance < nearestDistance ? current : nearest
          })
          newState.robotLocation = Number(nearestRoom[0])
          newState.moves += 1
          if (difficulty === "Medium") {
            newState.time += ROOM_TRAVEL_TIME
          }
        }
      } else {
        // Clean the current room
        if (corridor.rooms[robotLocation] === "Dirty") {
          corridor.rooms[robotLocation] = "Clean"
          newState.performance += 1
          newState.cleans += 1
          if (difficulty === "Medium") {
            newState.time += ROOM_CLEANING_TIME
          }
        }
        // Move back to corridor
        newState.robotLocation = "Corridor"
        newState.moves += 1
        if (difficulty === "Medium") {
          newState.time += ROOM_TRAVEL_TIME
        }
      }

      return newState
    })
  }, [difficulty])

  useInterval(
    () => {
      moveRobot()
    },
    isRunning ? 1000 : null,
  )

  const toggleSimulation = () => {
    setIsRunning((prev) => !prev)
    if (!isRunning) {
      resetSimulation()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">MUBAS Corridor Robot Simulation</h1>
      <div className="mb-4">
        <Select onValueChange={(value: Difficulty) => setDifficulty(value)} value={difficulty} disabled={isRunning}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 items-center mb-4">
        <div
          className={`w-20 h-20 border-2 ${
            simulationState.robotLocation === "Corridor" ? "border-blue-500" : "border-gray-300"
          } rounded-lg flex items-center justify-center`}
        >
          <div className="text-center">
            <div className="text-sm font-bold">Corridor</div>
            {simulationState.robotLocation === "Corridor" && <div className="text-2xl">🤖</div>}
          </div>
        </div>
        {Object.entries(simulationState.corridor.rooms).map(([roomNumber, roomState]) => (
          <div
            key={roomNumber}
            className={`w-20 h-20 border-2 ${roomState === "Clean" ? "bg-green-200" : "bg-red-200"} ${
              simulationState.robotLocation === Number(roomNumber) ? "border-blue-500" : "border-gray-300"
            } rounded-lg flex items-center justify-center`}
          >
            <div className="text-center">
              <div className="text-sm font-bold">Room {roomNumber}</div>
              {simulationState.robotLocation === Number(roomNumber) && <div className="text-2xl">🤖</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <Button onClick={toggleSimulation} className="px-4 py-2 bg-blue-500 text-white rounded">
          {isRunning ? "Stop" : "Start"} Simulation
        </Button>
      </div>
      <div className="text-lg mb-4">
        <div>Performance Score: {simulationState.performance}</div>
        {difficulty === "Medium" && <div>Time Elapsed: {simulationState.time} seconds</div>}
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
        <div className="p-4 border rounded-lg">
          <h2 className="font-bold">Stats</h2>
          <p>Difficulty: {difficulty}</p>
          <p>Moves: {simulationState.moves}</p>
          <p>Cleans: {simulationState.cleans}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h2 className="font-bold">Current State</h2>
          <p>Robot Position: {simulationState.robotLocation === "Corridor" ? "Corridor" : `Room ${simulationState.robotLocation}`}</p>
          <p>Room 40: {simulationState.corridor.rooms[40]}</p>
          <p>Room 41: {simulationState.corridor.rooms[41]}</p>
          <p>Room 42: {simulationState.corridor.rooms[42]}</p>
          <p>Room 43: {simulationState.corridor.rooms[43]}</p>
          <p>Room 44: {simulationState.corridor.rooms[44]}</p>
          <p>Room 45: {simulationState.corridor.rooms[45]}</p>
        </div>
      </div>
    </div>
  )
}