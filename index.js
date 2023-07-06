const fs = require('fs')
const { join } = require('path')
const { getAllMedia } = require('./media')

const downloadMedia = async (media, i = 0) => {
    i++
    if (media.length == 0) return;
    console.log(`[${i}] Downloading ${media[0].fileName}`)
    const request = await fetch(media[0].url)
    const blob = await request.blob()
    const bos = Buffer.from(await blob.arrayBuffer())
    fs.writeFileSync(media[0].filePath, bos)
    media.shift()
    return await downloadMedia(media, i)
}
const prepareMedia = (media, location) => {
    return media.media.map(m => {
        let url = m.url
        let fileName
        const fileType = m.url.includes('.mp4') ? 'mp4' : 'jpg'
        if (fileType == 'mp4') {
            fileName = `video-${i}.mp4`
        } else {
            fileName = m.width == media.width && m.height == media.height ? 'original.jpg' : `${m.width}x${m.height}.jpg`
        }
        const filePath = join(location, fileName)

        return { url, fileName, filePath }
    })
}
(async () => {
    const POST_URL = "MEDIA_URL"
    const LOCATION = 'download'
    const date = new Date().getTime()

    if (!fs.existsSync(LOCATION)) fs.mkdirSync(LOCATION)
    let postData = await getAllMedia(POST_URL)

    for await (const data of postData) {
        let dirLocation = join(`${LOCATION}`, `${data.user.username}-${date}/`)
        if (!fs.existsSync(dirLocation)) fs.mkdirSync(dirLocation)

        let media = prepareMedia(data, dirLocation)
        await downloadMedia(media)
    }
})()