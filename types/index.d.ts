export type CrabAgent = { id: string; description: string; status: string; type: string }
export type CrabWork = { tools: number; lastTool: string }
export type CrabAsk = { tool: string; target: string; since: number }
export type CrabCall = { id: string; tool: string; target: string; done: boolean; failed: boolean }

declare module 'claude-code' {
  interface PluginState {
    'crab-crew': {
      agents: CrabAgent[]
      roster: Record<string, number>
      work: Record<string, CrabWork>
      frame: number
      nextSeat: number
      log: Record<string, CrabCall[]>
      selected: string | null
      asks: Record<string, CrabAsk>
    }
  }
}
