export interface ThreadsMedia {
  user: any
  type: "photo" | "photos" | "video" | "videos"
  media: Array<OriginalMedia> | OriginalMedia
  width: number
  height: number
  caption: string | undefined
  has_audio: boolean | undefined
  taken_at: number
  thumbnail?: any[] | undefined
}
export interface OriginalMedia {
  width?: number
  height?: number
  url: string
}
