"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CableCarIcon as Elevator } from "lucide-react"

type RoomState = "Clean" | "Dirty"
type RoomAvailability = "Available" | "Occupied" | "Unexpected"
type Location = { floor: number; position: number | "Corridor" | "Elevator" }

interface Room {
  state: RoomState
  availability: RoomAvailability
}

interface Floor {
  rooms: Record<number, Room>
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
  currentHour: number
}

const INITIAL_BUILDING: Building = {
  floors: [
    {
      rooms: {
        40: { state: "Dirty", availability: "Available" },
        41: { state: "Dirty", availability: "Available" },
        42: { state: "Dirty", availability: "Available" },
        43: { state: "Dirty", availability: "Available" },
        44: { state: "Dirty", availability: "Available" },
        45: { state: "Dirty", availability: "Available" },
      },
      corridor: "Clean",
    },
    {
      rooms: {
        46: { state: "Dirty", availability: "Available" },
        47: { state: "Dirty", availability: "Available" },
        48: { state: "Dirty", availability: "Available" },
        49: { state: "Dirty", availability: "Available" },
        50: { state: "Dirty", availability: "Available" },
      },
      corridor: "Clean",
    },
    {
      rooms: {
        51: { state: "Dirty", availability: "Available" },
        52: { state: "Dirty", availability: "Available" },
        53: { state: "Dirty", availability: "Available" },
        54: { state: "Dirty", availability: "Available" },
        55: { state: "Dirty", availability: "Available" },
      },
      corridor: "Clean",
    },
  ],
}

const INITIAL_STATE: SimulationState = {
  building: INITIAL_BUILDING,
  robotLocation: { floor: 0, position: "Corridor" },
  performance: 0,
  time: 0,
  currentHour: 8, // Starting at 8 AM
}

const ROOM_CLEANING_TIME = 5
const ROOM_TRAVEL_TIME = 2
const ELEVATOR_TRAVEL_TIME = 5

const robotStyle = "text-2xl absolute transition-all duration-500 ease-in-out z-10"

// Simplified timetable: [room number, start hour, end hour]
const TIMETABLE: [number, number, number][] = [
  [40, 9, 11],
  [41, 10, 12],
  [42, 11, 13],
  [43, 14, 16],
  [44, 15, 17],
  [45, 16, 18],
  [46, 9, 11],
  [47, 11, 13],
  [48, 14, 16],
  [49, 16, 18],
  [50, 10, 12],
  [51, 9, 11],
  [52, 11, 13],
  [53, 14, 16],
  [54, 16, 18],
  [55, 10, 12],
]

export default function MUBASMultiFloorRobotSimulationn() {
  const [isRunning, setIsRunning] = useState(false)
  const [simulationState, setSimulationState] = useState<SimulationState>(INITIAL_STATE)
  const [isComplete, setIsComplete] = useState(false)

  const resetSimulation = useCallback(() => {
    const newBuilding = JSON.parse(JSON.stringify(INITIAL_BUILDING))
    newBuilding.floors.forEach((floor: Floor) => {
      Object.keys(floor.rooms).forEach((room) => {
        floor.rooms[Number(room)].state = Math.random() < 0.5 ? "Clean" : "Dirty"
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

  const updateRoomAvailability = useCallback(() => {
    setSimulationState((prevState) => {
      const newState = { ...prevState }
      // Convert simulation time to hour
      const currentHour = Math.floor(newState.time / 60) + 8 

      newState.building.floors.forEach((floor) => {
        Object.entries(floor.rooms).forEach(([roomNumber, room]) => {
          // Check timetable
          const scheduledClass = TIMETABLE.find(
            ([r, start, end]) => r === Number(roomNumber) && currentHour >= start && currentHour < end,
          )

          // 30% chance of change in room status
          if (Math.random() < 0.3) {
            if (scheduledClass) {
              // 20% chance a scheduled class is cancelled
              room.availability = Math.random() < 0.2 ? "Available" : "Occupied"
            } else {
              // 40% chance of an unexpected class
              room.availability = Math.random() < 0.4 ? "Occupied" : "Available"
            }
          } else {
            // Follow the timetable
            room.availability = scheduledClass ? "Occupied" : "Available"
          }
        })
      })
      return newState
    })
  }, [])

  const moveRobot = useCallback(async () => {
    const findNextAvailableDirtyRoom = (startFloor: number) => {
      for (let f = startFloor; f < simulationState.building.floors.length; f++) {
        const availableDirtyRoom = Object.entries(simulationState.building.floors[f].rooms).find(
          ([, room]) => room.state === "Dirty" && room.availability !== "Occupied",
        )
        if (availableDirtyRoom) {
          return { floor: f, room: Number(availableDirtyRoom[0]) }
        }
      }
      for (let f = 0; f < startFloor; f++) {
        const availableDirtyRoom = Object.entries(simulationState.building.floors[f].rooms).find(
          ([, room]) => room.state === "Dirty" && room.availability !== "Occupied",
        )
        if (availableDirtyRoom) {
          return { floor: f, room: Number(availableDirtyRoom[0]) }
        }
      }
      return null
    }

    const updateState = (newState: Partial<SimulationState>) => {
      return new Promise<void>((resolve) => {
        setSimulationState((prevState) => ({ ...prevState, ...newState }))
        // 1 second delay for visibility
        setTimeout(resolve, 1000) 
      })
    }

    const { floor, position } = simulationState.robotLocation
    const currentFloor = simulationState.building.floors[floor]

    if (position === "Corridor") {
      const availableDirtyRoom = Object.entries(currentFloor.rooms).find(
        ([, room]) => room.state === "Dirty" && room.availability === "Available",
      )
      if (availableDirtyRoom) {
        const roomNumber = Number(availableDirtyRoom[0])
        await updateState({
          robotLocation: { floor, position: roomNumber },
          time: simulationState.time + ROOM_TRAVEL_TIME,
        })
        // Double-check availability before cleaning
        if (currentFloor.rooms[roomNumber].availability === "Available") {
          await updateState({
            building: {
              ...simulationState.building,
              floors: simulationState.building.floors.map((f, i) =>
                i === floor
                  ? {
                      ...f,
                      rooms: {
                        ...f.rooms,
                        [roomNumber]: { ...f.rooms[roomNumber], state: "Clean" },
                      },
                    }
                  : f,
              ),
            },
            performance: simulationState.performance + 1,
            time: simulationState.time + ROOM_CLEANING_TIME,
          })
        }
        // Move back to corridor
        await updateState({
          robotLocation: { floor, position: "Corridor" },
          time: simulationState.time + ROOM_TRAVEL_TIME,
        })
      } else {
        const nextAvailableDirtyRoom = findNextAvailableDirtyRoom(floor)
        if (nextAvailableDirtyRoom && nextAvailableDirtyRoom.floor !== floor) {
          await updateState({
            robotLocation: { floor, position: "Elevator" },
            time: simulationState.time + ROOM_TRAVEL_TIME,
          })
        }
      }
    } else if (position === "Elevator") {
      const nextAvailableDirtyRoom = findNextAvailableDirtyRoom(floor)
      if (nextAvailableDirtyRoom) {
        await updateState({
          robotLocation: { floor: nextAvailableDirtyRoom.floor, position: "Elevator" },
          time: simulationState.time + ELEVATOR_TRAVEL_TIME,
        })
        await updateState({
          robotLocation: { floor: nextAvailableDirtyRoom.floor, position: "Corridor" },
          time: simulationState.time + ROOM_TRAVEL_TIME,
        })
      }
    }

    // Update room availability every 5 seconds (5 simulation minutes)
    if (simulationState.time % 5 === 0) {
      updateRoomAvailability()
    }

    // Update current hour
    const newHour = Math.floor(simulationState.time / 60) + 8
    if (newHour !== simulationState.currentHour) {
      await updateState({ currentHour: newHour })
    }

    // Check if all rooms are clean
    const allClean = simulationState.building.floors.every((floor) =>
      Object.values(floor.rooms).every((room) => room.state === "Clean"),
    )
    if (allClean) {
      setIsComplete(true)
      setIsRunning(false)
    }
  }, [simulationState, updateRoomAvailability])

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
      // Initialize room availability
      updateRoomAvailability() 
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
              {Object.entries(floor.rooms).map(([roomNumber, room]) => (
                <div
                  key={roomNumber}
                  className={`w-16 h-16 border-2 
                    ${room.state === "Clean" ? "bg-green-200" : "bg-red-200"} 
                    ${room.availability === "Occupied" ? "bg-yellow-200" : ""}
                    ${room.availability === "Unexpected" ? "bg-purple-200" : ""}
                    ${
                      simulationState.robotLocation.floor === floorIndex &&
                      simulationState.robotLocation.position === Number(roomNumber)
                        ? "border-blue-500"
                        : "border-gray-300"
                    } rounded-lg flex items-center justify-center relative`}
                >
                  <div className="text-center">
                    <div className="text-sm font-bold">{roomNumber}</div>
                    {room.availability === "Occupied" && <div className="text-xs text-red-500">In Use</div>}
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
        <div>Current Time: {simulationState.currentHour}:00</div>
        {isComplete && <div className="text-green-600 font-bold mt-2">All rooms are clean! Simulation complete.</div>}
      </div>
    </div>
  )
}