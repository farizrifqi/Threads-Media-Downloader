import { BASE_API_URL } from "./constants"
import { OriginalMedia, ThreadsMedia } from "./media-types"
import axios from "axios"

const _cleanUrl = (url: string) => {
  url = url.split("?")[0]
  const lastDigit = url[url.length - 1]
  const isURLClean = lastDigit == "?" || lastDigit == "/"
  if (isURLClean) return _cleanUrl(url.substring(0, url.length - 1))
  return url
}

const _getThreadId = (url: string) => {
  return url.split("/")[url.split("/").length - 1]
}

const _getPostId = (url: string) => {
  try {
    url = _cleanUrl(url)
    let threadID = _getThreadId(url)
    threadID = threadID.split("?")[0]
    threadID = threadID.replace(/\s/g, "")
    threadID = threadID.replace(/\//g, "")
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    let postID: bigint = 0n
    for (const letter of threadID) {
      postID = postID * 64n + BigInt(alphabet.indexOf(letter))
    }
    return postID.toString()
  } catch (err) {
    return null
  }
}

const _getPostData = async (postId: string, i: number = 0): Promise<any> => {
  try {
    const response = await axios.request({
      method: "POST",
      data: `av=0&__user=0&__a=1&__req=1&__hs=19544.HYP%3Abarcelona_web_pkg.2.1..0.0&dpr=1&__ccg=EXCELLENT&__rev=1007797318&__s=4u5vr5%3A037tlu%3A3ofhp0&__hsi=7252781234368541407&__dyn=7xeUmwlEnwn8K2WnFw9-2i5U4e0yoW3q32360CEbo1nEhw2nVE4W0om78b87C0yE465o-cw5Mx62G3i0Bo7O2l0Fwqo31wnEfovwRwlE-U2zxe2Gew9O22362W2K0zK5o4q0GpovU1aUbodEGdwtU2ewbS1LwTwNwLw8O1pwr82gxC&__csr=gBGijox9k00lmRxy2Lxmckwky88z1aq1-zE19U4Oex2re7E8k2ybw8ZoD6G6O8mUQ4827x-0DofU466i0tk13gN02oPA0Wo7Z08423zog24g&__comet_req=29&lsd=N1RcROyvW2TeIOAP1NF1Rw&jazoest=21774&__spin_r=1007797318&__spin_b=trunk&__spin_t=1688669723&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=BarcelonaPostPageQuery&variables=%7B%22postID%22%3A%22${postId}%22%7D&server_timestamps=true&doc_id=5587632691339264`,
      url: BASE_API_URL,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-asbd-id": "129477",
        "x-fb-friendly-name": "BarcelonaPostPageQuery",
        "x-fb-lsd": "N1RcROyvW2TeIOAP1NF1Rw",
        "x-ig-app-id": "238260118697367"
      }
    })
    return response?.data?.data?.data
  } catch (err) {
    if (i < 2) return await _getPostData(postId, i++)
    return null
  }
}

const _getMedia = (thread: any): ThreadsMedia => {
  let media = thread.post

  // Quoted post
  if (media.text_post_app_info.share_info.quoted_post && media.carousel_media && (!media.image_versions2 || media.image_versions2.length == 0) && (!media.video_versions || media.video_versions.length == 0)) {
    media = media.text_post_app_info.share_info.quoted_post
  }

  // reposted post
  if (media.text_post_app_info.share_info.reposted_post && media.carousel_media && (!media.image_versions2 || media.image_versions2.length == 0) && (!media.video_versions || media.video_versions.length == 0)) {
    media = media.text_post_app_info.share_info.reposted_post
  }

  // Check if multiple media
  if (media.carousel_media) {
    // Check if media was a video
    if (media.carousel_media.video_versions) {
      return {
        user: media.user,
        type: "videos",
        media: media.carousel_media.map((media: { video_versions: string }) => media.video_versions[0]),
        width: media.original_width,
        height: media.original_height,
        caption: media.caption ? media.caption.text : "",
        has_audio: media.has_audio,
        taken_at: media.taken_at,
        thumbnail: undefined
      }
    }

    return {
      user: media.user,
      type: "photos",
      media: media.carousel_media.map((media: { image_versions2: { candidates: any[] } }) => media.image_versions2.candidates[0]),
      width: media.original_width,
      height: media.original_height,
      caption: media.caption ? media.caption.text : "",
      has_audio: media.has_audio,
      taken_at: media.taken_at,
      thumbnail: undefined
    }
  }

  // Check if contain video
  if (media.video_versions && media.video_versions.length > 0) {
    let thumbnail = media.image_versions2.candidates.filter((img) => img.width == media.original_width && img.height == media.original_height)

    thumbnail = thumbnail.length > 0 ? thumbnail : [media.image_versions2.candidates[0]]

    return {
      user: media.user,
      type: "video",
      media: media.video_versions[0],
      width: media.original_width,
      height: media.original_height,
      caption: media.caption ? media.caption.text : "",
      has_audio: media.has_audio,
      taken_at: media.taken_at,
      thumbnail
    }
  }

  let selectedMedia = media.image_versions2.candidates.filter((img) => img.width == media.original_width && img.height == media.original_height)

  selectedMedia = selectedMedia.length >= 1 ? selectedMedia : []
  selectedMedia = media.image_versions2.candidates[0] ? [media.image_versions2.candidates[0]] : selectedMedia

  return {
    user: media.user,
    type: "photo",
    media: selectedMedia,
    width: media.original_width,
    height: media.original_height,
    caption: media.caption ? media.caption.text : "",
    has_audio: media.has_audio,
    taken_at: media.taken_at,
    thumbnail: undefined
  }
}

const getAllMedia = async (url): Promise<{ media: ThreadsMedia[] | ThreadsMedia } | any> => {
  try {
    const postId = _getPostId(_cleanUrl(url))
    if (!postId) return { msg: "invalid url" }

    const postData = await _getPostData(postId)
    if (!postData) return { msg: "invalid url or blocked." }

    const containedThreads: any[] = postData.containing_thread.thread_items
    if (!containedThreads[0]?.post?.user) return { msg: "thread user invalid / inactive" }

    // Get author username
    const uname = containedThreads[0].post.user.username || undefined

    // Get all media from original post
    let allMedia = containedThreads.map((thread) => _getMedia(thread))
    const replyThreadsData = postData.reply_threads

    // Check if post containing reply
    if (replyThreadsData && replyThreadsData.length > 0) {
      const firstReply = replyThreadsData[0] || null
      const isFirstReplySameAsAuthor = firstReply?.thread_items[0]?.post?.user?.username == uname

      if (firstReply.thread_items.length > 0 && isFirstReplySameAsAuthor) {
        // Replies with same author
        let threadsReplies: any[] = []

        if (firstReply && firstReply.thread_items.length > 0) {
          threadsReplies = firstReply.thread_items.filter((t) => t.post.user.username == uname)
        }

        // Check if temporaryThreads is not empty
        if (firstReply && threadsReplies.length > 0) {
          // Merge
          allMedia = [
            ...allMedia,
            // Get all media from temporaryThreads
            ...threadsReplies.map((t) => _getMedia(t))
          ]
        }
      }
    }

    if ((allMedia[0].media as any).length === undefined) {
      allMedia = allMedia.filter((m) => (m.media as OriginalMedia)?.url)
    } else {
      allMedia = allMedia.filter((m) => (m.media as OriginalMedia[]).length > 0)
    }

    return {
      media: allMedia
    }
  } catch (err) {
    console.log(err)
    return { msg: "unknown error" }
  }
}

export { getAllMedia }
