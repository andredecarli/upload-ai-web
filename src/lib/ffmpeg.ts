import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'
import coreURL from '../ffmpeg/ffmpeg-core.js?url'
import workerURL from '../ffmpeg/ffmpeg-worker.js?url'

let ffmpeg : FFmpeg | null

export async function getFFmpeg() {
  if (ffmpeg) {
    return ffmpeg
  }

  ffmpeg = new FFmpeg()

  if (!ffmpeg.loaded) {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/esm'

    await ffmpeg.load({
      coreURL,
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL,
    })
  }

  return ffmpeg
}