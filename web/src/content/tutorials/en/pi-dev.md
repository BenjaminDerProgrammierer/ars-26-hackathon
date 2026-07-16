---
title: "Using pi.dev and Your Own Models"
description: "Start coding with Pi, use the hackathon model budget, and switch to your own provider or subscription when needed."
order: 4
---

[Pi](https://pi.dev) is a coding agent that runs in your terminal. It can read
and edit files, run commands, and help you build and test your project. The
hosted hackathon environment has Pi preinstalled. If you use your own computer,
install the current release with Node.js and npm:

```sh
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

## Start Pi in your project

Open a terminal, change into your project directory, and start Pi:

```sh
cd path/to/your-project
pi
```

Pi can now work with the files in that directory. Begin with a concrete task,
for example:

> Read the README and inspect the project. Propose a short plan for adding a map
> of festival events. Do not change files until I approve the plan.

Review Pi's plan, then ask it to implement one step at a time. Tell it to run
the relevant checks after changes and inspect the diff before you commit.

Useful controls:

- Type `/model` or press `Ctrl+L` to choose a model.
- Press `Ctrl+P` to cycle through models enabled with `/scoped-models`.
- Type `/login` to connect a supported provider account.
- Press `Ctrl+C` to cancel the current operation and `Ctrl+D` to exit.

## Use the hackathon budget

The optional AI add-on provides an OpenRouter API key and a $20 budget for
Mistral Medium 3.5. Find the key in your attendee account and set it only in
your current shell:

```sh
read -rsp "OpenRouter API key: " OPENROUTER_API_KEY && echo
export OPENROUTER_API_KEY
pi
```

Open `/model`, search for Mistral Medium 3.5, and select it. Pi reads the key
from the environment; do not add it to source code, `.env` files that may be
committed, shell history, screenshots, or chat messages. The attendee portal is
the authoritative place to check your remaining hackathon balance.

## Use your own provider subscription

If the hackathon budget runs out, or you prefer a model covered by your own
subscription, start Pi and enter `/login`. Choose a supported provider and
follow its login flow. Then use `/model` to select one of that provider's
models.

An ordinary chat subscription does not always include API usage. It can be used
through `/login` only when Pi offers a compatible subscription login for that
provider; otherwise you need separately billed API access.

For providers that use API keys, you can instead set the provider's documented
environment variable before starting Pi—for example `ANTHROPIC_API_KEY`,
`OPENAI_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY`. The provider, not the
hackathon, bills requests made with your own account. Check its pricing and
usage limits first.

## Add another OpenAI-compatible provider

Pi supports custom providers and models through
`~/.pi/agent/models.json`. Use this when your provider is not available through
`/login`, or when you need a custom endpoint. First set the key in an environment
variable:

```sh
read -rsp "Provider API key: " MY_PROVIDER_API_KEY && echo
export MY_PROVIDER_API_KEY
mkdir -p ~/.pi/agent
```

Then create or extend `~/.pi/agent/models.json`:

```json
{
  "providers": {
    "my-provider": {
      "baseUrl": "https://api.example.com/v1",
      "apiKey": "$MY_PROVIDER_API_KEY",
      "api": "openai-completions",
      "models": [
        {
          "id": "provider-model-id",
          "name": "My Provider Model",
          "reasoning": false,
          "input": ["text"],
          "cost": {
            "input": 0,
            "output": 0,
            "cacheRead": 0,
            "cacheWrite": 0
          },
          "contextWindow": 128000,
          "maxTokens": 8192
        }
      ]
    }
  }
}
```

Replace the URL, model ID, capabilities, context size, output limit, and costs
with values from your provider's documentation. Costs are in US dollars per
million tokens and are used only for Pi's usage display; enter the real prices
if you want useful estimates. Set `reasoning` to `true` and add `"image"` to
`input` only when the model supports them.

Open `/model` again and search for the model ID. If it does not appear,
check that the JSON is valid, the environment variable is set in the same shell,
and the provider uses an OpenAI-compatible Chat Completions API. Some partially
compatible services need additional `compat` settings; use Pi's
[Custom Models documentation](https://pi.dev/docs/latest/models) rather than
guessing those values.

## Keep control of cost and code

- Switching models changes who bills the next requests; it does not transfer or
  extend the hackathon budget.
- Use a smaller or cheaper model for routine work and reserve stronger models
  for difficult debugging or architecture decisions.
- Start a fresh session when old context is no longer useful.
- Review changes, run tests, and keep API keys out of the repository.
