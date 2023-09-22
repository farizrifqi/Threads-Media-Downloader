import { Candidate, ThreadItem, ThreadsAPI } from "threads-api";
import { ThreadsMedia, getAllMediaInterface } from "./media-types";

interface CustomError {
    msg: string
}

const threadsAPI = new ThreadsAPI({ deviceID: "android-4akefua4jdi00000" });

const cleanUrl = (url: string): string => {
    url = url.split("?")[0]
    const lastDigit = url[url.length - 1]
    const isURLClean = lastDigit == "?" || lastDigit == "/"
    if (isURLClean) return cleanUrl(url.substring(0, url.length - 1))
    return url
}

const getPostData = async (postId: string) => {
    try {
        const postData = await threadsAPI.getThreads(postId)
        return postData
    } catch (err) {
        console.log("Error on getPostData()", err)
        return null
    }
}

const getMedia = (thread: ThreadItem): ThreadsMedia => {

    let media = thread.post

    // Quoted post
    if (media.text_post_app_info.share_info.quoted_post) {
        media = media.text_post_app_info.share_info.quoted_post
    }

    // reposted post
    if (media.text_post_app_info.share_info.reposted_post) {
        media = media.text_post_app_info.share_info.reposted_post
    }

    // Check if multiple media
    if (media.carousel_media) {

        // Check if media was a video
        if (media.carousel_media.video_versions) {
            return {
                user: media.user,
                type: "videos",
                media: media.carousel_media.map((media: { video_versions: string; }) => (
                    media.video_versions[0]
                )),
                width: media.original_width,
                height: media.original_height,
                caption: (media.caption) ? media.caption.text : "",
                has_audio: media.has_audio,
                taken_at: media.taken_at,
                thumbnail: undefined
            }
        }

        return {
            user: media.user,
            type: "photos",
            media: media.carousel_media.map((media: { image_versions2: { candidates: Candidate[]; } }) => (
                media.image_versions2.candidates[0]
            )),
            width: media.original_width,
            height: media.original_height,
            caption: (media.caption) ? media.caption.text : "",
            has_audio: media.has_audio,
            taken_at: media.taken_at,
            thumbnail: undefined
        }
    }

    // Check if contain video
    if (media.video_versions && media.video_versions.length > 0) {

        let thumbnail = media.image_versions2.candidates.filter((img) => (
            img.width == media.original_width && img.height == media.original_height
        ))

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

    let selectedMedia = media.image_versions2.candidates.filter((img) => (
        img.width == media.original_width && img.height == media.original_height
    ))

    selectedMedia = selectedMedia.length >= 1 ? selectedMedia : []
    selectedMedia = media.image_versions2.candidates[0] ? [media.image_versions2.candidates[0]] : selectedMedia

    return {
        user: media.user,
        type: "photo",
        media: selectedMedia,
        width: media.original_width,
        height: media.original_height,
        caption: (media.caption) ? media.caption.text : "",
        has_audio: media.has_audio,
        taken_at: media.taken_at,
        thumbnail: undefined
    }
}

const getAllMedia: getAllMediaInterface<{ media: ThreadsMedia[] } | CustomError> = async (url) => {

    try {
        const postId = threadsAPI.getPostIDfromURL(cleanUrl(url))
        if (!postId) return { msg: "invalid url" }

        const postData = await getPostData(postId)
        if (!postData) return { msg: "invalid url or blocked." }

        const containedThreads: ThreadItem[] = postData.containing_thread.thread_items
        if (!containedThreads[0]?.post?.user) return { msg: "thread user invalid / inactive" }

        // Get author username
        const uname = containedThreads[0].post.user.username || undefined

        // Get all media from original post
        let allMedia = containedThreads.map(thread => (
            getMedia(thread)
        ))

        const replyThreadsData = postData.reply_threads;

        // Check if post containing reply
        if (replyThreadsData && replyThreadsData.length > 0) {

            const firstReply = replyThreadsData[0] || null;
            const isFirstReplySameAsAuthor = firstReply.thread_items[0].post.user.username == uname;

            if (firstReply.thread_items.length > 0 && isFirstReplySameAsAuthor) {

                // Replies with same author
                let threadsReplies: ThreadItem[] = []

                if (firstReply && firstReply.thread_items.length > 0) {
                    threadsReplies = firstReply.thread_items.filter(t => (t.post.user.username == uname))
                }

                // Check if temporaryThreads is not empty
                if (firstReply && threadsReplies.length > 0) {

                    // Merge
                    allMedia = [
                        ...allMedia,
                        // Get all media from temporaryThreads
                        ...threadsReplies.map(t => (
                            getMedia(t)
                        ))
                    ]
                }

            }

        }

        allMedia = allMedia.filter((m) => (m.media.length > 0))

        return {
            media: allMedia
        }

    } catch (err) {
        console.log(err)
        return { msg: "unknown error" }
    }
}
export { getAllMedia }