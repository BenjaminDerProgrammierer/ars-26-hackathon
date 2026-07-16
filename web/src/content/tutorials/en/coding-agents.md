---
title: "Building with Coding Agents"
description: "Connect a coding agent to optional OpenRouter access, then work effectively and review generated code."
order: 3
---

If you select the optional hosted development environment at signup, pi.dev is
already installed and ready to use with the required AI API add-on. That add-on
provides OpenRouter access to Mistral Medium 3.5 with a $20 budget per attendee.
You can also follow this tutorial with an agent and self-funded model in your
own setup.

## Connect without leaking your key

Use the OpenRouter setup details from your attendee account, select Mistral
Medium 3.5, and keep your API key in an environment variable. Never paste the
key into source code, commit it, or expose it in a browser bundle. Replace the
key if it is disclosed.

## Start with a plan, not a prompt

Agents work best when you describe the outcome, the data involved, and the
constraints — then let them propose an approach before writing code. Ask for a
plan first, review it, then build in small steps. This also avoids spending your
balance on repeated rewrites.

## Give the agent the dataset docs

Point the agent at the dataset documentation from tutorial one, or paste the
relevant field descriptions. An agent that knows the ID-linking rules will
save you an hour of debugging joins.

## Iterate in small steps

- One feature per request; verify before moving on.
- Ask the agent to run and test its own code.
- Commit early and often — agents are fearless refactorers.
- Keep prompts and attached context focused; the portal dashboard shows the
  authoritative remaining balance.

## Review what you ship

You own what you demo. Read the generated code, check licenses of anything it
pulls in, and make sure API keys and personal data stay out of the repo.

> Access details and final operating limits will be available through the
> attendee account before the event.
