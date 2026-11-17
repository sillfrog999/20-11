export type UniverseScene =
  | 'THE_VOID'            // 00:00–00:10
  | 'CONNECT_THE_STARS'   // 00:10–00:25
  | 'OUR_CONSTELLATION'   // 00:25–00:40
  | 'THE_BRIGHTEST_STAR'  // 00:40–00:50
  | 'A_LETTER_FOR_YOU'    // 00:50–01:00+
  | 'WARP_TRANSITION'     // Exiting to main site

export interface StarPhoto {
  id: string
  src: string
  caption: string
  subtext?: string
  placeholderText?: string
  orbitSpeed?: number
  baseAngle?: number
}

export interface UniverseManifest {
  title: string
  description: string
  photos: StarPhoto[]
}

export interface GeometryShape {
  type: 'triangle' | 'tetrahedron' | 'sphere' | 'infinity'
  progress: number // 0 to 1
  opacity: number
}
