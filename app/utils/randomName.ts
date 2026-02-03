export function generateRandomUserName(): string {
  const adjectives = [
    'Swift',
    'Calm',
    'Bright',
    'Clever',
    'Brave',
    'Kind',
    'Witty',
    'Curious',
    'Mighty',
    'Gentle',
    'Nimble',
    'Lucky',
  ] as const

  const animals = [
    'Otter',
    'Fox',
    'Panda',
    'Hawk',
    'Tiger',
    'Koala',
    'Dolphin',
    'Raven',
    'Lynx',
    'Turtle',
    'Badger',
    'Falcon',
  ] as const

  const randInt = (maxExclusive: number) => {
    if (maxExclusive <= 0) return 0

    // Prefer crypto for better randomness in the browser.
    try {
      const buf = new Uint32Array(1)
      crypto.getRandomValues(buf)
      return buf[0] % maxExclusive
    } catch {
      return Math.floor(Math.random() * maxExclusive)
    }
  }

  const adj = adjectives[randInt(adjectives.length)]
  const animal = animals[randInt(animals.length)]
  const suffix = (100 + randInt(900)).toString()

  return `${adj}${animal}${suffix}`
}
