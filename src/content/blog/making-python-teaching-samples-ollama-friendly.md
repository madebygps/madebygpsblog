---
title: "Making Python Teaching Samples Ollama-Friendly"
description: "A practical guide to adding Ollama support to Python teaching samples with clean environment config, provider switching, devcontainers, compatibility testing, and local embeddings."
pubDate: 2026-05-19
tags: ["python", "ai", "ollama", "devcontainers"]
---

Over the past year, my colleague, the great [Pamela Fox](https://www.pamelafox.org/), and I have been delivering a series of educational courses and workshops on Python and generative AI.

Here are the main series and the materials behind them:

| Series | Topics covered | Resources |
| --- | --- | --- |
| Python + AI | LLMs, embeddings, RAG, vision, structured outputs, AI quality and safety, tool calling, agents, MCP | [English](https://aka.ms/pythonai/resources), [Spanish](https://aka.ms/pythonia/recursos) |
| Python + MCP | FastMCP servers, cloud deployment, authentication | [English](https://aka.ms/pythonmcp/resources), [Spanish](https://aka.ms/pythonmcp/recursos) |
| Python + Agents | First agents, context and memory, monitoring, evaluation, workflows, multi-agent orchestration, human-in-the-loop | [English](https://aka.ms/pythonagents/resources), [Spanish](https://aka.ms/pythonagentes/recursos) |
| Hosting Agents in Foundry | Microsoft Agent Framework, LangChain and LangGraph, quality and safety evaluations | [English](https://aka.ms/foundry-hosted/resources), [Spanish](https://aka.ms/hospeda/recursos) |

The concrete repos behind these patterns include [python-openai-demos](https://github.com/Azure-Samples/python-openai-demos), [python-mcp-demos](https://github.com/Azure-Samples/python-mcp-demos), and [python-ai-agent-frameworks-demos](https://github.com/Azure-Samples/python-ai-agent-frameworks-demos).

I also talked about some of these lessons at PyCon US 2026. The [slides from those talks](https://madebygps.github.io/pycon26/) cover the broader teaching takeaways; this post is the more practical guide for setting up your own repository or teaching samples with local model support.

We wanted to make sure all the code samples were as accessible as possible, which also means access to the language models. If the first step requires an API key, billing setup, cloud permissions, or a quota exception, you have already lost some learners before the lesson starts.

[Ollama](https://ollama.com/) solves a lot of that for us. It gives students a local model path, and because it exposes an [OpenAI-compatible endpoint](https://github.com/ollama/ollama/blob/main/docs/openai.md), we can often support Ollama without rewriting the whole repo.

Local models are not a perfect replacement for hosted frontier models. They usually need more patience, smaller scopes, and clearer prompts. That is fine for teaching as long as educators know which examples work well locally and which ones still need a hosted model.

This post summarizes the patterns we have been using to make Python teaching samples more Ollama-friendly: environment config, provider switching, [devcontainers](https://containers.dev/), compatibility notes, and embeddings.

## Step 1: Pick the local model runtime

[Ollama](https://ollama.com/) is the local model runtime we have been optimizing for in these teaching samples.

It is not the only option. Tools like [LM Studio](https://lmstudio.ai/), [LocalAI](https://localai.io/), [Jan](https://jan.ai/), [GPT4All](https://www.nomic.ai/gpt4all), [llama.cpp](https://github.com/ggml-org/llama.cpp), and [vLLM](https://docs.vllm.ai/) are all useful depending on whether you want a desktop app, a production-style serving engine, a lower-level runtime, or more control over model hosting.

For teaching repos, Ollama has been the easiest plug-and-play default. The install is simple, the model pull command is memorable, and the local API server is straightforward enough to explain in a workshop. Once students understand what Ollama is doing, they can graduate to whatever local runtime fits their machine, model, or workflow.

The biggest reason Ollama works well for our samples is that it exposes an [OpenAI-compatible endpoint](https://github.com/ollama/ollama/blob/main/docs/openai.md):

```text
http://localhost:11434/v1
```

That endpoint is the bridge. If your Python samples already use the OpenAI SDK or another OpenAI-compatible client, you can usually add local model support without rewriting the whole repo.

We like to provide options for learners. They can use the repo's `devcontainer.json` in a GitHub Codespace, use the same devcontainer locally, or run locally without a devcontainer. A Codespace running Ollama may need a larger machine type, especially if it pulls a model like `gemma4:e4b`, so call that out in the README. For the devcontainer paths, we include the Ollama feature so the model runtime can be installed and prepared automatically:

```json
{
  "features": {
    "ghcr.io/prulloac/devcontainer-features/ollama:1": {
      "pull": "gemma4:e4b"
    }
  },
  "postCreateCommand": "uv sync && cp .env.sample.ollama .env"
}
```

For running locally, students need to make sure ollama is installed and then they can follow the README instructions:

```bash
ollama pull model-name:tag
cp .env.sample.ollama .env
uv sync
uv run examples/chat.py
```

## Step 2: Define the `.env` contract and model choices

We provide a dedicated `.env.sample.ollama`:

```env
API_HOST=ollama
OLLAMA_ENDPOINT=http://localhost:11434/v1
OLLAMA_MODEL=gemma4:e4b
OLLAMA_API_KEY=no-key-needed
```

If the repo has examples that use embeddings, add embedding settings too:

```env
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIMENSIONS=256
```

Embeddings are separate from chat models. If a RAG sample uses local embeddings, students also need to pull the embedding model. And if the embedding dimensions change, the vector index needs to be rebuilt.

That gives users a copy-paste path:

```bash
cp .env.sample.ollama .env
```

Honestly, in 2025 we did not have too many great options for SLMs in teaching samples. With the newer Gemma and Qwen models, learning locally is becoming much more feasible.

For first-run checks, I still like having a smaller model option such as `qwen3.5:4b`. It is easier to run on regular laptops and good enough for basic chat flows. For the more interesting teaching examples, these are the models we have been comparing most closely:

**`qwen3.5:9b`**

- Good: reliable single tool calls.
- Good: handles parallel and multi-step tool loops.
- Good: returns valid nested JSON for structured output.
- Good: clean on focused MCP servers.
- Watch out: stumbles in multi-agent orchestration.
- Watch out: narrows incorrectly on long MCP responses.

**`gemma4:e4b`**

- Good: fast on basic tool calls.
- Good: clean on focused MCP servers.
- Watch out: returns prose instead of JSON for nested structured output.
- Watch out: loops the same tool in multi-step orchestration.
- Watch out: drifts off task on long MCP responses.


## Step 3: Make the sample shape predictable

We like using the same structure across samples for two reasons. First, it makes new samples easier to copy, adapt, and review. Second, it helps learners recognize the pattern faster. Once they know where setup ends and the lesson begins, they can spend less energy decoding the file and more energy on the concept being taught.

### Part 1: The setup block

The setup block answers one question before the lesson starts: where should this sample send its model request?

In this pattern:

- `.env` is the settings file students can copy and edit.
- `API_HOST` is the switch that says which provider to use.
- `client` is the object the OpenAI SDK uses to send requests.
- `MODEL_NAME` is the model or deployment name the rest of the sample should use.

The simplest version only needs two paths: local Ollama or a hosted OpenAI-compatible model.

```python
import os

import openai
from dotenv import load_dotenv


load_dotenv(override=True)
API_HOST = os.getenv("API_HOST", "ollama")

if API_HOST == "ollama":
  client = openai.OpenAI(
    base_url=os.environ["OLLAMA_ENDPOINT"],
    api_key=os.getenv("OLLAMA_API_KEY", "no-key-needed"),
  )
  MODEL_NAME = os.environ["OLLAMA_MODEL"]

else:
  client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])
  MODEL_NAME = os.environ["OPENAI_MODEL"]
```

That block gives the rest of the file two stable names: `client` and `MODEL_NAME`. `API_HOST=ollama` uses the local Ollama endpoint. Any other value uses the hosted OpenAI path.

That also gives learners room to grow. If they outgrow the local model, want to compare behavior, or need a model that is not available locally, they can change the values in `.env` instead of rewriting the sample. For example, they can switch from `OLLAMA_MODEL=gemma4:e4b` to a hosted OpenAI model by changing `API_HOST`, `OPENAI_API_KEY`, and `OPENAI_MODEL`.

In our Azure samples, we add an `API_HOST=azure` branch in this same setup block. That branch creates an Azure OpenAI client and sets `MODEL_NAME` from the Azure deployment name. That is something for the instructor to decide based on the course environment. Azure is one supported provider, not a requirement for the structure.

### Part 2: The lesson block

The lesson block is the part the learner came for. It should not have to explain provider configuration again.

```python
response = client.responses.create(
  model=MODEL_NAME,
  input="Explain Python decorators with one tiny example.",
  store=False,
)

print(f"Response from {API_HOST}:\n")
print(response.output_text)
```

This is especially useful in framework comparison repos. If you show the same agent across Microsoft Agent Framework, LangChain, LangGraph, OpenAI Agents, Pydantic AI, and LlamaIndex, the framework code should change, but the model configuration should stay recognizable.

## Step 4: Document what actually works

Do not stop at "supports Ollama." That can mean too many things.

For educators, the useful question is: what should I tell students before they run this? Some examples will work as-is. Some need extra context engineering or prompt engineering. Some should use a different model for now.

I like keeping a small field report in plain language:

| Sample | qwen3.5:9b | gemma4:e4b | Notes |
| --- | --- | --- | --- |
| chat.py | works | works | Both returned a useful response. |
| function_calling_basic.py | works | works | Both called the tool. |
| structured_outputs_nested.py | works | does not work yet | Gemma returned prose instead of JSON. |
| agent_mcp_remote.py | works | needs help | Gemma repeated the same tool call. |

The buckets can stay simple:

- `works`: the sample runs end to end.
- `needs help`: the sample is close, but needs better context, a tighter prompt, smaller steps, or a code change.
- `does not work yet`: the model is not reliable enough for this sample today.

The important part is to stay current. Local models change quickly, and their strengths and weaknesses are not interchangeable. A model that is fine for chat may struggle with nested JSON, long context, tool loops, or multi-agent examples. The field report helps educators guide students honestly without pretending every local model behaves the same.

## The bigger lesson

It is absolutely worth supporting local models as much as possible.

No, they will not always perform like hosted frontier models. Students get to see why model choice matters, why prompts need structure, why tool calling can fail, and why evaluation is part of building AI apps.

Most importantly, local model support makes the learning experience more accessible. It gives more people a way to start without waiting on billing, API keys, cloud access, quota, or classroom logistics.

That does not mean every sample has to work perfectly offline. It means the repo should offer a clear local path, explain the tradeoffs honestly, and help learners understand what to try next.