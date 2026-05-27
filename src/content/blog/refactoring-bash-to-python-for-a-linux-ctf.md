---
title: "Refactoring Bash to Python for a Linux CTF"
description: "How an Effective Python chapter turned into a real refactor of the Learn to Cloud Linux CTF setup."
pubDate: 2026-05-27
tags: ["python", "ctf"]
---

I was reading [*Effective Python*](https://effectivepython.com/), chapter 9, item 67: "Use `subprocess` to manage child processes." I learn best by applying ideas to real code, and luckily I maintain [Learn to Cloud](https://learntocloud.guide), which includes a [Linux CTF](https://github.com/learntocloud/linux-ctfs) that had accumulated a lot of Bash. I already knew I wanted to refactor that setup to Python, so the timing was perfect.

The Linux CTF is a lab for people learning the Linux command line. You deploy a VM in AWS, Azure, or GCP, SSH into it, and solve eighteen challenges with normal terminal tools. The learner experience is intentionally simple. The setup behind it was not.

---

## The Problem

Before this work, the VM was built by one large file: `ctf_setup.sh`. It installed packages, configured SSH, created users, generated flags, wrote challenge files, created services, managed state, wrote the MOTD, and embedded the whole `verify` command inside a Bash heredoc.

[Issue #81](https://github.com/learntocloud/linux-ctfs/issues/81) started with a question: should we port `ctf_setup.sh` to Python?

The first useful step was not writing Python. It was listing every responsibility the Bash script had taken on, then deciding what should become Python code and what should stay a system command.

| Category | Responsibilities |
| --- | --- |
| Pure Python | Flag generation and hashing, verification tokens, CTF state storage, MOTD, setup readiness check, `verify` CLI, challenges 1, 2, 3, 5, 7, 8, 9, 13, 15, 16, and completion marker |
| Subprocess only | Package installation, user management for `ctf_user`, `flag_user`, and `old_admin`, and challenge 18 filesystem commands |
| Mixed | OS and SSH config, challenges 4, 6, 10, 11, 12, 14, and 17 |

That table was the real design decision. This was not "replace Bash with Python." It was "use Python for structure, and use subprocess for the Linux commands that still belong in Linux."

---

## What We Changed

[PR #89](https://github.com/learntocloud/linux-ctfs/pull/89) turned `ctf_setup.sh` into a thin bootstrap. It installs `uv`, runs the Python setup package, installs the Python `verify` CLI, cleans the cache, and writes setup markers.

The real setup moved into `setup/`. The learner-facing `verify` command moved into `verify/`. Challenge code now lives closer to the challenge it builds. The `verify` command is no longer trapped inside a Bash heredoc.

This is where the `subprocess` idea clicked for me. Python became the parent process. It handles structure, paths, state, files, and command orchestration. Linux commands still do Linux work:

```bash
apt-get update
systemctl daemon-reload
useradd ctf_user
mkfs.ext4 disk.img
```

The goal was not to reimplement those commands in Python. The goal was to run them from a clearer setup program with consistent error handling.

One small example was the DNS challenge. The old setup touched `/etc/resolv.conf`, which is cloud-managed DNS plumbing on modern Ubuntu images. The new version leaves that file alone and puts the flag in a harmless systemd-resolved drop-in file. Learners still practice DNS discovery, but the VM networking is less fragile.

---

## What Testing Exposed

The refactor changed how the lab had to be shipped. Before, Terraform could download one file from GitHub. After the refactor, the VM needed `ctf_setup.sh`, `setup/`, and `verify/` together.

Putting all of that into cloud first-boot data was the wrong shape. AWS user data is limited to 16 KB before base64 encoding. Azure custom data is limited to 64 KB. GCP gives more room, but metadata still should not become a package transport system.

So the learner path moved to release assets. A GitHub release now ships a setup archive and checksum. Terraform passes a small startup script to the VM. The VM downloads the pinned release asset, verifies it, unpacks it, and runs `ctf_setup.sh`.

Contributor mode stayed separate. Contributors can still test unmerged local changes by uploading the local setup package with Terraform.

After [PR #89](https://github.com/learntocloud/linux-ctfs/pull/89) merged, we created [`v0.1.0`](https://github.com/learntocloud/linux-ctfs/releases/tag/v0.1.0) and tested the release path on Azure. The release package worked, but the learner experience had a problem: Terraform could print the VM IP before setup had finished.

That meant a learner could SSH in too early and see an incomplete lab. The setup might still be running, the MOTD might not be ready, and the challenge files might not exist yet.

We opened [issue #90](https://github.com/learntocloud/linux-ctfs/issues/90) for a better provider-specific readiness design later. For the immediate fix, [PR #91](https://github.com/learntocloud/linux-ctfs/pull/91) added a cross-provider readiness wait. Terraform now waits over SSH until setup success markers exist, and it fails early if setup writes a failure marker.

Then we created [`v0.1.1`](https://github.com/learntocloud/linux-ctfs/releases/tag/v0.1.1) and tested again. The MOTD showed correctly, the lab was ready when SSH was useful, and setup finished in about 1 minute and 48 seconds on Azure.

---

## What This Means for Learners and Contributors

The current direct benefit for learners is small but real. Learners do not care that the setup is Python now. They care whether the lab is ready, fast, and clear.

For learners, the benefits are:

- Setup is much faster in the tested release path.
- Terraform waits for setup to finish before handing over the VM connection details.
- The MOTD and challenge files are ready when learners arrive.
- Provider READMEs focus on the commands learners need to run.
- Learners can follow lab updates through release notes instead of reading PRs or maintainer comments.
- Future learner-facing features should be easier to add, but that is future value, not something I want to oversell today.

For contributors, the benefits are more immediate:

- Setup code is split by responsibility instead of living in one large Bash file.
- The `verify` command is a Python package instead of an embedded heredoc.
- Challenge code is easier to find, review, and change.
- Release mode uses versioned setup assets with checksums.
- Contributor mode still supports local, unmerged testing.
- The CTF testing skill and scripts now have a clearer role.
- Longer-term readiness work is tracked in issue #90 instead of being buried inside the refactor.

That is a cleaner maintenance loop. A contributor can change a challenge, test it locally through contributor mode, open a PR, merge it, publish a release, and let learners deploy that release.

---

## What I Learned

Manual testing still mattered. After the readiness fix, we captured and verified all eighteen flags against a live lab. That found small shell-output issues, like recursive `grep` including filenames when `verify` needed only the flag value. It also confirmed the important part: the lab worked end to end for a real person in a shell.

The refactor started because I wanted to practice an idea from a book. It ended up touching release packaging, cloud-init, Terraform behavior, first-boot data limits, contributor testing, learner docs, and manual validation.

That is usually how useful refactors go. They are rarely only about code shape.

Bash is still the right tool for bootstrapping a VM. Python is the better tool once that bootstrap becomes an application. `subprocess` is the bridge between those two jobs.
