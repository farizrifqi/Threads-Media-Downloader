const { ThreadsAPI } = require('threads-api');

const threadsAPI = new ThreadsAPI({ deviceID: "android-4akefua4jdi00000" });

const cleanUrl = (url) => {
    url = url.split("?")[0]
    if (url[url.length - 1] == "?" || url[url.length - 1] == "/") return cleanUrl(url.substring(0, url.length - 1))
    return url
}
const getPostId = (url) => (threadsAPI.getPostIDfromURL(url))
const getPostData = async (postId) => {
    try {
        let postData = await threadsAPI.getThreads(postId)
        return postData
    } catch (err) {
        console.log("Error on getPostData", err)
        return null
    }
}
const getAllMedia = async (url) => {
    try {
        let postId = getPostId(url)
        if (!postId) return { msg: "invalid url" }
        let postData = await getPostData(postId)
        if (!postData) return { msg: "invalid url or blocked." }
        if (!postData.containing_thread.thread_items[0].post.user) return { msg: "thread user invalid / inactive" }
        let uname = postData.containing_thread.thread_items[0].post.user.username || "err"
        let allMedia = postData.containing_thread.thread_items.map(thread => {
            return getMedia(thread)
        })
        if (postData.reply_threads.length > 0) {
            let contThread = postData.reply_threads[0] || null
            if (contThread.thread_items.length > 0 && contThread.thread_items[0].post.user.username == uname) {
                if (contThread && contThread.length > 0) contThread = contThread.thread_items.filter(t => (t.post.user.username == uname))
                if (contThread && contThread.thread_items.length > 0) allMedia = [...allMedia, ...contThread.thread_items.map(t => (getMedia(t)))]
            }

        }
        return { media: allMedia }
    } catch (err) {
        console.log(err)
        return { msg: "unknown error" }
    }
}

const getMedia = (thread) => {
    let media = thread.post
    media = media.text_post_app_info.share_info.quoted_post ? media.text_post_app_info.share_info.quoted_post : media // quoted post
    media = media.text_post_app_info.share_info.reposted_post ? media.text_post_app_info.share_info.reposted_post : media // reposted post
    if (media.carousel_media) {
        if (media.carousel_media.video_versions) {
            return {
                user: media.user,
                type: "videos",
                media: media.carousel_media.map(media => (media.video_versions[0])),
                width: media.original_width,
                height: media.original_height,
                caption: (media.caption) ? media.caption.text : "",
                has_audio: media.has_audio,
                taken_at: media.taken_at
            }
        }

        return {
            user: media.user,
            type: "photos",
            media: media.carousel_media.map(media => (media.image_versions2.candidates[0])),
            width: media.original_width,
            height: media.original_height,
            caption: (media.caption) ? media.caption.text : "",
            has_audio: media.has_audio,
            taken_at: media.taken_at
        }
    }
    if (media.video_versions.length > 0) {
        let thumbnail = media.image_versions2.candidates.filter(img => (img.width == media.original_width && img.height == media.original_height))
        thumbnail = thumbnail.length > 0 ? thumbnail : [media.image_versions2.candidates[0]]

        return {
            user: media.user,
            type: "video",
            media: media.video_versions[0],
            width: media.original_width,
            height: media.original_height,
            caption: (media.caption) ? media.caption.text : "",
            has_audio: media.has_audio,
            taken_at: media.taken_at,
            thumbnail
        }
    }
    let medtest = media.image_versions2.candidates.filter(img => (img.width == media.original_width && img.height == media.original_height))
    medtest = medtest.length >= 1 ? medtest : []
    medtest = media.image_versions2.candidates[0] ? [media.image_versions2.candidates[0]] : medtest

    return {
        user: media.user,
        type: "photo",
        media: medtest,
        width: media.original_width,
        height: media.original_height,
        caption: (media.caption) ? media.caption.text : "",
        has_audio: media.has_audio,
        taken_at: media.taken_at
    }
}

module.exports = { getAllMedia }