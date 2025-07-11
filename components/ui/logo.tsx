import { cn } from "@/lib/utils"
import { FileText } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  showText?: boolean
  className?: string
  disableLink?: boolean
}

export function Logo({ showText = true, className, disableLink = false }: LogoProps) {
  const content = (
    <>
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
    </>
  );

  if (disableLink) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {content}
      </div>
    );
  }

  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      {content}
    </Link>
  )
}