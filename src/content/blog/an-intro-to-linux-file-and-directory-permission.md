---
title: "An intro to Linux file and directory permissions"
description: "No, everyone should not be root."
pubDate: 2021-02-20
updatedDate: 2021-06-28
tags: ["linux"]
featureImage: "https://madebygps.azurewebsites.net/content/images/2021/02/Screenshot-2021-02-19-200029.jpg"
---

<p>We know that the root user can basically do anything on the system. Other users have more limitations and are usually collected into groups. You put users with similar needs into a group that is granted relevant permissions, each member inherits the group permissions.</p><p>Let's take a look at:</p><ul><li>Checking permissions</li><li>Changing permissions</li><li>Default permissions</li><li>Special permissions</li></ul><h2 id="granting-permissions">Granting Permissions</h2><p>The three levels of permission are:</p><ul><li><strong>r</strong>: Permission to read.</li><li><strong>w</strong>: Permission to write.</li><li><strong>x</strong>: Permission to execute. </li></ul><p>When a file is created, typically the user who created it is the owner of it and the owning group is the user's current group. We can move ownership of a file to a different user by using the <code>chown</code><em><strong> </strong></em>command.</p><pre><code class="language-bash">chown gps /tmp/file.txt</code></pre><p>Here we are giving the user gps ownership of the file.txt from the /tmp directory.</p><p>We can also move ownership of a file from one group to another, we use the <code>chgrp</code> for that.</p><pre><code class="language-bash">chgrp cloudadmins newIDS</code></pre><p>Say we have an application called <code>newIDS</code>, here we are giving group ownership to the <code>cloudadmins</code> group of <code>newIDS</code>.</p><h2 id="checking-permissions">Checking Permissions</h2><pre><code class="language-bash">ls -l</code></pre><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/02/image-24.png" class="kg-image" alt loading="lazy" width="708" height="450" srcset="https://madebygps.azurewebsites.net/content/images/size/w600/2021/02/image-24.png 600w, https://madebygps.azurewebsites.net/content/images/2021/02/image-24.png 708w"></figure><p>The ls command with the <code>-l</code> (long) switch will display the contents of a directory, containing the permissions. Let's break this down a bit more.</p><pre><code class="language-bash">drwxr-xr-x 2 azureuser azureuser 4096 Feb 14 22:31 Videos</code></pre><p>The first character is the file type, in this case it's a d, which means it's a directory. This character can be:</p><ul><li>(-) regular file</li><li>(d) directory</li><li>(c) character special </li><li>(b) block special</li><li>(p) fifo</li><li>(l) symbolic link</li><li>(s) socket</li></ul><p>You' typically see <code>d</code>,`-` or <code>l</code>. In this post we'll focus on <code>-</code> and <code>d</code>, I'll have another one on symbolic links, here's a <a href="https://linuxhint.com/soft_link_vs_hard_link/">great post</a> on it, they are sort of like links to files. </p><p>Next we have </p><pre><code class="language-bash">rwxr-xr-x </code></pre><p>Nine characters, the first three are the permissions of the user, the next three are the permissions for the group, and the last three are the permissions for others. </p><ul><li>So in our case, the group user has <code>rwx</code> (read, write, and execute) permissions.</li><li>The group has <code>r-x</code> (read, no write, and execute) the <code>-</code> means the respective permission hasn't been given. </li><li>The others column has <code>r-x</code> (read, no write, and execute)</li></ul><pre><code class="language-bash">2 azureuser azureuser 4096 Feb 14 22:31 Videos</code></pre><p>What's left is the number of links, the user (azureuser) the size, date created, and name.</p><p>We can change permissions if we need to.</p><h2 id="changing-permissions">Changing Permissions</h2><p>Only a root user or the file's own can change permission, we use the <code>chmod</code><strong><em> </em></strong>command for that and we can use Decimal notation or or UGO, let's look at Decimal notation first.</p><h3 id="changing-permission-with-decimal-notation">Changing permission with Decimal Notation</h3><p>This table contains all possible permission combinations and their octal and binary representatives.</p><!--kg-card-begin: markdown--><table>
<thead>
<tr>
<th>Binary</th>
<th>Octal</th>
<th>rwx</th>
</tr>
</thead>
<tbody>
<tr>
<td>000</td>
<td>0</td>
<td>---</td>
</tr>
<tr>
<td>001</td>
<td>1</td>
<td>--x</td>
</tr>
<tr>
<td>010</td>
<td>2</td>
<td>-w-</td>
</tr>
<tr>
<td>011</td>
<td>3</td>
<td>-wx</td>
</tr>
<tr>
<td>100</td>
<td>4</td>
<td>r--</td>
</tr>
<tr>
<td>101</td>
<td>5</td>
<td>r-x</td>
</tr>
<tr>
<td>110</td>
<td>6</td>
<td>rw-</td>
</tr>
<tr>
<td>111</td>
<td>7</td>
<td>rwx</td>
</tr>
</tbody>
</table>
<!--kg-card-end: markdown--><p>If we wanted to represent all permission for owner, group, and others, we could use</p><pre><code class="language-bash">777</code></pre><p>Each digit, in this case, each one is a 7, represents the permissions for user, group, others. In the table, we see that 7 in octal is <code>rwx</code>, which is all permissions. So how do we use <code>chmod</code> with this?</p><pre><code class="language-bash">chmod 777 sample.txt</code></pre><p>This would give the owner all permission, the group all permissions, and everyone else (other) all permissions. </p><pre><code class="language-bash">chmod 700 sample.txt
chmod 774 sample.txt
chmod 755 sample.txt</code></pre><ul><li>The first one would give the owner all permissions, the group no permissions, and other no permissions.</li><li>The second one would give the owner all permissions, the group all permissions, and other only read permissions.</li><li>The third one would give the owner all permissions, the group read and execute permissions, and other read and execute permissions. </li></ul><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/02/image-28.png" class="kg-image" alt loading="lazy" width="1062" height="225" srcset="https://madebygps.azurewebsites.net/content/images/size/w600/2021/02/image-28.png 600w, https://madebygps.azurewebsites.net/content/images/size/w1000/2021/02/image-28.png 1000w, https://madebygps.azurewebsites.net/content/images/2021/02/image-28.png 1062w" sizes="(min-width: 720px) 720px"></figure><h3 id="changing-permissions-with-ugo">Changing Permissions with UGO</h3><p>The numeric method of changing permissions is the most used, but we can still use the symbolic method, UGO. </p><ul><li><code>-</code> Removes a permission.</li><li><code>+</code> Adds a permission.</li><li><code>=</code> Sets a permission.</li></ul><p>Let's remove the write permission from the user that owns <code>sample.txt</code></p><pre><code class="language-bash">chmod u-w sample.txt</code></pre><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/02/image-29.png" class="kg-image" alt loading="lazy" width="1064" height="221" srcset="https://madebygps.azurewebsites.net/content/images/size/w600/2021/02/image-29.png 600w, https://madebygps.azurewebsites.net/content/images/size/w1000/2021/02/image-29.png 1000w, https://madebygps.azurewebsites.net/content/images/2021/02/image-29.png 1064w" sizes="(min-width: 720px) 720px"></figure><p>We can change multiple permissions at once</p><pre><code class="language-bash">chmod u-rw sample.txt</code></pre><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/02/image-30.png" class="kg-image" alt loading="lazy" width="1068" height="243" srcset="https://madebygps.azurewebsites.net/content/images/size/w600/2021/02/image-30.png 600w, https://madebygps.azurewebsites.net/content/images/size/w1000/2021/02/image-30.png 1000w, https://madebygps.azurewebsites.net/content/images/2021/02/image-30.png 1068w" sizes="(min-width: 720px) 720px"></figure><pre><code class="language-bash">chmod u+rwx,o+rwx sample.txt</code></pre><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/02/image-31.png" class="kg-image" alt loading="lazy" width="1059" height="220" srcset="https://madebygps.azurewebsites.net/content/images/size/w600/2021/02/image-31.png 600w, https://madebygps.azurewebsites.net/content/images/size/w1000/2021/02/image-31.png 1000w, https://madebygps.azurewebsites.net/content/images/2021/02/image-31.png 1059w" sizes="(min-width: 720px) 720px"></figure><h2 id="default-permissions-umask-">Default permissions (umask)</h2><p>Linux automatically assigns all files and directories default permissions. 666 for files and 777 for directories. By default you won't be able to execute a file immediately after downloading it. </p><p>You can change the default permissions with the <code>umask</code><strong><em> </em></strong>(user file-creation mask) method. This method represents the permissions you want to remove from the base permissions on a file or directory.</p><p>The <code>umask</code><strong><em> </em></strong>is a three-digit octal number corresponding to the three permissions digits. In most Debian systems, the <code>umask</code><strong><em> </em></strong>is set to 022. It is subtracted from the permissions number to give the new permissions status.  </p><!--kg-card-begin: markdown--><table>
<thead>
<tr>
<th>New Files</th>
<th>New Directories</th>
<th>Permissions</th>
</tr>
</thead>
<tbody>
<tr>
<td>666</td>
<td>777</td>
<td>Linux base permissions</td>
</tr>
<tr>
<td>-022</td>
<td>-022</td>
<td>umask</td>
</tr>
<tr>
<td>644</td>
<td>755</td>
<td>Resulting permissions</td>
</tr>
</tbody>
</table>
<!--kg-card-end: markdown--><p>Each user can set a personal default <code>umask</code><strong><em> </em></strong>value for the files and directories in their personal .profile file. </p><p>To view the current value of your <code>umask</code></p><pre><code class="language-bash">umask</code></pre><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/02/image-32.png" class="kg-image" alt loading="lazy" width="637" height="177" srcset="https://madebygps.azurewebsites.net/content/images/size/w600/2021/02/image-32.png 600w, https://madebygps.azurewebsites.net/content/images/2021/02/image-32.png 637w"></figure><h2 id="special-permissions">Special Permissions</h2><pre><code class="language-bash">set user ID (SUID)
set group ID (SGUID)
sticky bit</code></pre><h3 id="suid">SUID</h3><p>The <code>SUID</code> bit says any user can execute the file with the permissions of the owner but those permissions don't extend beyond the use of that file. To change this bit, you change the first value after <code>chmod</code><strong><em> </em></strong>to a 4, typically you only use 3 digits, because the first one is implied as a 0. If you see an s in place of an x in the owner permissions of a file, that means the <code>SUID</code> bit is set. </p><pre><code class="language-bash">chmod 4644 sample.txt</code></pre><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/02/image-33.png" class="kg-image" alt loading="lazy" width="909" height="342" srcset="https://madebygps.azurewebsites.net/content/images/size/w600/2021/02/image-33.png 600w, https://madebygps.azurewebsites.net/content/images/2021/02/image-33.png 909w" sizes="(min-width: 720px) 720px"></figure><h2 id="sgid-set-group-id-up-on-execution-">SGID (<strong><strong>S</strong></strong>et <strong><strong>G</strong></strong>roup <strong><strong>ID</strong></strong> up on execution)</h2><p><code>SGID</code> assigns group ownership to files. Useful for shared group directories. You can apply <code>SGID</code> to directories and files.</p><p>With an <code>SGID</code> bit set on a file, someone without execute permissions can execute a file if the owner belongs to the group that has permissions to execute that file. </p><p>With an <code>SGID</code> bit set on a directory, ownership of new files created in that directory goes to the directories creator's group, rather that the file creator's group. </p><p>The <code>SGID</code> bit is represented  as a 2 before the regular permissions. If you see an s in place of an x in the group permissions of a file or directory, that means the <code>SGID</code> bit is set. </p><pre><code class="language-bash">chmod 2644 sample.txt</code></pre><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/02/image-34.png" class="kg-image" alt loading="lazy" width="839" height="266" srcset="https://madebygps.azurewebsites.net/content/images/size/w600/2021/02/image-34.png 600w, https://madebygps.azurewebsites.net/content/images/2021/02/image-34.png 839w" sizes="(min-width: 720px) 720px"></figure><h2 id="sticky-bit">Sticky Bit</h2><p>This permission has a <code>t</code> in place of an <code>x</code> in the other's column. When you set the sticky bit on a directory, people can only delete files that belong to them within that directory. They can’t delete files that belong to someone else, no matter which combination of file permissions are set on the files. You can only apply the sticky bit to directories. If you see an t in place of an x in the other's permissions of a directory, that means the sticky bit is set. </p><pre><code class="language-bash">chmod 1777 sample.txt</code></pre><p>The sticky bit is ignored by modern Linux systems, but you should be familiar with the term at least. </p>
