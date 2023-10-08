import { FileVideo, Upload } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util"
import { api } from "@/lib/axios";
import { Input } from "./ui/input";
import { encodeMessage } from "@/utils/encrypt";

type Status = 'selecting' | 'waiting' | 'converting' | 'uploading' | 'generating' | 'success' | 'error'

const statusMessages = {
  selecting: 'Selecione um Vídeo/Áudio',
  converting: 'Convertendo...',
  generating: 'Transcrevendo...',
  uploading: 'Carregando...',
  success: 'Sucesso!',
  error: 'Ocorreu um erro!',
}

export function VideoInputForm(){
  // const { apiKey, setApiKey } = useContext(ApiContext)

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('selecting')

  const promptInputRef = useRef<HTMLTextAreaElement>(null)
  const apiKeyInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget

    if (!files) {
      setStatus('selecting')
      return
    }
   
    const selectedFile = files[0]

    setVideoFile(selectedFile)
    setStatus('waiting')
  }
  
  async function convertVideoToAudio(video: File){
    console.log('Conversion Started')

    const ffmpeg = await getFFmpeg()

    await ffmpeg.writeFile('input.mp4', await fetchFile(video))

    // ffmpeg.on('log', log => { console.log(log) } )

    ffmpeg.on('progress', progress => {
      console.log('Conversion Progress: ' + Math.round(progress.progress * 100))
    })

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3'
    ])

    const data = await ffmpeg.readFile('output.mp3')

    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' })
    const audioFile = new File([audioFileBlob], 'audio.mp3', {
      type: 'audio/mpeg',
    })

    console.log('Conversion Finished')

    return audioFile
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const apiKey = apiKeyInputRef.current?.value
    const prompt = promptInputRef.current?.value

    if(!videoFile) {
      return
    }

    if (!apiKey) {
      return
    }

    let audioFile : File
    if (videoFile.type === "video/mp4") {
      setStatus('converting')

      audioFile = await convertVideoToAudio(videoFile)
    } else {
      audioFile = videoFile
    }

    const data = new FormData()

    data.append('file', audioFile)

    setStatus('uploading')

    let response = await api.post('/videos', data)

    if (response.status !== 200) {
      setStatus('error')
      return
    }

    const videoId = response.data.video.id

    setStatus('generating')

    response = await api.post('encryption/exchange')

    if (response.status !== 200) {
      setStatus('error')
      return
    }

    const receiverPublicKey = response.data.receiverPublicKey

    const {encryptedMessage, ephemPubKey, nonce} = encodeMessage(receiverPublicKey, apiKey)

    try {
      await api.post(`/videos/${videoId}/transcription`, {
        encryptedApiKey: encryptedMessage,
        ephemPubKey,
        nonce,
        prompt,
      })
  
      setStatus('success')
    } catch (err) {
      setStatus('error')
    }
  }

  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null
    }

    return URL.createObjectURL(videoFile)
  }, [videoFile])

  return (
    <form onSubmit={handleUploadVideo} className="space-y-4">
      <Label>Chave da OpenAI</Label>
      <Input id="api_key" type="text" ref={apiKeyInputRef} placeholder="Cole aqui sua OpenAI API Key" required />
      {/* <Input type="text" placeholder="Cole aqui sua OpenAI API Key" required value={apiKey} onChange={e => setApiKey(e.target.value)}/> */}
      <label  
        htmlFor="video"
        className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 justify-center items-center text-muted-foreground hover:bg-primary/10"
      >
        {previewURL ? (
          <video src={previewURL} controls={false} className="pointer-events-none absolute inset-0" />
        ) : (
          <>
            <FileVideo className="w-5 h-5"/>
            Selecione um vídeo/áudio
          </>
        )}
      </label>
      <input type="file" id="video" accept="video/mp4, audio/mpeg" className="sr-only" onChange={handleFileSelected} />
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
        <Textarea 
          ref={promptInputRef}
          disabled={status !== 'waiting'}
          id="transcription_prompt"
          className="h-20 leading-relaxed resize-none"
          placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgula" 
          required
        />
      </div>

      <Button 
        data-success={status === 'success'}
        disabled={status !== 'waiting'} 
        type="submit" 
        className="w-full data-[success=true]:bg-emerald-900"
      >
        {status === 'waiting' ? (
          <>
            Carregar Arquivo
            <Upload className="w-4 h-4 ml-2" />
          </>
        ) : statusMessages[status]}
      </Button>
    </form>
  )
}