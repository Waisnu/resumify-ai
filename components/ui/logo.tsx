import { cn } from "@/lib/utils"
import { FileText } from "lucide-react"
import Image from "next/image"

interface LogoProps {
  showText?: boolean
  className?: string
}

export function Logo({ showText = true, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <FileText className="h-5 w-5 text-primary" />
        <Image
          src="/assets/stars.png"
          alt="Stars"
          width={16}
          height={16}
          className="absolute -top-1 -right-1"
        />
      </div>
      {showText && (
        <span className="text-xl font-bold tracking-tighter text-foreground">
          Resumify
        </span>
      )}
    </div>
  )
}