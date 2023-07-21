const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const getPostData = async (id) => {
    let request = await fetch("https://www.threads.net/api/graphql", {
        "headers": {
            "content-type": "application/x-www-form-urlencoded",
            "x-asbd-id": "129477",
            "x-fb-friendly-name": "BarcelonaPostPageQuery",
            "x-fb-lsd": "N1RcROyvW2TeIOAP1NF1Rw",
            "x-ig-app-id": "238260118697367",
        },
        "body": `av=0&__user=0&__a=1&__req=1&__hs=19544.HYP%3Abarcelona_web_pkg.2.1..0.0&dpr=1&__ccg=EXCELLENT&__rev=1007797318&__s=4u5vr5%3A037tlu%3A3ofhp0&__hsi=7252781234368541407&__dyn=7xeUmwlEnwn8K2WnFw9-2i5U4e0yoW3q32360CEbo1nEhw2nVE4W0om78b87C0yE465o-cw5Mx62G3i0Bo7O2l0Fwqo31wnEfovwRwlE-U2zxe2Gew9O22362W2K0zK5o4q0GpovU1aUbodEGdwtU2ewbS1LwTwNwLw8O1pwr82gxC&__csr=gBGijox9k00lmRxy2Lxmckwky88z1aq1-zE19U4Oex2re7E8k2ybw8ZoD6G6O8mUQ4827x-0DofU466i0tk13gN02oPA0Wo7Z08423zog24g&__comet_req=29&lsd=N1RcROyvW2TeIOAP1NF1Rw&jazoest=21774&__spin_r=1007797318&__spin_b=trunk&__spin_t=1688669723&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=BarcelonaPostPageQuery&variables=%7B%22postID%22%3A%22${id}%22%7D&server_timestamps=true&doc_id=5587632691339264`,
        "method": "POST"
    });
    let response = await request.json()
    return response
}
const getPostId = async (url) => {
    try {
        let request = await fetch(url)
        let response = await request.text()
        let postId = response.match(/{"post_id":"(.*?)"}/)
        return postId[1]
    } catch (err) {
        return null
    }
}
const getAllMedia = async (url, i = 0) => {
    try {
        let postId = await getPostId(url)
        if (!postId) return { msg: "too many usage for today. try again later" }
        let postData = await getPostData(postId)
        let uname = postData.data.data.containing_thread.thread_items[0].post.user.username || "err"

        let allMedia = postData.data.data.containing_thread.thread_items.map(thread => {
            return getMedia(thread)
        })
        if (postData.data.data.reply_threads.length > 0) {
            let contThread = postData.data.data.reply_threads[0] || null
            if (contThread.thread_items[0].post.user.username == uname) {
                if (contThread && contThread.length > 0) contThread = contThread.thread_items.filter(t => (t.post.user.username == uname))
                if (contThread && contThread.thread_items.length > 0) allMedia = [...allMedia, ...contThread.thread_items.map(t => (getMedia(t)))]
            }
        }
        return { media: allMedia }
    } catch (err) {
        console.log(err)
        if (i >= 3) return;
        i++
        return { msg: "unknown error" }
    }
}
const getMedia = (thread) => {
    let media = thread.post
    media = media.text_post_app_info.share_info.quoted_post ? media.text_post_app_info.share_info.quoted_post : media // quoted post
    media = media.text_post_app_info.share_info.reposted_post ? media.text_post_app_info.share_info.reposted_post : media // reposted post
    if (media.carousel_media) {
        if (media.carousel_media.video_versions) return {
            user: media.user,
            type: "videos",
            media: media.carousel_media.map(media => (media.video_versions[0])),
            width: media.original_width,
            height: media.original_height,
            caption: (media.caption) ? media.caption.text : "",
            has_audio: media.has_audio,
            taken_at: media.taken_at
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
    if (media.video_versions.length > 0) return {
        user: media.user,
        type: "video",
        media: media.video_versions[0],
        width: media.original_width,
        height: media.original_height,
        caption: (media.caption) ? media.caption.text : "",
        has_audio: media.has_audio,
        taken_at: media.taken_at,
        thumbnail: media.image_versions2.candidates.filter(img => (img.width == media.original_width && img.height == media.original_height))
    }
    let medtest = media.image_versions2.candidates
        .filter(img => (img.width == media.original_width && img.height == media.original_height))

    medtest = medtest.length >= 1 ? medtest : []
    medtest = media.image_versions2.candidates[0] ? [media.image_versions2.candidates[0]] : medtest
    // console.log("len", media.image_versions2.candidates
    //     .filter(img => (img.width == media.original_width && img.height == media.original_height))
    //     .length
    // )

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