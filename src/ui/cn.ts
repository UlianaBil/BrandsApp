import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * The platform's `cn`, verbatim — `@brandsapp/ui` isn't available here, and the
 * ported primitives must behave identically in both repos or the two copies
 * drift on the one helper every component uses.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
