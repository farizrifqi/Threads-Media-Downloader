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
        "body": new URLSearchParams({
            lsd: "N1RcROyvW2TeIOAP1NF1Rw",
            variables: `{"postID":"${id}"}`,
            doc_id: 5587632691339264
        }),
        "method": "POST"
    });
    let response = await request.json()
    console.log(response)
    return response
}
const getPostId = async (url) => {
    let request = await fetch(url)
    let response = await request.text()
    let postId = response.match(/{"post_id":"(.*?)"}/)
    return postId[1]
}
const getAllMedia = async (url) => {
    let postId = await getPostId(url)
    let postData = await getPostData(postId)
    let allMedia = postData.data.data.containing_thread.thread_items.map(thread => (getMedia(thread)))
    return allMedia
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
            height: media.original_height
        }
        return {
            user: media.user,
            type: "photos",
            media: media.carousel_media.map(media => (media.image_versions2.candidates[0])),
            width: media.original_width,
            height: media.original_height
        }
    }

    if (media.video_versions.length > 0) return {
        user: media.user,
        type: "video",
        media: media.video_versions[0],
        width: media.original_width,
        height: media.original_height
    }
    return {
        user: media.user,
        type: "photo",
        media: media.image_versions2.candidates,
        width: media.original_width,
        height: media.original_height
    }
}

module.exports = { getAllMedia }