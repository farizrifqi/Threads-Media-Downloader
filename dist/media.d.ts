import { ThreadsMedia } from "./media-types";
declare const getAllMedia: (url: any) => Promise<{
    media: ThreadsMedia[] | ThreadsMedia;
} | any>;
export { getAllMedia };
