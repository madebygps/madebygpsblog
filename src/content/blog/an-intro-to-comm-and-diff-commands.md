---
title: "An intro to comm and diff commands"
description: "It's often useful to compare versions of text files."
pubDate: 2021-03-02
updatedDate: 2021-06-28
tags: ["linux"]
featureImage: "https://madebygps.azurewebsites.net/content/images/2021/03/Screenshot-2021-03-02-102227.png"
---

<p>It's often useful to compare versions of text files. Let's take a look at <code>comm</code> and <code>diff</code></p><h2 id="the-comm-command">The <code>comm</code> command</h2><p>This command compares two text files and displays the lines that are unique to each one and the lines they have in common. </p><p>Let's say we have these two files:</p><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/03/image.png" class="kg-image" alt loading="lazy" width="463" height="268"></figure><p>When we run <code>comm file1.txt file2.txt</code> we get</p><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/03/image-1.png" class="kg-image" alt loading="lazy" width="477" height="207"></figure><p>In my opinion, the <code>comm</code> output is somewhat hard to look at, but it's three columns. Excuse my terrible lines:</p><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/03/image-2.png" class="kg-image" alt loading="lazy" width="515" height="300"></figure><p>The first column contains lines unique to the first file argument, the second column contains the lines unique to the second file argument, and the third column contains the lines shared by both files.</p><p>We can choose to suppress a specific column by using the option <code>-n</code> where <code>n</code> is either 1, 2, or 3. Say we wanted to output only the lines shared by both files, we can use <code>comm -12 file1.txt file2.txt</code></p><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/03/image-3.png" class="kg-image" alt loading="lazy" width="466" height="100"></figure><h2 id="the-diff-command">The <code>diff</code> command</h2><p><code>diff</code> is a much more complex tool. It supports many output formats and has the ability to process large collections of text files at once. <code>diff</code> is often used to create <code>diff files</code> (patches) that are used by programs such as <code>path</code> to convert one version of a file or files to another version. Let's run <code>diff</code> on our same two files from before <code>diff file1.txt file2.txt</code></p><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/03/image-4.png" class="kg-image" alt loading="lazy" width="467" height="171"></figure><p>This is the default style output, in this format, each group of changes is preceded by a change command in the form of <code>range operation range</code> to describe the positions and types of changes required to convert the first file to the second file. </p><p>First we see</p><pre><code class="language-bash">1d0
&lt; a</code></pre><p>This is telling us that we have to delete the first row in the file1, which is the line with a.</p><p>Next we have</p><pre><code class="language-bash">4a4
&gt; e</code></pre><p>which is telling us that we have to add a line to the first file, in the fourth line position, then it tells us which line to add <code>&gt; e</code></p><p>I know this is confusing, to be fair, the default style isn't used as much as the 	<code>context format</code> and <code>unified format</code> are, let's look at those an explain more.</p><p>We can use the <code>context format</code> by adding the <code>-c</code> option </p><pre><code class="language-bash">diff -c file1.txt file2.txt</code></pre><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/03/image-5.png" class="kg-image" alt loading="lazy" width="510" height="288"></figure><p>At the top we see the names of the two files and their timestamps, the first file is marked with asterisks, and the second file is marked with dashes. <code>diff</code> will use either asterisks or dashes to let us know which file it's talking about throughout the remainder of the listing.</p><p>Next we see a line of asterisks which is just formatting. </p><p>Then we've got groups of changes, in the first group we see</p><pre><code class="language-bash">*** 1,4 ****
</code></pre><p>which means lines 1 through 4 in the first file</p><p>and then we see</p><pre><code class="language-bash">- a
  b
  c
  d</code></pre><p>Which is the contents of the file, except there's a <code>-</code> before the a, that means we have to remove it. </p><!--kg-card-begin: markdown--><table>
<thead>
<tr>
<th>Indicator</th>
<th>Meaning</th>
</tr>
</thead>
<tbody>
<tr>
<td>blank</td>
<td>No change needs to be made</td>
</tr>
<tr>
<td>(-)</td>
<td>Line needs to be deleted</td>
</tr>
<tr>
<td>(+)</td>
<td>Line needs to be added</td>
</tr>
<tr>
<td>!</td>
<td>Line needs to be changed</td>
</tr>
</tbody>
</table>
<!--kg-card-end: markdown--><p>In our first group, we can see that the line with <code>- a</code> needs to be removed from our first file. Our second group of changes is</p><pre><code class="language-bash">--- 1,4 ----
  b
  c
  d
+ e</code></pre><p>the <code>---1,4----</code> is the range of the second file, the <code>+ e</code> means we need to add this line to the first file, remember the goal is to make the first file match the second file. </p><p>We can also use the <code>unified format</code> it's similar, but more concise, it eliminates the duplicated lines of context. <code>diff -u file1.txt file2.txt</code></p><figure class="kg-card kg-image-card"><img src="https://madebygps.azurewebsites.net/content/images/2021/03/image-6.png" class="kg-image" alt loading="lazy" width="563" height="241"></figure>
