import * as fs from 'fs';
import { getAllMedia } from './src/media/media';
import { downloadMedia, prepareMedia } from './src/example';
import { join } from 'path';

const run = async () => {
    const POST_URL = "https://www.threads.net/@na.jaemin0813/post/Cucv791P_d-"
    const LOCATION = 'download'
    const DATE = new Date().getTime()

    // Create folder if not exist
    if (!fs.existsSync(LOCATION)) fs.mkdirSync(LOCATION)

    // Grab all media
    const getMedia = (await getAllMedia(POST_URL) as any)

    // Check if error exist
    if (getMedia?.msg) {
        console.log(`Error: ${getMedia.msg}`)
        return;
    }

    for await (const data of getMedia.media) {
        let dirLocation = join(`${LOCATION}`, `${data.user.username}-${DATE}/`)
        if (!fs.existsSync(dirLocation)) fs.mkdirSync(dirLocation)
        let media = prepareMedia(data, dirLocation)
        await downloadMedia(media)
    }

}

(async () => {
    await run()
})()