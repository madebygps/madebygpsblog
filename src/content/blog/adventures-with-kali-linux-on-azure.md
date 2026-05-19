---
title: "Adventures with Kali Linux on Azure #1"
description: "This image is old!"
pubDate: 2021-02-15
updatedDate: 2021-06-28
tags: ["azure", "linux"]
featureImage: "https://madebygps.azurewebsites.net/content/images/2021/02/Screenshot-2021-02-14-225523.jpg"
---

<p><a href="https://azuremarketplace.microsoft.com/en-us/marketplace/apps/kali-linux.kali-linux?tab=Overview">This image is old!</a> You'll have to </p><pre><code class="language-bash">wget -q -O - https://archive.kali.org/archive-key.asc | apt-key add</code></pre><p>before you can properly </p><pre><code class="language-Bash">sudo apt update
sudo apt full-upgrade
sudo apt autoremove</code></pre><p>Shout out to this <a href="https://unix.stackexchange.com/questions/421821/invalid-signature-for-kali-linux-repositories-the-following-signatures-were-i">Stack Overflow post</a> for pointing me in the right direction.</p><p>Your sources.list in </p><pre><code class="language-shell">/etc/apt </code></pre><p>should be fine, if not compare it to what's in the <a href="https://www.kali.org/docs/general-use/kali-linux-sources-list-repositories/">official website</a> and update accordingly. </p><p>Next up, so we can actually interact with the GUI, let's get <code>xrdp</code>.</p><pre><code class="language-shell">sudo apt update
sudo apt install xrdp

sudo systemctl enable xrdp
sudo systemctl restart xrdp</code></pre><p>That should install <code>xrdp</code>. Download your rdp file from your VM connect option in the Azure portal, and you should now be able to login. </p><p>A quick</p><pre><code class="language-shell">lsb_release -a</code></pre><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/02/image.png" class="kg-image" alt loading="lazy" width="1430" height="846" srcset="https://madebygps.azurewebsites.net/content/images/size/w600/2021/02/image.png 600w, https://madebygps.azurewebsites.net/content/images/size/w1000/2021/02/image.png 1000w, https://madebygps.azurewebsites.net/content/images/2021/02/image.png 1430w" sizes="(min-width: 720px) 720px"></figure><p>now shows us that we are on the latest version :)</p>
