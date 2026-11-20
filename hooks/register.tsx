import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { CrabAgent, CrabAsk, CrabWork } from '../types'
import { crabCells, crabGrid, crabSvg } from './sprites'
import type { Mood } from './sprites'

const PANE = 'crab-crew'
const TITLE = 'Crab crew'
const TICK_MS = 450
const GRACE_MS = 1500

const agents = atom({ plugin: 'crab-crew', key: 'agents' } as const, [] as CrabAgent[])
const roster = atom({ plugin: 'crab-crew', key: 'roster' } as const, {} as Record<string, number>)
const work = atom({ plugin: 'crab-crew', key: 'work' } as const, {} as Record<string, CrabWork>)
const frame = atom({ plugin: 'crab-crew', key: 'frame' } as const, 0)
const asks = atom({ plugin: 'crab-crew', key: 'asks' } as const, {} as Record<string, CrabAsk>)

const VERB: Record<string, string> = { Write: 'create', Edit: 'edit', NotebookEdit: 'edit', Bash: 'run', PowerShell: 'run', WebFetch: 'fetch', WebSearch: 'search' }
const baseName = (p: string) => p.split(/[\\/]/).filter(Boolean).pop() ?? p

// What the permission ask is about: the file for file tools, the command for shells.
function targetOf(input: unknown): string {
  const i = (input ?? {}) as Record<string, unknown>
  const raw = i.file_path ?? i.notebook_path ?? i.command ?? i.url ?? i.query ?? ''
  const s = String(raw)
  return i.file_path || i.notebook_path ? baseName(s) : s.replace(/\s+/g, ' ').slice(0, 40)
}

type Persona = { name: string; color: string; chatter: string[]; doneLine: string }

// Same order as LOOKS in sprites.ts.
const PERSONAS: Persona[] = [
  { name: 'Pinchy', color: '#D97757', chatter: ['snip snip!', 'on it, boss', 'pinching data…'], doneLine: 'all snipped!' },
  { name: 'Sir Clawsworth', color: '#C9A227', chatter: ['Indubitably.', 'Most irregular…', 'Quite, quite.'], doneLine: 'Splendid work.' },
  { name: 'Grumpy Gus', color: '#B4533A', chatter: ['hmph.', 'who wrote this?', 'more files…'], doneLine: 'finally. hmph.' },
  { name: 'Disco Dee', color: '#B05CE0', chatter: ['♪ crab fever ♪', 'shake those claws', '♫ la la la ♫'], doneLine: '♪ that’s a wrap ♪' },
  { name: 'Sleepy Sam', color: '#3B7DDD', chatter: ['zzz…', '…five more cases…', 'mm? reading…'], doneLine: 'nap time. zzz' },
  { name: 'Cool Carl', color: '#2A9DB5', chatter: ['chill.', 'no stress', 'smooth sailing'], doneLine: 'easy.' },
  { name: 'Nervous Ned', color: '#2FB36B', chatter: ['is this right?!', 'eek, a quote!', 'checking twice…'], doneLine: 'phew, done!' },
  { name: 'Baby Bo', color: '#E0609A', chatter: ['me help!', 'blub blub', 'wheee'], doneLine: 'me did it!' },
]

const isActive = (s: string) => s === 'running' || s === 'pending'
const moodOf = (s: string): Mood =>
  isActive(s) ? 'working' : s === 'completed' ? 'done' : s === 'failed' || s === 'killed' ? 'failed' : 'waiting'

async function poll($: EngineInterface) {
  const list = await $.agent.list()
  const next: CrabAgent[] = list.map(a => ({ id: a.id, description: a.description, status: a.status, type: a.type }))
  const before = await read($, agents)
  if (JSON.stringify(before) !== JSON.stringify(next)) {
    await update($, agents, () => next)
    await update($, roster, r => {
      const out = { ...r }
      for (const a of next) if (out[a.id] === undefined) out[a.id] = Object.keys(out).length
      return out
    })
  }
  if (next.some(a => isActive(a.status))) await update($, frame, f => (f + 1) % 10_000)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'crabs', description: 'Show running subagents as a pixel crab crew' })
    void $.ui.open({ id: PANE, title: TITLE })
    $.clock.every(TICK_MS, () => void poll($).catch(() => undefined))

    return next(e)
  })

  on('command.run', { command: 'crabs' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: 'Crab crew pane opened.' }
  })

  // A subagent's tool call the engine puts to a person: its crab asks for permission
  // until the call is answered (the tool.call below returns, allowed or refused).
  // This hook only watches: it hands the verdict on unchanged.
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    const id = e.agentId
    if (id && verdict.decision === 'ask') {
      const ask: CrabAsk = { tool: e.tool, target: targetOf(e.input), since: Date.now() }
      await update($, asks, a => ({ ...a, [id]: ask }))
      // Auto mode hands an ask to its classifier, which settles it in about a second (see
      // tool.judge below). Only an ask still open after GRACE_MS is waiting on a person.
      void $.clock.after(GRACE_MS, async () => {
        const open = (await read($, asks))[id]
        if (!open || open.since !== ask.since) return
        const seats = await read($, roster)
        const p = PERSONAS[(seats[id] ?? 0) % PERSONAS.length]
        await $.ui.toast(`${p.name} asks to ${VERB[e.tool] ?? e.tool} ${ask.target}`)
      })
    }

    return verdict
  })

  // Auto mode: the classifier answers allow or deny without a person, so that ask is settled.
  // Only a classifier that gave no verdict ('ask') leaves the call waiting on a person.
  on('tool.judge', async ($, e, next) => {
    const verdict = await next(e)
    const id = e.agentId
    if (id && verdict.decision !== 'ask') {
      await update($, asks, a => {
        if (!(id in a)) return a
        const { [id]: _gone, ...rest } = a
        return rest
      })
    }

    return verdict
  })

  // Count tool calls made inside each subagent's loop, and clear its ask once answered.
  on('tool.call', async ($, e, next) => {
    const id = e.agentId
    if (id) {
      void update($, work, w => {
        const cur = w[id] ?? { tools: 0, lastTool: '' }
        return { ...w, [id]: { tools: cur.tools + 1, lastTool: e.tool } }
      }).catch(() => undefined)
    }
    const ran = await next(e)
    if (id) {
      await update($, asks, a => {
        if (!(id in a)) return a
        const { [id]: _gone, ...rest } = a
        return rest
      })
    }

    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const list = await read($, agents)
    const seats = await read($, roster)
    const jobs = await read($, work)
    const all = await read($, asks)
    const nowMs = Date.now()
    const pending: Record<string, CrabAsk> = {}
    for (const [k, v] of Object.entries(all)) if (nowMs - v.since >= GRACE_MS) pending[k] = v
    const isTerminal = e.surface === 'terminal'
    // Desktop animates inside the SVG; only the terminal needs the frame clock.
    const f = isTerminal ? await read($, frame) : 0
    const width = Math.max(20, e.props.bodyColumns ?? 40)

    const asking = list.filter(a => isActive(a.status) && pending[a.id]).length
    const running = list.filter(a => isActive(a.status)).length - asking
    const done = list.filter(a => a.status === 'completed').length
    const head = `🦀 ${running} working${asking ? ` · ${asking} asking` : ''} · ${done} done`

    const rows = list.map(a => {
      const seat = seats[a.id] ?? 0
      const p = PERSONAS[seat % PERSONAS.length]
      const ask = isActive(a.status) ? pending[a.id] : undefined
      const mood: Mood = ask ? 'asking' : moodOf(a.status)
      const job = jobs[a.id]
      const beat = isTerminal ? Math.floor((f + seat * 3) / 8) : job?.tools ?? seat
      const say = ask ? `May I ${VERB[ask.tool] ?? ask.tool} ${ask.target}?`
        : mood === 'failed' ? 'ouch…' : mood === 'done' ? p.doneLine : p.chatter[beat % p.chatter.length]
      const statusWord = ask ? 'needs permission' : mood === 'working' ? 'working' : mood === 'done' ? 'done ✓' : a.status
      return { a, seat, p, mood, job, say, statusWord }
    })

    if (e.surface === 'terminal') {
      const { Box, Text, Raster } = $.ui.resolve(e)
      return (
        <Box flexDirection="column">
          <Text bold>{head}</Text>
          {list.length === 0 && <Text dimColor>The beach is empty. No subagents yet.</Text>}
          {rows.map(r => {
            const art = crabCells(crabGrid(r.seat, r.mood, f))
            return (
              <Box flexDirection="row" marginTop={1}>
                <Raster key={`crab-${r.a.id}`} columns={art.columns} rows={art.rows} cells={art.cells} />
                <Box flexDirection="column" marginLeft={1}>
                  <Text color={r.p.color} bold>{r.p.name}</Text>
                  <Text dimColor>{r.statusWord}{r.job ? ` · ${r.job.tools} tools` : ''}</Text>
                  <Text italic>“{r.say}”</Text>
                  <Text dimColor wrap="truncate-end">{r.a.description.slice(0, width)}</Text>
                </Box>
              </Box>
            )
          })}
        </Box>
      )
    }

    const { Box, Text, Svg } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text bold>{head}</Text>
        {list.length === 0 && <Text dimColor>The beach is empty. No subagents yet.</Text>}
        {rows.map(r => (
          <Box flexDirection="row" marginTop={1}>
            <Svg
              source={crabSvg(r.seat, r.mood, 4)}
              alt={`${r.p.name}, a pixel crab, ${r.statusWord}`}
              width={80}
              height={72}
              isInteractive
            />
            <Box flexDirection="column" marginLeft={1}>
              <Text color={r.p.color} bold>{r.p.name}</Text>
              <Text dimColor>{r.statusWord}{r.job ? ` · ${r.job.tools} tools` : ''}{r.mood === 'working' && r.job?.lastTool ? ` · ${r.job.lastTool}` : ''}</Text>
              <Text italic>“{r.say}”</Text>
              <Text dimColor wrap="truncate-end">{r.a.description.slice(0, width)}</Text>
            </Box>
          </Box>
        ))}
      </Box>
    )
  })
}
