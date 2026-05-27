---
title: "Refactoring Bash to Python for a Linux CTF"
description: "How an Effective Python chapter turned into a real refactor of the Learn to Cloud Linux CTF setup."
pubDate: 2026-05-27
tags: ["python", "learntocloud"]
---

I have been studying a lot of random Python topics lately. One of my favorite books is [*Effective Python*](https://effectivepython.com/), because it's structured in a way where you can read 1 item and immediately apply it. Last night (i love late night studying, hence why the [issue](https://github.com/learntocloud/linux-ctfs/issues/81) that kicked off this work was created at 12:00 AM). 

I tackled chapter 9, item 67: "Use `subprocess` to manage child processes." The [`subprocess`](https://docs.python.org/3/library/subprocess.html) module essentially allows you to run commands on your system from within Python. I knew exaclty where I wanted to apply my learning.

Luckily I maintain [Learn to Cloud](https://learntocloud.guide), which includes a [Linux CTF](https://github.com/learntocloud/linux-ctfs) that used to use a lot of Bash. It's a lab for people learning the Linux command line. You deploy a VM in AWS, Azure, or GCP, SSH into it, and solve eighteen challenges with terminal tools. The learner experience is intentionally simple.


## The Problem

We created the first version of the lab over a year ago. The setup was a single, monolithic Bash script: `ctf_setup.sh`. It installed packages, configured SSH, created users, generated flags, wrote challenge files, created services, managed state, wrote the MOTD. 


We later added the `verify` command which provides learners with a way to check their progress, list available challenges, get hints, check time, and more. It was an entire command-line interface around 70 lines embedded into the same single Bash script.

Bash is fantastic, but we had just grown the script to where we were forcing it to handle too many responsibilities. If we wanted to make the code more maintainable and scalable, we needed to refactor it.

## Deep understanding first

With the ever growing use of AI in programming, I find it more and more important to force myself to slow down and deeply understand a problem before jumping into a solution. 

I started by analyzing the current code and understand all the responsibilities the Bash script was handling. I ended up creating a  breakdown of the script's functionality.

| Area | Responsibility |
| --- | --- |
| Flags | Flag generation and HMAC-SHA256 hashing per challenge |
| Verification | Verification token generation |
| System setup | Package installation, SSH config, sysctl, and DNS |
| Users | User management for `ctf_user`, `flag_user`, and `old_admin` |
| State | CTF state storage |
| CLI | The embedded `verify` command, which was 350+ lines of Bash inside a heredoc |
| Welcome flow | MOTD and welcome message |
| Readiness | Setup readiness check script |
| Challenges | 18 individual challenge environments |
| Completion | Completion certificate generation |
| Idempotency | Setup completion marker |

## Categorizing the Responsibilities

Like I said before, Bash has its strengths and weaknesses, as does Python. The key is to use the right tool for the right job. So this was an opportunity to review the responsibilities and determine the best way to distribute them as some could be better handled by Python, while others are more appropriate for the shell.

I sorted each responsibility into one of three buckets:

| Category | Responsibilities |
| --- | --- |
| Pure Python | Flag generation and hashing, verification tokens, CTF state storage, MOTD, setup readiness check, `verify` CLI, challenges 1, 2, 3, 5, 7, 8, 9, 13, 15, 16, and completion marker |
| Subprocess only | Package installation, user management for `ctf_user`, `flag_user`, and `old_admin`, and challenge 18 filesystem commands |
| Mixed | OS and SSH config, challenges 4, 6, 10, 11, 12, 14, and 17 |

---

## First-Boot Setup

Another thing I had in mind going into this refactor was a cleaner role for first-boot setup. We were already using it. On AWS and Azure that's cloud-init reading user data or custom data, on GCP it's the startup-script runner. But we had been treating it like a place to dump the entire CTF setup.

In my head, for this lab, first-boot should do one thing: get the VM to a state where the real setup can take over. Install a couple of prerequisites, then hand off. The CTF setup itself, packages, users, flags, challenges, services, MOTD, should not be living inside boot data. It should be something first-boot calls into.

## The Implementation

In [PR #89](https://github.com/learntocloud/linux-ctfs/pull/89) we did the work.

1. Turned `ctf_setup.sh` into a thin bootstrap. It enables strict shell behavior, checks an idempotency marker under cloud-init's per-instance state directory, installs `uv` so the VM does not depend on system Python, runs the Python setup, installs the `verify` CLI, and only writes the success marker if setup actually finished.
2. Moved the real setup into a `setup/` Python package, split by responsibility: orchestration, flag generation, system config, state, shared helpers for `subprocess` and systemd, and one file per challenge.
3. Moved the learner-facing `verify` command into its own `verify/` package using `argparse`, `rich`, and `pyfiglet`. That killed the 350-line Bash heredoc and the `figlet` / `lolcat` dependencies.

The refactor also gave me an opportunity to revisit every challenge. Each one moved into its own file under `setup/challenges/`, which made it much easier to read what a challenge actually does without scrolling past seventeen others. Most were straightforward ports of the existing Bash. A few were worth a second look:

- **Challenge 9 (DNS)** used to mutate `/etc/resolv.conf`. On Ubuntu cloud images that file is owned by `systemd-resolved` and overwriting it fights the platform. The new version drops a config file under `/etc/systemd/resolved.conf.d/` and points learners at `resolvectl` instead.
- **Challenge 18 (filesystems)** stayed shell-driven on purpose. `mkfs.ext4`, `mount`, and `umount` have no clean stdlib equivalent, so Python just orchestrates them through `subprocess`.
- **User-management challenges** (around `ctf_user`, `flag_user`, and `old_admin`) kept shelling out to `useradd`, `chpasswd`, and `usermod` for the same reason.

This is where `subprocess` shines. Python became the parent process. It handles structure, paths, state, files, and command orchestration. Linux commands still do Linux work, because there is no clean stdlib replacement for them. A small `run()` helper in `helpers.py` is the bridge:

---

## What Testing Exposed

I then tested the new implementation. Like every refactor, nothing is perfect on the first try.

The first thing I had forgotten was how the lab actually got onto the VM. The old Terraform code just pulled a single `ctf_setup.sh` from GitHub and handed it to first-boot. That worked when the setup was one file. After the refactor, the VM needed `ctf_setup.sh`, `setup/`, and `verify/` together, and there was no longer a single file to fetch.

So when I deployed the new setup, it was still loading the old `ctf_setup.sh`. This lead to the next issue: how do we make the `setup/` and `verify/` directories available to the VM?

The thin bootstrap script itself fits in first-boot data without trouble. The package does not. First-boot data was never meant to be a package transport, and on AWS it would not even fit (user data is capped at 16 KB before base64 encoding). So the bootstrap had to stay in first-boot data, and the package had to get to the VM some other way.

After some researching, I also considered baking everything into a custom VM image per provider so first-boot would have almost nothing to do. I logged that idea as one of the approaches in [issue #83](https://github.com/learntocloud/linux-ctfs/issues/83) to look at later. For now it was too much work for a refactor that was already touching enough things, and we can always iterate later. So we went with the simpler short-term fix: two modes, gated by a Terraform variable (`use_local_setup`).

1. **Release mode** deploys from a versioned GitHub release. A GitHub Actions workflow (`.github/workflows/release-setup.yml`) builds a `linux-ctfs-setup.tar.gz` plus a sha256 checksum on every tagged release. Terraform then injects a small inline bootstrap into the cloud's first-boot data (AWS user data, Azure custom data, GCP startup script). That inline script is not `ctf_setup.sh`. Its only job is to download the tarball for the pinned `setup_release_tag`, verify the checksum, unpack it, and then run the `ctf_setup.sh` that lives inside the tarball. This keeps it simple for learners, because all they have to do is `terraform init` and `terraform apply`. Nothing local has to exist on their machine beyond the Terraform config, but the repo still contains all the code, so it is also a learning opportunity if they want to explore the codebase.
2. **Contributor mode** deploys entirely from local files. Terraform uploads the local `ctf_setup.sh`, `setup/`, and `verify/` over SSH after the VM boots, so unmerged changes can be tested before a release exists. This is ideal for people contributing to the lab. It is opt-in via the `use_local_setup = true` variable.

Working with releases also gave us a real artifact to point at. Each lab update is now a tagged release, and learners and contributors can read the release notes to understand what changed. No more digging through commits or PRs to figure out what is in a given version of the lab.

---

## Readiness

After [PR #89](https://github.com/learntocloud/linux-ctfs/pull/89) merged, I cut [`v0.1.0`](https://github.com/learntocloud/linux-ctfs/releases/tag/v0.1.0) and tested the release path on Azure. The tarball was fetched, verified, unpacked, and run cleanly. But the learner experience still had a sharp edge: Terraform would print the VM IP as soon as the cloud provider considered the VM created, which was well before `ctf_setup.sh` had actually finished. A learner could SSH in too early and find the MOTD missing, services not running, and challenge files not written yet.

The clean fix is provider-native: Azure VM Custom Script Extension, AWS SSM Run Command, something equivalent on GCP. Each one has real cost in permissions and infrastructure, and the three providers do not behave the same. I opened [issue #90](https://github.com/learntocloud/linux-ctfs/issues/90) to design that properly later.

For the immediate fix, [PR #91](https://github.com/learntocloud/linux-ctfs/pull/91) added a cross-provider readiness wait. The Python setup writes a success marker on completion and a failure marker if it blows up. Terraform polls those markers over SSH and only returns the VM connection details once the success marker exists. If the failure marker shows up, it errors out early instead of pretending the lab is ready.

Then I cut [`v0.1.1`](https://github.com/learntocloud/linux-ctfs/releases/tag/v0.1.1) and retested. SSH waited until the lab was actually ready, the MOTD showed up, and the challenges were in place.

I also went through every challenge by hand on the live VM, captured each flag, and confirmed all eighteen worked end to end. Great opportunity to 100% validate and brush up my bash skills.

---

## Testing as a first-class thing

Manual testing did its job, but it also showed me where the test setup itself was weak. Three things came out of that.

### A cleaner CTF testing skill

`.github/skills/ctf-testing/SKILL.md` was the agent-facing instructions for how to test the lab. It had drifted over time and was no longer the first place I'd send an agent who wanted to test a change.

I reworked it down to two modes:

- **Basic test**: deploy on a provider and run the full challenge suite, no reboot.
- **Full test**: same thing, plus a reboot-validation pass to make sure setup markers, systemd units, and persistence all survive a restart.

The trigger phrases are now boring and obvious, like `Run a basic test on Azure` or `Run a full test on all providers`. The skill keeps mode, provider choice, command, what is being validated, cleanup expectation, and result reporting in one place. I tried it end to end on Azure with `Run a basic test on Azure, the az cli is authenticated, use that subscription` and it deployed, validated all eighteen challenges, exported the certificate, checked tokens and the time-freeze behavior, then cleaned up nine Terraform resources without leaving anything behind.

### Slimmer CONTRIBUTING.md

I also trimmed `CONTRIBUTING.md` down to what a contributor actually needs: local checks, the basic and full cloud test commands, how contributor mode behaves, and short troubleshooting notes. Less prose, more "here is the command, here is what it does."

### The orchestration script is next

The local script that actually runs the cloud tests is still Bash, and it has grown into a lot of state. It handles Terraform calls, provider-specific values, SSH and SCP, retries, timeouts, setup-marker checks, the reboot flow, cleanup, and final reporting. That is a lot of branching for a shell script.

The plan, tracked in [issue #88](https://github.com/learntocloud/linux-ctfs/issues/88), is to keep the VM-side validation script in shell (because that part is literally exercising the learner's command-line experience) and rewrite the local orchestration script in Python so timeouts, cleanup, and failure reporting stop being held together with `trap` and `set -e`. The structure of the test suite itself is tracked separately in [issue #85](https://github.com/learntocloud/linux-ctfs/issues/85), with ideas like `--challenge 10` and `--smoke` flags so I do not have to run all eighteen challenges to validate a one-line fix.

---

## What This Means for Learners and Contributors

Learners do not care that the setup is Python now, and most of the experience already existed before this refactor. The wins they actually get are a slightly faster setup on the tested Azure release path, and release notes that double as lab update notes so they have one clear place to see what changed.

For contributors the wins are more immediate:

- Setup code is split by responsibility instead of living in one large Bash file.
- The `verify` command is a Python package instead of an embedded heredoc.
- Challenge code is easier to find, review, and change.
- Release mode uses versioned setup assets with checksums, contributor mode still supports local unmerged testing.
- Longer-term readiness work is tracked in [issue #90](https://github.com/learntocloud/linux-ctfs/issues/90) instead of being buried inside the refactor.

A contributor can now change a challenge, test it locally through contributor mode, open a PR, merge it, publish a release, and let learners deploy that release.

---

## What I Learned

The refactor started because I wanted to practice an idea from a book. It ended up touching release packaging, cloud-init, Terraform behavior, first-boot data limits, contributor testing, learner docs, and manual validation. That is usually how useful refactors go. They are rarely only about code shape.

Bash is still the right tool for bootstrapping a VM. Python is the better tool once that bootstrap becomes an application. `subprocess` is the bridge between those two jobs.

And thanks to the manual testing, I got to practice my shell skills.
