"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Room = "A" | "B"
type CleanState = "clean" | "dirty"
type Difficulty = "Easy" | "Medium" | "Hard"

interface SimulationState {
  robotPosition: Room
  roomA: CleanState
  roomB: CleanState
  moves: number
  cleans: number
}

export default function VacuumCleanerSimulation() {
  const [simulation, setSimulation] = useState<SimulationState>({
    robotPosition: "A",
    roomA: "clean",
    roomB: "clean",
    moves: 0,
    cleans: 0,
  })
  const [isRunning, setIsRunning] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy")
  const [initialState, setInitialState] = useState<SimulationState | null>(null)

  const initializeEnvironment = useCallback(() => {
    let newState: SimulationState

    switch (difficulty) {
      case "Easy":
        newState = {
          robotPosition: "A",
          roomA: "dirty",
          roomB: "dirty",
          moves: 0,
          cleans: 0,
        }
        break
      case "Medium":
      case "Hard":
        newState = {
          robotPosition: Math.random() < 0.5 ? "A" : "B",
          roomA: Math.random() < 0.5 ? "clean" : "dirty",
          roomB: Math.random() < 0.5 ? "clean" : "dirty",
          moves: 0,
          cleans: 0,
        }
        break
    }

    setSimulation(newState)
    setInitialState(newState)
  }, [difficulty])

  const moveRobot = useCallback(() => {
    setSimulation((prev) => {
      const newPosition: Room = prev.robotPosition === "A" ? "B" : "A"
      const newState: SimulationState = {
        ...prev,
        robotPosition: newPosition,
        moves: prev.moves + 1,
      }

      if (newState[`room${newPosition}`] === "dirty") {
        newState[`room${newPosition}`] = "clean"
        newState.cleans += 1
      }

      return newState
    })
  }, [])

  const changeEnvironment = useCallback(() => {
    if (difficulty === "Hard") {
      setSimulation((prev) => ({
        ...prev,
        roomA: Math.random() < 0.3 ? "dirty" : prev.roomA,
        roomB: Math.random() < 0.3 ? "dirty" : prev.roomB,
      }))
    }
  }, [difficulty])

  useEffect(() => {
    let moveInterval: NodeJS.Timeout
    let changeInterval: NodeJS.Timeout

    if (isRunning) {
      moveInterval = setInterval(moveRobot, 1000)
      if (difficulty === "Hard") {
        changeInterval = setInterval(changeEnvironment, 3000)
      }
    }

    return () => {
      clearInterval(moveInterval)
      clearInterval(changeInterval)
    }
  }, [isRunning, moveRobot, changeEnvironment, difficulty])

  const startSimulation = () => {
    initializeEnvironment()
    setIsRunning(true)
  }

  const stopSimulation = () => {
    setIsRunning(false)
  }

  const resetSimulation = () => {
    if (initialState) {
      setSimulation(initialState)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Vacuum Cleaner Simulation, <span className="font-bold text-black">TASK 1[easy,medium,hard]</span></h1>
      <div className="mb-4">
        <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`p-8 border rounded-lg ${simulation.roomA === "dirty" ? "bg-red-200" : "bg-green-200"}`}>
          Room A{simulation.robotPosition === "A" && <div className="mt-4 text-4xl">🤖</div>}
        </div>
        <div className={`p-8 border rounded-lg ${simulation.roomB === "dirty" ? "bg-red-200" : "bg-green-200"}`}>
          Room B{simulation.robotPosition === "B" && <div className="mt-4 text-4xl">🤖</div>}
        </div>
      </div>
      <div className="flex space-x-4 mb-4">
        <Button onClick={startSimulation} disabled={isRunning}>
          Start Simulation
        </Button>
        <Button onClick={stopSimulation} disabled={!isRunning}>
          Stop Simulation
        </Button>
        <Button onClick={resetSimulation} disabled={isRunning || !initialState}>
          Reset Simulation
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-bold">Stats</h2>
          <p>Difficulty: {difficulty}</p>
          <p>Moves: {simulation.moves}</p>
          <p>Cleans: {simulation.cleans}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h2 className="font-bold">Current State</h2>
          <p>Robot Position: Room {simulation.robotPosition}</p>
          <p>Room A: {simulation.roomA}</p>
          <p>Room B: {simulation.roomB}</p>
        </div>
      </div>
      <div className="mt-4 max-w-full text-center">
        <h2 className="text-xl font-bold mb-2">Is the robot rational?</h2>
        <p>
          Yes, the robot is rational. It consistently takes actions that maximize its performance measure (cleaning
          dirty rooms) based on its percepts (the state of the current room). The robot cleans when the room is dirty
          and moves to the other room when the current room is clean, which is a rational behavior for its given task.
        </p>
      </div>
    </div>
  )
}

