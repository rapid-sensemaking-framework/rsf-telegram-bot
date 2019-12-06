import * as DeepSpeech from 'deepspeech'
import * as concat from 'concat-stream'
import * as Sox from 'sox-stream'
import * as MemoryStream from 'memory-stream'
import { Duplex } from 'stream'

const BEAM_WIDTH = 1024
let modelPath = './models/output_graph.pbmm'
let model = new DeepSpeech.Model(modelPath, BEAM_WIDTH)
let desiredSampleRate = model.sampleRate()
const LM_ALPHA = 0.75
const LM_BETA = 1.85
let lmPath = './models/lm.binary'
let triePath = './models/trie'
// set up the model
model.enableDecoderWithLM(lmPath, triePath, LM_ALPHA, LM_BETA)

// function transcribeAudio(audioBuffer: Buffer): string {
//   const audioLength = (audioBuffer.length / 2) * (1 / desiredSampleRate)
//   console.log('audio length', audioLength)

// }

// utility
function bufferToStream(buffer: Buffer): Duplex {
  let stream = new Duplex()
  stream.push(buffer)
  stream.push(null)
  return stream
}

function convertAudio(buffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let audioStream = new MemoryStream()
    const soxConverter = Sox({
      global: {
        'no-dither': true,
        'replay-gain': 'off'
      },
      output: {
        bits: 16,
        rate: desiredSampleRate,
        channels: 1,
        encoding: 'signed-integer',
        endian: 'little',
        compression: 0.0,
        type: 'raw'
      }
    })
    bufferToStream(buffer)
      .pipe(soxConverter)
      .pipe(audioStream)
    audioStream.on('finish', () => {
      const convertedAudioBuffer = audioStream.toBuffer()
      resolve(convertedAudioBuffer)
    })
    audioStream.on('error', (e: Error) => {
      reject(e)
    })
  })
}

const speechToText = (telegramBot, msg): Promise<string> => {
  return new Promise((resolve, reject) => {
    const convertAndTranscribe = async (orig: Buffer) => {
      let converted: Buffer
      try {
        converted = await convertAudio(orig)
      } catch (e) {
        reject(e)
        return
      }
      // stt for speech to test
      const transcript: string = model.stt(
        converted.slice(0, converted.length / 2)
      )
      console.log('transcript!', transcript)
      // send it back...
      telegramBot.sendMessage(msg.chat.id, transcript)
      resolve(transcript)
    }

    const fileStream = telegramBot.getFileStream(msg.voice.file_id)
    fileStream.pipe(concat(convertAndTranscribe))
    fileStream.on('error', reject)
  })
}

export { speechToText }
