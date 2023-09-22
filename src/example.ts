import * as fs from 'fs';
import { join } from 'path';
import { OriginalMedia, ThreadsMedia } from './media/media-types';
import axios from 'axios';

interface DownloadAbleMedia {
    url: string,
    fileName: string,
    filePath: fs.PathOrFileDescriptor
}

const downloadMedia = async (media: DownloadAbleMedia[], i = 0): Promise<void> => {
    i++
    if (media.length == 0) return;
    console.log(`[${i}] Downloading ${media[0].fileName}`)

    // Download media data
    const request = await axios.get(media[0].url, { responseType: "arraybuffer" })
    const bos = Buffer.from(await request.data)

    // Save media data as image/video
    fs.writeFileSync(media[0].filePath, bos)

    // Shift media array
    media.shift()

    // Do Recursive
    return await downloadMedia(media, i)
}

const prepareMedia = (media: ThreadsMedia, location: string) => {
    if (media.type == "photo") {
        media.media = media.media.filter((m: OriginalMedia) => (m.height == media.height && m.width == media.width))
    }
    return media.media.map((m, i: number) => {
        let url = m.url

        // Set file format based on "type" property
        const fileFormat = media.type.includes("video") ? "mp4" : "jpg"
        const fileName = media.type.includes("video") ? `video-${i}.${fileFormat}` : `original-${new Date().getTime()}-${i}.${fileFormat}`
        const filePath = join(location, fileName)

        return { url, fileName, filePath }
    })
}


export { prepareMedia, downloadMedia }