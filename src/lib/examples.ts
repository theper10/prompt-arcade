export const examplePrompts = [
  'make me a cozy vampire fishing game',
  'goblin stock market bullet hell',
  'sad robot gardening simulator',
  'haunted IKEA maze',
  'tiny wizard skateboarding through tax season',
  'moon barista defends espresso asteroids',
  'sleepy dragon mailroom dodge game',
  'time-traveling racetrack for office chairs',
  'haunted laundromat rhythm cleaner',
  'frog detective bubblegum heist',
  'cosmic librarian asteroid sorter',
  'miniature pirate chess storm',
]

export function randomExamplePrompt(currentPrompt?: string) {
  const options = examplePrompts.filter((prompt) => prompt !== currentPrompt)
  const pool = options.length > 0 ? options : examplePrompts

  return pool[Math.floor(Math.random() * pool.length)]
}
