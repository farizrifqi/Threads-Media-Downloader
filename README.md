# ThreadsMediaDownloader

🚫 No longer using [threads-api](https://github.com/junhoyeo/threads-api) since it discontinued. Bye 😥.

### Features

- Download multiple media in a thread
- Support image & video

## Quickstart

#### NPM

```
npm install threadsdl
```

#### YARN

```
yarn install threadsdl
```

## Example Usage

```ts
import { getAllMedia } from "threadsdl"
// or
const { getAllMedia } = require("threadsdl")

const url = "https://mediathreads.net/@zuck/post/Cuw_QlKxvbq"

getAllMedia(url).then((result: any) => {
  console.log(result) // JSON
})
```

## Example Response

```ts
{
  user: {
    profile_pic_url: string,
    username: string,
    id: null,
    is_verified: boolean,
    pk: string
  },
  type: "photo" | "photos" | "video" | "videos",
  media: {
    width?: number,
    height?: number,
    url: string,
  },
  width: number,
  height: number,,
  caption: string | undefined,
  has_audio: boolean | undefined,
  taken_at: number,
  thumbnail?: any[] | undefined,
}

```

### Tools Used

- [axios](https://www.npmjs.com/package/axios)
