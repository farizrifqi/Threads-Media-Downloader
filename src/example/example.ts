import * as fs from "fs"
import { join } from "path"
import { OriginalMedia, ThreadsMedia } from "../media/media-types"
import axios from "axios"
import { getAllMedia } from "../media/media"

interface DownloadAbleMedia {
  url: string
  fileName: string
  filePath: fs.PathOrFileDescriptor
}

const downloadMedia = async (media: DownloadAbleMedia[], i = 0): Promise<void> => {
  i++
  if (media.length == 0) return
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

const prepareMedia = (media: any, location: string) => {
  if (media.type == "photo") {
    media.media = media.media.filter((m: OriginalMedia) => m.height == media.height && m.width == media.width)
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

const run = async () => {
  const POST_URL = "https://www.threads.net/@na.jaemin0813/post/Cucv791P_d-"
  const LOCATION = "download"
  const DATE = new Date().getTime()

  // Create folder if not exist
  if (!fs.existsSync(LOCATION)) fs.mkdirSync(LOCATION)

  // Grab all media
  const getMedia = (await getAllMedia(POST_URL)) as any

  // Check if error exist
  if (getMedia?.msg) {
    console.log(`Error: ${getMedia.msg}`)
    return
  }

  for await (const data of getMedia.media) {
    let dirLocation = join(`${LOCATION}`, `${data.user.username}-${DATE}/`)
    if (!fs.existsSync(dirLocation)) fs.mkdirSync(dirLocation)
    let media = prepareMedia(data, dirLocation)
    await downloadMedia(media)
  }
}

;(async () => {
  await run()
})()
