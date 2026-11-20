export type CrabAgent = { id: string; description: string; status: string; type: string }
export type CrabWork = { tools: number; lastTool: string }
export type CrabAsk = { tool: string; target: string; since: number }

declare module 'claude-code' {
  interface PluginState {
    'crab-crew': {
      agents: CrabAgent[]
      roster: Record<string, number>
      work: Record<string, CrabWork>
      frame: number
      asks: Record<string, CrabAsk>
    }
  }
}
