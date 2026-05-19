---
title: "How to use Xunit with Azure Functions in Visual Studio Code"
description: "testing one two testing..."
pubDate: 2021-04-07
updatedDate: 2021-06-28
tags: ["azure"]
featureImage: "https://madebygps.azurewebsites.net/content/images/2021/04/Screen-Shot-2021-04-10-at-9.25.53-AM-1.png"
---

<p>While working on my <a href="https://github.com/madebygps/cgc-azure-resume">Azure Resume Challenge project</a>, I had to implement tests with Azure Functions .NET. Xunit seems to be the go to for these things.</p><h3 id="1-structure-your-project-properly">1. Structure your project properly</h3><p>Make sure your Functions and your tests live in peer folders. I am not 100% sure if this is necessary but when I tried otherwise, I was getting reference errors.</p><h3 id="2-dotnet-new-xunit">2. dotnet new xunit</h3><p>In the directory where your tests will live, create a <a href="https://xunit.net/docs/getting-started/netcore/cmdline">new xunit app</a>.</p><p><code>dotnet new xunit</code></p><h3 id="3-add-microsoft-aspnetcore-mvc-to-your-xunit-app">3. Add Microsoft.AspNetCore.Mvc to your Xunit app</h3><p>In the direcotyr where your tests live, add the <a href="https://www.nuget.org/packages/Microsoft.AspNetCore.Mvc/">Microsoft.AspNetCore.Mvc</a> package.</p><p><code>dotnet add package Microsoft.AspNetCore.Mvc</code></p><h3 id="4-reference-your-functions-app-from-your-xunit-app">4. Reference your functions app from your Xunit app</h3><p>You'll need to reference your functions app from where your tests live, it will look something like this, my functions live in a folder called <code>api</code></p><p><code>dotnet add reference ../api/api.csproj</code></p><p>This should create an item group in your test csproj, similar to:</p><pre><code class="language-xml">&lt;ItemGroup&gt;
    &lt;ProjectReference Include="..\api\api.csproj" /&gt;
&lt;/ItemGroup&gt;</code></pre><h3 id="5-test-the-setup">5. Test the setup</h3><p>Finally run <code>dotnet test</code> to make sure you get no errors, you're now ready to add the supporting files and your first test. <a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-test-a-function#c-in-visual-studio">Checkout this Microsoft documentation page</a>, it has an example HTTP and Timer trigger test you can implement.</p>
