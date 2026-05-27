---
title: "Refactoring Bash to Python for a Linux CTF"
description: "How reading Effective Python pushed me to move a growing CTF setup script from Bash into Python, and what changed for learners and contributors."
pubDate: 2026-05-27
tags: ["python", "ctf"]
---

i was reading effective python, chapter 9 concurrency and parallelism, item 67: use subprocess to manage child processes. i am a hands on learner so wanted to apply the theory to actual code, luckily i happen to maintain a popular open source learning ecosystem [Learn to Cloud](https://learntocloud.guide), which includes a [Linux CTF](https://github.com/learntocloud/linux-ctfs) that had a lot of Bash. I knew at some point I wanted to refactor it to Python, so things aligned for it to happen today.

The Linux CTF is a small cloud lab where learners SSH into a VM and solve command line challenges. They search files, inspect logs, curl local services, read process environments, mount a disk image, and submit flags with a `verify` command. It is intentionally hands-on because Linux is hard to learn only by reading.

The setup script behind that lab had grown into one big Bash file. It installed packages, created users, generated flags, wrote challenge files, configured systemd services, customized SSH, wrote the login message, and embedded the entire `verify` command as a large heredoc. It worked, but it had reached the point where every change required more care than it should have. [Issue #81](https://github.com/learntocloud/linux-ctfs/issues/81) started as a simple question: should this be ported to Python?

## The setup script had too many jobs

The original `ctf_setup.sh` was not bad because it was Bash. Bash is still the right tool for plenty of setup work. The problem was that it had become the place where every responsibility lived.

It managed operating system setup. It generated per-VM flags. It created all eighteen challenges. It wrote helper scripts. It embedded a learner-facing CLI. It had to be run by cloud-init on AWS, Azure, and GCP. It also had to be understandable months later when something broke.

That is where the chapter I was reading clicked for me. The point was not that Python should replace every shell command. The point was that Python gives you a better place to coordinate work, handle data, structure logic, and call child processes only where that makes sense.

The refactor became less about "Bash versus Python" and more about putting each job in the place where it fit best.

## What changed

The main change in [PR #89](https://github.com/learntocloud/linux-ctfs/pull/89) was to turn `ctf_setup.sh` into a thin bootstrap and move the real setup into two Python packages.

The shell entry point now does the minimum needed for first boot. It installs `uv`, finds the setup directory, runs the Python setup package, installs the Python `verify` command, cleans the cache, and writes setup markers. The idea is that cloud-init still starts with a shell script, but the shell script no longer owns the entire lab.

```bash
#!/bin/bash
set -euo pipefail
exec > >(tee /var/log/ctf_setup.log) 2>&1

curl -LsSf https://astral.sh/uv/install.sh | UV_INSTALL_DIR=/usr/local/bin sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

uv run --project "$SCRIPT_DIR/setup" "$SCRIPT_DIR/setup/main.py"
uv tool install --tool-bin-dir /usr/local/bin "$SCRIPT_DIR/verify"
uv cache clean
```

The new `setup/` package owns the VM setup. It has modules for system configuration, flag generation, state files, helpers, and one module per challenge. The new `verify/` package owns the learner CLI. That command is now a normal Python package instead of a long heredoc inside a shell script.

This made the structure much easier to reason about. Challenge 15, the archive challenge, lives in its own file. Challenge 18, the disk image challenge, lives in its own file. The code that writes `/etc/ctf` state lives somewhere else. The code that reads that state for `verify progress`, `verify list`, `verify time`, and `verify export` is separated from the setup code.

That separation matters because the project has two very different audiences. Learners should get a VM that feels simple and ready. Contributors should get code they can safely change without being afraid of one giant setup script.

## Using subprocess where it made sense

The refactor did not try to pretend the operating system does not exist. This is still a Linux lab. Some actions belong to system tools.

Package installation still goes through `apt-get`. Services still go through `systemctl`. Filesystem formatting still uses the normal Linux tooling. Python is not replacing those commands. Python is managing them.

The useful shift was that subprocess calls now sit behind small helpers. That makes the setup flow easier to read and makes failures easier to understand. Instead of spreading shell behavior across hundreds of lines, the Python setup can call a helper that runs the command, checks the exit code, and lets the setup fail clearly if the command fails.

The most important design choice was not to hide errors. If `apt-get update` fails, setup should fail. If a service cannot start, setup should fail. This is infrastructure for learners, so a broken setup should be obvious to contributors instead of quietly producing a half-working VM.

## Refactor benefits for learners

The biggest learner benefit is not that the project uses Python internally. Learners do not care what language built the VM. They care that the lab is ready when they SSH in, that the challenges behave consistently, and that the `verify` command gives clear feedback.

Moving the setup to Python made it easier to keep that experience consistent. The `verify` command is now an installable Python CLI with clearer structure. Certificate output uses Python libraries instead of depending on separate terminal tools. The setup writes state in predictable locations. The challenge setup is easier to inspect and fix when a learner reports something odd.

The refactor also helped us make one challenge safer. The DNS challenge used to risk touching live resolver behavior. During the port, we changed that challenge so it teaches DNS inspection through a harmless systemd-resolved drop-in instead of modifying the active resolver file. That is a better learner experience because the lesson stays the same, but the VM networking is less fragile.

After the release work landed, learners also got a more reliable deployment flow. We created `v0.1.0`, tested the release path, and found that Terraform could print the public IP before first-boot setup had fully finished. That meant a learner could SSH in too early and see an empty home directory or the default Ubuntu message. The setup eventually completed, but the first impression was bad.

[PR #91](https://github.com/learntocloud/linux-ctfs/pull/91) fixed that by making Terraform wait for setup readiness before showing the connection details. In the next release, [v0.1.1](https://github.com/learntocloud/linux-ctfs/releases/tag/v0.1.1), the Azure learner test showed the custom message of the day correctly and setup finished in about 1 minute and 48 seconds. That is exactly the kind of boring reliability learners should get.

## Refactor benefits for contributors

The contributor benefit is much more direct. The code is now organized around responsibilities instead of being organized around the historical fact that everything started in one shell script.

A contributor who wants to change a challenge can open the matching challenge module. A contributor who wants to change flag generation can open `setup/flags.py`. A contributor who wants to change the learner CLI can work inside `verify/`. That lowers the cost of making changes and lowers the chance of breaking something unrelated.

The testing story also improved. The repository now has a clearer contributor mode for Terraform, where local setup files can be uploaded and tested before they are merged. The release path is separate, where Terraform downloads a packaged release asset instead of relying on a moving copy of the repository. That distinction matters because it lets contributors test unmerged work without making the learner path depend on local files or whatever happens to be on `main`.

The release packaging also became more explicit. The GitHub release includes a setup archive and checksum. Terraform release mode downloads that package and verifies it. That is more understandable than asking a VM to assemble the setup from a moving branch at first boot.

There is still room to improve. We opened [issue #90](https://github.com/learntocloud/linux-ctfs/issues/90) to track provider-specific readiness checks in the future. Azure, AWS, and GCP all have different native ways to report VM setup status. The current fix is intentionally cross-cloud and simple: wait over SSH for setup success markers and fail if a setup failure marker appears. It is not the final form, but it solved the learner problem we had in front of us.

## What we learned after merging

The most useful part of this work was not the refactor by itself. It was the full loop after the refactor.

We merged [PR #89](https://github.com/learntocloud/linux-ctfs/pull/89), created `v0.1.0`, deployed the lab the way a learner would, and found a real timing issue. Then we researched readiness options, wrote down the longer-term provider-native idea in [issue #90](https://github.com/learntocloud/linux-ctfs/issues/90), implemented the immediate readiness fix in [PR #91](https://github.com/learntocloud/linux-ctfs/pull/91), created `v0.1.1`, and tested again.

That second test mattered. The MOTD showed correctly. The setup completed quickly. Then we manually captured and verified every challenge flag from the live VM. That last part is not glamorous, but it is the part that tells me the lab still works as a learner experience, not just as code that looks cleaner in a diff.

## The part that stayed Bash

One thing I liked about this refactor is that it did not become a language purity exercise. The project still starts with Bash because cloud-init and VM startup scripts are a natural place for shell. The setup still calls Linux commands because the lab is configuring Linux. The difference is that the shell is no longer responsible for representing the whole system.

That is the practical lesson I took from reading about subprocesses. Python is a good parent process when the problem involves structure, state, validation, and orchestration. Shell is still good for the narrow part where a VM needs to run a command.

The best refactor was not replacing Bash with Python everywhere. It was making Bash smaller, making Python responsible for the parts that needed structure, and making the learner experience more reliable as a result.
