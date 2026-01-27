import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"placeholder:text-muted-foreground h-10 border bg-background px-3 text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				className
			)}
			{...props}
		/>
	)
}

export { Input }
