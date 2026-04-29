declare module 'react-simple-maps' {
  import type { ComponentType, CSSProperties, MouseEvent, PointerEvent, ReactNode } from 'react'

  export interface RsmGeography {
    rsmKey: string
    properties: { name: string }
  }

  export const ComposableMap: ComponentType<{
    projection?: string
    style?: CSSProperties
    children?: ReactNode
  }>

  export const Geographies: ComponentType<{
    geography: string
    children: (args: {
      geographies: RsmGeography[]
      path: { centroid(feature: RsmGeography): [number, number] }
    }) => ReactNode
  }>

  export const Geography: ComponentType<{
    geography: RsmGeography
    fill?: string
    stroke?: string
    strokeWidth?: number
    className?: string
    style?: { default?: CSSProperties; hover?: CSSProperties; pressed?: CSSProperties }
    onMouseEnter?: (evt: MouseEvent<SVGPathElement>) => void
    onMouseMove?: (evt: MouseEvent<SVGPathElement>) => void
    onMouseLeave?: () => void
    onPointerEnter?: (evt: PointerEvent<SVGPathElement>) => void
    onPointerMove?: (evt: PointerEvent<SVGPathElement>) => void
    onPointerLeave?: () => void
  }>
}
