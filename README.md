# Crab crew

A mod for Claude Code by **IMAD**. Whenever a session runs subagents, a pane shows
them as a crew of animated pixel crabs. Every crab has its own look and character.

## What you get

- **Pixel crabs.** Claude-orange sprites that walk, snap their claws and blink while
  their subagent works. In the terminal they are drawn as half-block cells.
- **Eight personas.** Pinchy, Sir Clawsworth, Grumpy Gus, Disco Dee, Sleepy Sam,
  Cool Carl, Nervous Ned and Baby Bo. Each has its own hat or accessory, speed and
  chatter.
- **Live status.** Each crab follows its real subagent: working, done (green check),
  or failed (grey, X eyes), with its tool-call count and the last tool it used.
- **Permission asks.** When a subagent's tool call is waiting on a person, its crab
  waves its claws with a blinking "!" bubble and says what it wants ("May I create
  notes.md?"). In auto mode the classifier answers asks by itself, so you only see
  this in a mode that prompts you.

The pane opens when a session starts. `/crabs` opens it again.

## Install

At the prompt of a terminal session:

```
/plugin install crab-crew --marketplace ImadRoudanee/crab-crew
```

From a shell:

```
claude plugin install crab-crew --marketplace ImadRoudanee/crab-crew
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box,
then Plugins, Add marketplace with `ImadRoudanee/crab-crew`, then Add plugin.

Answer `y` to add the marketplace, then pick a scope. Pick user to get the crabs in
every session.

## Notes

- Tested against subagents started by the main session. Permission-ask handling was
  written against the engine's `tool.check` and `tool.judge` events and has not been
  tried against a live approval prompt.
- Made with Claude Code's mod API (`claude-code` hooks modules).

Made by IMAD.
