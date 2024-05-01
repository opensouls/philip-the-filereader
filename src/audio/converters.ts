import { Readable, Writable } from "node:stream"
import { log } from "../timedLog.js";
import ffmpeg from "fluent-ffmpeg"

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

export const mp3ToPCM = (mp3: Readable, signal: AbortSignal) => {

  const { readable, writable } = getReadableWritablePair()

  let cmdDone = false

  log("launching ffmpeg")
  const cmd = ffmpeg()
    .input(mp3)
    .inputFormat("mp3")
    .outputFormat("s16le")
    .outputOptions([
      "-ac 1",
      "-ar 16000"
    ])
    .on("error", (err) => {
      console.error('ffmpeg error', err)
    })
    .on("end", () => {
      cmdDone = true
      console.log('ffmpeg ended')
    })

  cmd.pipe(writable, { end: true })

  const abortHandler = () => {
    if (!cmdDone) {
      console.log("killing ffmpeg - heavy metal")
      cmd.kill("SIGKILL")
    }
    writable.destroy()
    signal.removeEventListener("abort", abortHandler)
    writable.off("error", errHandler)
    readable.off("error", errHandler)
  }

  const onWritableFinish = () => {
    // End the readable stream when writable finishes
    readable.push(null);
    readable.destroy(); // Now it's safe to destroy the readable stream
  };
  writable.once('finish', onWritableFinish);

  const errHandler = (err: Error) => {
    console.error('stream error: ', err)
  }

  writable.on("error", errHandler)
  readable.on("error", errHandler)

  signal.addEventListener("abort", abortHandler)

  return readable
}