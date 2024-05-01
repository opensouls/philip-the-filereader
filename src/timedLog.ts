
let last = performance.now()

export const log = (...args: any[]) => {
  const since = performance.now() - last
  last = performance.now()
  console.log(`[+${since.toFixed(2)}ms]`, ...args)
}
