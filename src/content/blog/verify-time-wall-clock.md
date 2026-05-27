---
title: "verify time and the wall clock"
description: "What the CTF timer actually measures, a small but important fix I shipped, and why I decided not to change the underlying model."
pubDate: 2026-05-26
tags: ["linux", "learntocloud"]
---

The [Learn to Cloud Phase 1 CTF](https://github.com/learntocloud/linux-ctfs) is a lab I built to give learners a real, hands-on way to test their Linux command line skills after working through the Phase 1 content at [learntocloud.guide](https://learntocloud.guide). The idea is simple: eighteen progressive challenges, all solved with nothing but a terminal and the knowledge you built over days or weeks of study.

The `verify time` command exists to answer a natural question: "How long did this take me?" But lately I noticed the answer it gives is not always the most meaningful one. This post is about what `verify time` actually measures, a small fix I shipped along the way, and why I decided not to change the underlying model.

---

## The Goal of `verify time`

When I designed the CTF, I imagined the typical learner would work through [Phase 1](https://learntocloud.guide) over several days or weeks before attempting the lab. The lab itself, with eighteen challenges spanning hidden files, log analysis, networking, process inspection, and disk forensics, was designed to be completed in a few focused hours in one sitting.

In that model, `verify time` as a wall clock made perfect sense. You SSH in, start solving challenges, and when you are done, `verify time` tells you how long you were in there. Clean, simple, honest.

But learners have surprised me with how they actually use the lab. Some start it early in their Phase 1 journey as a way to discover what they do not yet know. Some take multiple days, powering off the VM overnight and picking it back up the next morning. Others destroy and recreate the VM entirely, taking notes on their work and rebuilding their environment as part of the learning experience. In all of these cases, wall clock time is still wall clock time. The timer does not know you were asleep.

That is not a bug. That is just what the tool measures.

---

## How `verify time` Used to Work

The timer starts the moment you submit your first flag with `verify <number> <flag>`. That timestamp gets written to `/var/ctf/ctf_start_time`. Every subsequent `verify time` call reads that file and subtracts it from the current clock.

```bash
local start_time=$(cat "$START_TIME_FILE")
local current_time=$(date +%s)
local elapsed=$((current_time - start_time))
```

Simple and correct. The problem was what happened at `verify export`.

When a learner finishes all 18 challenges and runs `verify export <github_username>`, the command generates a signed completion certificate and token. The completion time baked into that token was computed the same way: `now - start`. Which means a learner who finished on Tuesday but ran `verify export` on Thursday got a certificate showing a completion time of 48+ hours, even if they only spent three hours actually solving challenges.

There was no end timestamp. The clock never stopped.

---

## How It Works Now

[PR #80](https://github.com/learntocloud/linux-ctfs/pull/80) added a second file: `/var/ctf/ctf_end_time`. The first time `verify export` is called after all 18 challenges are complete, that timestamp is written once and never updated again.

```bash
freeze_end_time_on_export() {
    if [ -f "$END_TIME_FILE" ]; then
        return
    fi
    if [ "$completed" -ge 18 ]; then
        date +%s > "$END_TIME_FILE"
    fi
}
```

Both `verify time` and `verify export` now route through a shared `get_elapsed_seconds()` helper that checks for that end file first. If it exists, elapsed time is frozen at that value. If it does not, the live clock is used. The result: the first time you run `verify export` after finishing, your completion time is locked in. Run it again a week later and you get the exact same number. The certificate means something specific now.

The MOTD and README docs across all three cloud providers were also updated to explain this behavior clearly, including a note for AWS and Azure users that VM stop/start time still counts toward elapsed time until that first export runs.

If you want to read about the full session behind this change, including the research, decisions, and back-and-forth that shaped the implementation, the [session chronicle in PR #80](https://github.com/learntocloud/linux-ctfs/pull/80#issuecomment-4547297627) covers it in detail. It is also an example of how I approach using AI in my open source maintenance work.

---

## Should It Change?

The honest question at the end of all this is whether `verify time` should ever try to measure something more accurate, like time actively working. Subtracting VM downtime, handling learners who destroy and recreate VMs, or tracking active session windows.

No.

This is a free and open source project that I maintain primarily on my own, alongside a full schedule of content, community work, and everything else. Building accurate active-time tracking would mean shipping a daemon, persisting state across VM recreations, handling partial VM lifecycles, and testing all of it across AWS, Azure, and GCP. The complexity is real and the benefit is marginal for what this tool actually is.

The CTF is a learning tool, not a performance benchmark. Whether it took you three hours or three days is not the point. The point is that you worked through eighteen Linux challenges and came out the other side with skills you did not have before.

`verify time` is a wall clock. Use it accordingly.
