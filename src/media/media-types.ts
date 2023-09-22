import { ThreadsHdProfilePicVersion, ThreadsUser } from "threads-api"

export interface ThreadsMedia {
    user: ThreadsUser,
    type: string,
    media: OriginalMedia[],
    width: number,
    height: number,
    caption: string | undefined,
    has_audio: boolean | undefined,
    taken_at: number,
    thumbnail?: ThreadsHdProfilePicVersion[] | undefined
}
export interface OriginalMedia {
    width?: number,
    height?: number,
    url: string
}

export interface getAllMediaInterface<T extends any> {
    (url: string): Promise<T>;
}