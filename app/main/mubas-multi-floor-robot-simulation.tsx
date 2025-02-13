"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CableCarIcon as Elevator } from "lucide-react"

type RoomState = "Clean" | "Dirty"
type Location = { floor: number; position: number | "Corridor" | "Elevator" }

interface Floor {
  rooms: Record<number, RoomState>
  corridor: RoomState
}

interface Building {
  floors: Floor[]
}

interface SimulationState {
  building: Building
  robotLocation: Location
  performance: number
  time: number
}

const INITIAL_BUILDING: Building = {
  floors: [
    {
      rooms: { 40: "Dirty", 41: "Dirty", 42: "Dirty", 43: "Dirty", 44: "Dirty", 45: "Dirty" },
      corridor: "Clean",
    },
    {
      rooms: { 46: "Dirty", 47: "Dirty", 48: "Dirty", 49: "Dirty", 50: "Dirty" },
      corridor: "Clean",
    },
    {
      rooms: { 51: "Dirty", 52: "Dirty", 53: "Dirty", 54: "Dirty", 55: "Dirty" },
      corridor: "Clean",
    },
  ],
}

const INITIAL_STATE: SimulationState = {
  building: INITIAL_BUILDING,
  robotLocation: { floor: 0, position: "Corridor" },
  performance: 0,
  time: 0,
}

const ROOM_CLEANING_TIME = 5
const ROOM_TRAVEL_TIME = 2
const ELEVATOR_TRAVEL_TIME = 5

const robotStyle = "text-2xl absolute transition-all duration-500 ease-in-out z-10"

export default function MUBASMultiFloorRobotSimulation() {
  const [isRunning, setIsRunning] = useState(false)
  const [simulationState, setSimulationState] = useState<SimulationState>(INITIAL_STATE)
  const [isComplete, setIsComplete] = useState(false)

  const resetSimulation = useCallback(() => {
    const newBuilding = JSON.parse(JSON.stringify(INITIAL_BUILDING))
    newBuilding.floors.forEach((floor: Floor) => {
      Object.keys(floor.rooms).forEach((room) => {
        floor.rooms[Number(room)] = Math.random() < 0.5 ? "Clean" : "Dirty"
      })
    })
    setSimulationState({
      ...INITIAL_STATE,
      building: newBuilding,
    })
    setIsComplete(false)
  }, [])

  useEffect(() => {
    resetSimulation()
  }, [resetSimulation])

  const moveRobot = useCallback(async () => {
    const findNextDirtyRoom = (startFloor: number) => {
      for (let f = startFloor; f < simulationState.building.floors.length; f++) {
        const dirtyRoom = Object.entries(simulationState.building.floors[f].rooms).find(
          ([_, state]) => state === "Dirty",
        )
        if (dirtyRoom) {
          return { floor: f, room: Number(dirtyRoom[0]) }
        }
      }
      for (let f = 0; f < startFloor; f++) {
        const dirtyRoom = Object.entries(simulationState.building.floors[f].rooms).find(
          ([_, state]) => state === "Dirty",
        )
        if (dirtyRoom) {
          return { floor: f, room: Number(dirtyRoom[0]) }
        }
      }
      return null
    }

    const updateState = (newState: Partial<SimulationState>) => {
      return new Promise<void>((resolve) => {
        setSimulationState((prevState) => ({ ...prevState, ...newState }))
        setTimeout(resolve, 1000) // 1 second delay for visibility
      })
    }

    const { floor, position } = simulationState.robotLocation
    const currentFloor = simulationState.building.floors[floor]

    if (position === "Corridor") {
      const dirtyRoom = Object.entries(currentFloor.rooms).find(([_, state]) => state === "Dirty")
      if (dirtyRoom) {
        await updateState({
          robotLocation: { floor, position: Number(dirtyRoom[0]) },
          time: simulationState.time + ROOM_TRAVEL_TIME,
        })
        // Clean the room
        await updateState({
          building: {
            ...simulationState.building,
            floors: simulationState.building.floors.map((f, i) =>
              i === floor ? { ...f, rooms: { ...f.rooms, [dirtyRoom[0]]: "Clean" } } : f,
            ),
          },
          performance: simulationState.performance + 1,
          time: simulationState.time + ROOM_CLEANING_TIME,
        })
        // Move back to corridor
        await updateState({
          robotLocation: { floor, position: "Corridor" },
          time: simulationState.time + ROOM_TRAVEL_TIME,
        })
      } else {
        const nextDirtyRoom = findNextDirtyRoom(floor)
        if (nextDirtyRoom && nextDirtyRoom.floor !== floor) {
          await updateState({
            robotLocation: { floor, position: "Elevator" },
            time: simulationState.time + ROOM_TRAVEL_TIME,
          })
        }
      }
    } else if (position === "Elevator") {
      const nextDirtyRoom = findNextDirtyRoom(floor)
      if (nextDirtyRoom) {
        await updateState({
          robotLocation: { floor: nextDirtyRoom.floor, position: "Elevator" },
          time: simulationState.time + ELEVATOR_TRAVEL_TIME,
        })
        await updateState({
          robotLocation: { floor: nextDirtyRoom.floor, position: "Corridor" },
          time: simulationState.time + ROOM_TRAVEL_TIME,
        })
      }
    }

    // Check if all rooms are clean
    const allClean = simulationState.building.floors.every((floor) =>
      Object.values(floor.rooms).every((roomState) => roomState === "Clean"),
    )
    if (allClean) {
      setIsComplete(true)
      setIsRunning(false)
    }
  }, [simulationState])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    if (isRunning) {
      intervalId = setInterval(() => {
        moveRobot()
      }, 1000)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isRunning, moveRobot])

  const toggleSimulation = () => {
    setIsRunning((prev) => !prev)
    if (!isRunning) {
      resetSimulation()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">MUBAS Multi-Floor Robot Simulation</h1>
      <div className="flex gap-4 mb-4">
        {simulationState.building.floors.map((floor, floorIndex) => (
          <div key={floorIndex} className="flex flex-col items-center border-2 border-gray-300 p-2 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Floor {floorIndex + 1}</h2>
            <div className="flex gap-2 items-center mb-2">
              <div
                className={`w-16 h-16 border-2 ${
                  simulationState.robotLocation.floor === floorIndex &&
                  simulationState.robotLocation.position === "Elevator"
                    ? "border-blue-500"
                    : "border-gray-300"
                } rounded-lg flex flex-col items-center justify-center relative`}
              >
                <div className="text-sm font-bold">Elevator</div>
                <Elevator className="w-6 h-6" />
                {simulationState.robotLocation.floor === floorIndex &&
                  simulationState.robotLocation.position === "Elevator" && <div className={`${robotStyle}`}>🤖</div>}
              </div>
              <div
                className={`w-16 h-16 border-2 ${
                  simulationState.robotLocation.floor === floorIndex &&
                  simulationState.robotLocation.position === "Corridor"
                    ? "border-blue-500"
                    : "border-gray-300"
                } rounded-lg flex items-center justify-center relative`}
              >
                <div className="text-center">
                  <div className="text-sm font-bold">Corridor</div>
                  {simulationState.robotLocation.floor === floorIndex &&
                    simulationState.robotLocation.position === "Corridor" && <div className={`${robotStyle}`}>🤖</div>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {Object.entries(floor.rooms).map(([roomNumber, roomState]) => (
                <div
                  key={roomNumber}
                  className={`w-16 h-16 border-2 ${roomState === "Clean" ? "bg-green-200" : "bg-red-200"} ${
                    simulationState.robotLocation.floor === floorIndex &&
                    simulationState.robotLocation.position === Number(roomNumber)
                      ? "border-blue-500"
                      : "border-gray-300"
                  } rounded-lg flex items-center justify-center relative`}
                >
                  <div className="text-center">
                    <div className="text-sm font-bold">{roomNumber}</div>
                    {simulationState.robotLocation.floor === floorIndex &&
                      simulationState.robotLocation.position === Number(roomNumber) && (
                        <div className={`${robotStyle}`}>🤖</div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <Button onClick={toggleSimulation} className="px-4 py-2 bg-blue-500 text-white rounded">
          {isRunning ? "Stop" : "Start"} Simulation
        </Button>
      </div>
      <div className="text-lg">
        <div>Rooms Cleaned: {simulationState.performance}</div>
        <div>Time Elapsed: {simulationState.time} seconds</div>
        {isComplete && <div className="text-green-600 font-bold mt-2">All rooms are clean! Simulation complete.</div>}
      </div>
    </div>
  )
}

