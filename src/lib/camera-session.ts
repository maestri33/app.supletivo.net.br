/** Browser permission requests cannot be cancelled; release any late stream. */
export function bounded<T>(promise: Promise<T>, signal: AbortSignal, ms: number, late?: (value: T) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (error?: unknown, value?: T) => {
      if (done) return;
      done = true; clearTimeout(timer); signal.removeEventListener('abort', abort);
      if (error) reject(error); else resolve(value as T);
    };
    const abort = () => finish(new DOMException('Cancelled', 'AbortError'));
    const timer = setTimeout(() => finish(new DOMException('Camera timeout', 'TimeoutError')), ms);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    promise.then(value => { if (done) late?.(value); else finish(undefined, value); }, error => finish(error));
  });
}

export const stopTracks = (stream: MediaStream) => stream.getTracks().forEach(track => track.stop());

export async function waitForCameraFrame(video: HTMLVideoElement, signal: AbortSignal): Promise<void> {
  const deadline = Date.now() + 8000;
  while (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (Date.now() >= deadline) throw new DOMException('No video frames', 'TimeoutError');
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
