---
title: "Refactoring Bash to Python for a Linux CTF"
description: "How an Effective Python chapter turned into a real refactor of the Learn to Cloud Linux CTF setup."
pubDate: 2026-05-27
tags: ["python", "ctf"]
---

i was reading effective python, chapter 9 concurrency and parallelism, item 67: use subprocess to manage child processes. i am a hands on learner so wanted to apply the theory to actual code, luckily i happen to maintain a popular open source learning ecosystem [Learn to Cloud](https://learntocloud.guide), which includes a [Linux CTF](https://github.com/learntocloud/linux-ctfs) that had a lot of Bash. I knew at some point I wanted to refactor it to Python, so things aligned for it to happen today.

The Linux CTF is a lab for people learning the Linux command line. You deploy a VM in AWS, Azure, or GCP, SSH into it, and solve eighteen challenges using normal terminal tools. You search for hidden files, read logs, inspect services, curl a local web server, look at process environments, dig through archives, mount a disk image, and submit each flag with a `verify` command.

The lab itself is simple on purpose. The setup behind it was no longer simple.

The entire VM was built by `ctf_setup.sh`. That one file installed packages, configured SSH, created users, generated flags, wrote challenge files, created services, wrote the login message, managed state, and embedded the whole `verify` command inside a Bash heredoc. It worked, but it had reached the point where every change felt like touching a crowded drawer. You could still find what you needed, but you had to move too many things out of the way first.

[Issue #81](https://github.com/learntocloud/linux-ctfs/issues/81) started with a question: should we port `ctf_setup.sh` to Python?

## The first step was not writing Python

The useful part of the issue was that we did not start by opening a new Python file. We started by outlining everything `ctf_setup.sh` was responsible for.

That list got long quickly. The script handled flag generation and hashing, verification tokens, package installation, SSH configuration, system settings, user management, CTF state storage, the embedded `verify` CLI, the MOTD, readiness markers, all eighteen challenge environments, completion certificate generation, and idempotency.

That mattered because "should this be Python?" is too broad by itself. Some of those responsibilities are better as Python code. Some are still shell commands. Some are mixed.

So we categorized the work. Flag generation, state files, tokens, MOTD generation, the `verify` command, and many challenge files belonged in Python. Package installation, user creation, and filesystem tools like `mkfs.ext4`, `mount`, and `umount` still belonged to system commands. Things like SSH configuration, systemd services, and some challenges needed both.

The table from that planning pass looked like this:

| Category | Responsibilities |
| --- | --- |
| Pure Python | Flag generation and hashing, verification tokens, CTF state storage, MOTD, setup readiness check, `verify` CLI, challenges 1, 2, 3, 5, 7, 8, 9, 13, 15, 16, and completion marker |
| Subprocess only | Package installation, user management for `ctf_user`, `flag_user`, and `old_admin`, and challenge 18 filesystem commands |
| Mixed | OS and SSH config, challenges 4, 6, 10, 11, 12, 14, and 17 |

That was the actual design decision. This was not a Bash versus Python rewrite. It was a split between coordination logic and operating system actions.

## Why subprocess clicked

The chapter I was reading in Effective Python was about using subprocesses to manage child processes. That sounds abstract until you are looking at a setup script that has become both the parent process and the entire application.

The old Bash script was doing everything directly. That is fine when the work is small. But once the script became the place for data structures, state, flags, certificates, challenge generation, and command execution, Bash was no longer helping us keep the ideas separate.

Python gave us a better parent process. It could own the structure, data handling, file writing, JSON state, path logic, and command orchestration. Then it could call out to Linux tools where Linux tools were still the right tool.

The important part was not replacing commands like this:

```bash
apt-get update
systemctl daemon-reload
useradd ctf_user
mkfs.ext4 disk.img
```

Those commands still make sense. The improvement was putting them behind small Python helpers that run commands consistently, report failures clearly, and keep setup logic readable.

That also helped us avoid a bad refactor pattern. We did not try to reimplement Linux in Python. We kept Linux commands for Linux work and used Python for the parts where Bash was becoming hard to maintain.

## What changed in the repo

[PR #89](https://github.com/learntocloud/linux-ctfs/pull/89) turned `ctf_setup.sh` into a thin bootstrap. It now installs `uv`, runs the Python setup package, installs the Python `verify` CLI, cleans the cache, and writes setup markers.

The real setup moved into `setup/`. That package now owns flag generation, system setup helpers, state writing, and the individual challenge modules. The learner-facing `verify` command moved into `verify/` as a real Python CLI package with dependencies like `rich` and `pyfiglet`.

That file split was one of the biggest wins. Challenge 9 DNS logic lives with challenge 9. Challenge 15 archive logic lives with challenge 15. Challenge 18 disk image logic lives with challenge 18. The `verify` command is no longer a 350 plus line heredoc trapped inside a setup script.

The DNS challenge is a good example of why this was worth doing. While reviewing the responsibilities, we realized the old challenge design touched `/etc/resolv.conf`, which is cloud-managed DNS plumbing on modern Ubuntu images. On AWS, Azure, and GCP, that file is usually connected to `systemd-resolved`. The new version leaves `/etc/resolv.conf` alone and puts the flag in a harmless systemd-resolved drop-in file. Learners still practice DNS discovery, but the VM networking is less fragile.

## The release problem we found after the refactor

The Python refactor changed more than the language. It changed how the setup had to be delivered to cloud VMs.

Before this, the normal Terraform path could download one file, `ctf_setup.sh`, from GitHub. That was not perfect, but it matched the old shape of the project. After the refactor, the VM needed three things together:

```text
ctf_setup.sh
setup/
verify/
```

That forced us to revisit the deployment model. Embedding the whole setup package in first-boot data was not a good answer because every cloud has size limits. AWS user data is the strictest at 16 KB before base64 encoding. Azure custom data has more room at 64 KB. GCP metadata has more room again, but it still is not a package transport system.

The better answer was a release package. The GitHub release now ships a setup archive and checksum. Terraform release mode passes a small startup script to the VM. The VM downloads the pinned release asset, verifies the SHA-256 checksum, unpacks it, and runs `ctf_setup.sh`.

Contributor mode stayed different on purpose. Contributors still need to test unmerged local changes, so Terraform can upload the local setup package and run it with `remote-exec`. That is acceptable for contributor testing, but it is not the learner path.

This distinction is now clearer than it used to be. Learners use releases. Contributors can test local work.

## The readiness problem we only saw by testing like a learner

After [PR #89](https://github.com/learntocloud/linux-ctfs/pull/89) merged, we created the first release, [`v0.1.0`](https://github.com/learntocloud/linux-ctfs/releases/tag/v0.1.0), and tested the release path from a fresh Azure deployment.

The release package worked. The setup completed. But the learner experience still had a real problem.

Terraform could finish and print the VM IP before the first-boot CTF setup was fully done. That meant a learner could SSH in too early and see an empty home directory or the default Ubuntu login message before the custom lab setup, MOTD, challenge files, and `verify` command were ready.

That is the kind of bug that is easy to miss if you only check that automation eventually succeeds. It only became obvious because we tested the release the way a learner would use it.

We researched longer-term provider-native readiness options and opened [issue #90](https://github.com/learntocloud/linux-ctfs/issues/90) to track that work. Azure VM extensions, AWS SSM, and GCP-specific signals may all be useful later, but they are not the same across providers.

For the immediate fix, [PR #91](https://github.com/learntocloud/linux-ctfs/pull/91) added a cross-provider readiness wait. Terraform now waits over SSH until setup success markers exist, and it fails early if a setup failure marker appears. The provider READMEs were also simplified so new learners see the commands they need, not internal contributor and release-mode details.

Then we created [`v0.1.1`](https://github.com/learntocloud/linux-ctfs/releases/tag/v0.1.1) and tested again. This time the MOTD showed correctly, the lab was ready when SSH was useful, and setup finished in about 1 minute and 48 seconds on Azure.

That was the first obvious learner-facing win.

## Refactor benefits for learners

The honest answer is that the current direct benefit for learners is small, but important. Learners do not care that the setup is Python now. They care about whether the lab is ready, fast, and understandable from the outside.

Right now, the learner benefits are:

- The setup is much faster in the tested release path, with Azure completing in about 1 minute and 48 seconds.
- Terraform waits for setup to finish before handing learners the VM connection details.
- The VM login experience is cleaner because the MOTD and challenge files are ready when learners arrive.
- Provider README files are simpler and focus on the commands learners need to run.
- Learners can follow lab updates through release notes instead of reading PRs, maintainer comments, or internal announcements.
- The refactor makes future learner-facing functionality easier to add because the setup and `verify` command now have clearer structure.

That last point matters, but it is future value. I do not want to oversell it as something learners benefit from today. Today, the visible wins are faster setup, better readiness, cleaner docs, and clearer releases.

## Refactor benefits for contributors

The contributor benefits are more immediate because contributors are the people who have to live in this code.

For contributors, the refactor means:

- The setup code is split by responsibility instead of living in one large Bash file.
- The `verify` command is a Python package instead of a long embedded heredoc.
- Challenge code is easier to find, review, and change.
- Release mode now uses versioned setup assets with checksums.
- Contributor mode still supports testing local, unmerged setup changes.
- The CTF testing skill and scripts have a clearer role in validating challenge behavior.
- Release notes now describe lab updates in a way learners and contributors can both follow.
- Future readiness work is tracked separately in issue #90 instead of being hidden inside the refactor.

This also makes the maintenance process easier to explain. A contributor can work on a challenge, test it through contributor mode, open a PR, merge it, publish a release, and let learners deploy that release. That is a much cleaner loop than asking a VM to pull whatever happens to be on a moving branch.

## The manual part still mattered

After the readiness fix, we still manually captured and verified every challenge flag against the live lab. That found the sort of small issues automation can miss.

For example, recursive `grep` can include filenames in its output. That matters because `verify` needs only the flag, not `./flag.txt:CTF{...}`. A couple of solution commands had to use `grep -h` so the extracted value was only the flag. The disk image challenge also printed a harmless `lost+found` permission warning during manual extraction, which was fine for solving but noisy for a solutions helper.

None of that changes the refactor architecture. It does prove something more important: the lab still works when used from a shell by a real person. All eighteen challenge flags were captured and verified manually. `verify export` worked. The setup readiness fix worked. The MOTD displayed correctly.

For a learning lab, that end-to-end manual check is not extra. It is part of the product.

## What I would still change

I do not think the readiness work is finished forever. The current readiness check is intentionally simple and cross-cloud. It waits for setup markers over SSH and fails if setup writes a failure marker.

That solved the immediate learner problem, but provider-native readiness would probably be better long term. Azure, AWS, and GCP each have their own ways of reporting VM setup state. The hard part is doing that cleanly without turning the Terraform into three unrelated projects.

That is why issue #90 exists. The immediate fix made the release usable. The follow-up issue keeps the better long-term idea visible without blocking the refactor.

## What this refactor really was

I started this because a book chapter about subprocesses made me want to practice the idea in real code. What I got was a reminder that refactors are rarely only about code shape.

This one started with Bash and Python, but it quickly touched release packaging, cloud-init, Terraform behavior, first-boot data limits, contributor testing, learner docs, and manual validation.

The final lesson is simple: Bash is still fine for bootstrapping a VM. Python is better for organizing the setup once that bootstrap grows into an application. Subprocess is the bridge between those two worlds.

The best outcome was not that Bash disappeared. It did not. The best outcome was that Bash got smaller, Python took over the structured parts, contributors got a cleaner workflow, and learners got a faster, more reliable lab.
