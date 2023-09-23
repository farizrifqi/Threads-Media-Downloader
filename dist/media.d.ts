import { ThreadsMedia } from "./media-types"
declare const getAllMedia: (url: any) => Promise<
  | {
      media: ThreadsMedia[]
    }
  | any
>
export { getAllMedia }
