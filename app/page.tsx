import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-cyan-100">
      <h1 className="text-4xl font-bold text-gray-800">
      Vacuum Cleaner 
      </h1>
      <h1 className="text-4xl font-bold mb-8 text-gray-800">
      Robot 
      </h1>
      <div className="flex flex-col space-y-4"> 
        <Link href="/task1">
          <Button className="w-64">TASK1 [easy,medium,hard]</Button>
        </Link>
        <Link href="/task2">
          <Button className="w-64">TASK2 [easy,medium]</Button>
        </Link>
        <Link href="/task2.1">
          <Button className="w-64">TASK2[hard] Multi-Floor</Button>
        </Link>
      </div>
    </div>
  )
}
