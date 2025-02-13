import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-cyan-100">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Robot Simulations</h1>
      <div className="space-y-4">
        <Link href="/task1">
          <Button className="w-64">Vacuum Cleaner Simulation</Button>
        </Link>
        <Link href="/task2">
          <Button className="w-64">MUBAS Corridor Robot Simulation</Button>
        </Link>
        <Link href="/task2.1">
          <Button className="w-64">MUBAS Multi-Floor Robot Simulation</Button>
        </Link>
      </div>
    </div>
  )
}
