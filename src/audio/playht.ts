import * as PlayHT from "playht";
import { Readable, Writable } from "node:stream"
import { log } from "../timedLog.js";

PlayHT.init({
  apiKey: process.env["PLAY_HT_SECRET"]!,
  userId: process.env["PLAY_HT_USER_ID"]!,
});

function getReadableWritablePair() {
  const readable = new Readable({
    read() { } // This is needed to prevent the Readable from auto-closing when there is no data to push
  });

  const writable = new Writable({
    write(chunk, encoding, callback) {
      if (!readable.push(chunk)) {
        // When the readable stream's buffer is full, we need to wait for it to drain.
        readable.once('drain', callback);
      } else {
        // Otherwise, we can continue writing immediately.
        callback();
      }
    },
    final(callback) {
      readable.push(null); // Signal the end of the stream
      callback();
    }
  });

  return { readable, writable }
}

export async function speakPlayHT(text: string | NodeJS.ReadableStream, speaker = "Dave", modelId = "mist") {
  // configure your stream
  const streamingOptions: PlayHT.SpeechStreamOptions = {
    // must use turbo for the best latency
    voiceEngine: "PlayHT2.0-turbo",
    // this voice id can be one of our prebuilt voices or your own voice clone id, refer to the`listVoices()` method for a list of supported voices.
    voiceId:
      // "oscar",
      // "s3://voice-cloning-zero-shot/d82d246c-148b-457f-9668-37b789520891/adolfosaad/manifest.json",
      // "nolan",
      "s3://voice-cloning-zero-shot/e7e9514f-5ffc-4699-a958-3627151559d9/nolansaad2/manifest.json",

      // "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json",
    // you can pass any value between 8000 and 48000, 24000 is default
    sampleRate: 24000,
    // the generated audio encoding, supports 'raw' | 'mp3' | 'wav' | 'ogg' | 'flac' | 'mulaw'
    outputFormat: 'mp3',
    // playback rate of generated speech
    speed: 1,
    emotion: "male_surprised",
    styleGuidance: 10,
    voiceGuidance: 5, 
  };
  // start streaming!
  const stream = await PlayHT.stream(text, streamingOptions);
  return Readable.from(stream)
}