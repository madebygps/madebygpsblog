---
title: "Azure CLI basics"
description: "It takes me 30 seconds to deploy a VM with the cli vs 6 ish minutes in the portal..."
pubDate: 2022-11-22
updatedDate: 2024-04-28
tags: ["azure", "linux", "cli"]
---
<h2 id="whats-the-advantage-of-using-an-azure-command-line-tool">What's the advantage of using an Azure command-line tool?</h2>
<p>Azure runs on automation. Every action inside the portal translates to code being executed to read, create, modify, or delete resources. Azure command-line tools automate routine operations, standardize database failovers, and pull data that provide powerful insight.</p>
<h2 id="choose-the-right-azure-command-line-tool">Choose the right Azure Command Line Tool</h2>
<p>You have two options when it comes to Azure command-lines: Azure CLI and Azure Powershell. Both are cross-platform, installable on Windows, macOS, and Linux. The most significant difference is that Azure CLI runs in Windows PowerShell, Cmd, Bash, and Unix shells. Azure Powershell requires Windows PowerShell or Powershell to run. Choose the tool that uses your experience and shortens your learning curve but use a different tool when it makes sense.</p>
<h2 id="how-to-install-the-azure-cli">How to install the Azure CLI</h2>
<h1 id="commands-you-should-know">Commands you should know</h1>
<h2 id="az-login">az login</h2>
<p>Before using any Azure CLI commands with a local install, you need to sign in with az login. If you're using the Azure Cloud Shell, you don't need to login.</p>
<p>If a browser is not available for you to sign in, use <code>az login --use-device-code</code></p>
<h2 id="set-your-subscription">Set your subscription</h2>
<p>It's important to set the CLI to work within the subscription you want to. When you login, a default subscription is set for you but you can change that using the <code>az account</code> commands.</p>
<ul>
<li><code>az account set --subscription {subscription-name}</code>: Will set the subscription. You must provide the name.</li>
<li><code>az account list</code>: Will give you a list of available subscriptions.</li>
<li><code>az account show</code>: will display the current set subscription</li>
</ul>
<h2 id="the-anatomy-of-an-azure-cli-command">The Anatomy of an Azure CLI command</h2>
<p><img src="https://madebygps.azurewebsites.net/content/images/2022/11/command-diagram.png" alt="command-diagram" loading="lazy"></p>
<ul>
<li><strong>Prefix:</strong> All CLIs have prefixes. Azure's is <code>az</code>.</li>
<li><strong>Group:</strong> Commands are organized into command groups. Each group represents an Azure service.</li>
<li><strong>Subgroup:</strong> If a service has various types or services, it will have a or various subgroups.</li>
<li><strong>Command:</strong> An operation on the service.</li>
<li><strong>Arguments:</strong> Values you provide the command for context. Arguments can be required, optional, and/or global. The words arguments and parameters are often used interchangeably.</li>
</ul>
<h2 id="az-config-and-az-init">az config and az init</h2>
<p>The Azure CLI allows for user configuration for settings such as logging, data collection, and default argument values. The CLI offers a convenience command for managing some defaults, az config, and an interactive option through az init.</p>
<p>az init is an extension that is intended to quickly set up global configurations suitable for your current environment. It adjusts the same configuration file as az config and is meant to help simplify the configuration process whereas az config allows you to go a bit deeper.</p>
<pre><code class="language-sh">az init
</code></pre>
<p>You can set defaults for the CLI with the az config set command. This command takes a space-separated list of key=value pairs as an argument. The provided values are used by the Azure CLI in place of required arguments.</p>
<pre><code class="language-sh">az config set defaults.location=eastus2 defaults.group=MyResourceGroup
</code></pre>
<h2 id="interactive-mode">Interactive mode</h2>
<p>You can use Azure CLI in interactive mode by running the az interactive command. The Azure CLI interactive mode places you in an interactive shell with auto-completion, command descriptions, and examples.</p>
<p><img src="https://madebygps.azurewebsites.net/content/images/2022/11/interactive.png" alt="interactive" loading="lazy"></p>
<h2 id="finding-commands-and-help">Finding commands and help</h2>
<p>To search for commands, use <code>az find</code>. For example, to search for command names containing secret, use the following command:</p>
<pre><code class="language-sh">az find secret
</code></pre>
<h2 id="globally-available-arguments">Globally available arguments</h2>
<p>There are some arguments that are available for every Azure CLI command.</p>
<ul>
<li><code>--help</code> prints CLI reference information about commands and their arguments and lists available subgroups and commands.</li>
<li><code>--output</code> changes the output format. The available output formats are json, jsonc (colorized JSON), tsv (Tab-Separated Values), table (human-readable ASCII tables), and yaml. By default the CLI outputs json.</li>
<li><code>--query</code> uses the JMESPath query language to filter the output returned from Azure services.</li>
<li><code>--verbose</code> prints information about resources created in Azure during an operation, and other useful information.</li>
<li><code>--debug</code> prints even more information about CLI operations, used for debugging purposes. If you find a bug, provide output generated with the --debug flag on when submitting a bug report.</li>
</ul>
<h2 id="persisted-parameters">Persisted Parameters</h2>
<p>Azure CLI offers persisted parameters that enable you to store parameter values for continued use. Persisted parameter values are stored in the working directory of the Azure storage account used by Azure Cloud Shell. If you are using a local install of the Azure CLI, values are stored in the working directory on your machine.</p>
<pre><code class="language-sh"># Reminder: function app and storage account names must be unique.

# turn persisted parameters on
az config param-persist on

# Create a resource group which will store "resource group" and "location" in persisted parameter.
az group create --name RGlocalContext --location westeurope

# Create an Azure storage account omitting location and resource group.
az storage account create \
  --name sa1localcontext \
  --sku Standard_LRS

# Create a serverless function app in the resource group omitting storage account and resource group.
az functionapp create \
  --name FAlocalContext \
  --consumption-plan-location westeurope \
  --functions-version 2

# See the stored parameter values
az config param-persist show
</code></pre>
<table>
<thead>
<tr>
<th>Reference</th>
<th>Scope</th>
<th>Set</th>
<th>Use</th>
<th></th>
</tr>
</thead>
<tbody>
<tr>
<td>az config set defaults.=</td>
<td>Scoped globally across the CLI</td>
<td>Set explicitly using az config set defaults.=</td>
<td>Use for settings such as logging, data collection, and default argument values</td>
<td></td>
</tr>
<tr>
<td>az config param-persist</td>
<td>Scoped locally to a specific working directory</td>
<td>Set automatically once persisted parameters are turned on</td>
<td>Use for individual workload sequential commands.</td>
<td></td>
</tr>
</tbody>
</table>
<h2 id="querying">Querying</h2>
<p>The Azure CLI uses the <code>--query</code> parameter to execute a JMESPath query on the results of commands. JMESPath is a query language for JSON, giving you the ability to select and modify data from CLI output.</p>
<p>The <code>--query</code> parameter is supported by all commands in the Azure CLI.</p>
<p>Even when using an output format other than JSON, CLI command results are first treated as JSON for queries. CLI results are either a JSON array or dictionary. Arrays are sequences of objects that can be indexed, and dictionaries are unordered objects accessed with keys. Commands that could return more than one object return an array, and commands that always return only a single object return a dictionary.</p>
<h3 id="a-few-examples">A few examples:</h3>
<pre><code class="language-sh"># The following command gets the SSH public keys authorized to connect to the VM by adding a query:

az vm show --resource-group rg-demo1 --name vm1 --query "osProfile.linuxConfiguration.ssh.publicKeys"
</code></pre>
<pre><code class="language-sh"># To get multiple values, put expressions separated by commas in square brackets [ ] (a multiselect list)

az vm show --resource-group rg-demo1 --name TestVM --query "[name, osProfile.adminUsername, osProfile.linuxConfiguration.ssh.publicKeys[0].keyData]"
</code></pre>
<pre><code class="language-sh"># To get a dictionary instead of an array when querying for multiple values, use the { } (multiselect hash) operator.

az vm show --resource-group rg-demo1 --name TestVM --query "{VMName:name, admin:osProfile.adminUsername, sshKey:osProfile.linuxConfiguration.ssh.publicKeys[0].keyData}"
</code></pre>
<pre><code class="language-sh"># To access the properties of elements in an array, you do one of two operations: flattening or filtering. Flattening an array is done with the [] JMESPath operator. All expressions after the [] operator are applied to each element in the current array. If [] appears at the start of the query, it flattens the CLI command result.

az vm list --resource-group rg-demo1 --query "[].{Name:name, OS:storageProfile.osDisk.osType, admin:osProfile.adminUsername}"
</code></pre>
<pre><code class="language-sh">
# We can also use filters

az vm list --resource-group rg-demo1 --query "[?storageProfile.osDisk.osType=='Linux'].{Name:name,  admin:osProfile.adminUsername}" --output table
</code></pre>
<h2 id="formatting">Formatting</h2>
<h3 id="tsv-output-format">TSV output format</h3>
<p>The tsv output format returns tab- and newline-separated values without additional formatting, keys, or other symbols. This is useful when the output is consumed by another command.</p>
<pre><code class="language-sh">USER=$(az vm show --resource-group QueryDemo --name TestVM --query "osProfile.adminUsername")
echo $USER
</code></pre>
<h3 id="table-output-format">Table output format</h3>
<p>The table format prints output as an ASCII table, making it easy to read and scan. Not all fields are included in the table so this format is best used as a human-searchable overview of data. Fields that are not included in the table can still be filtered for as part of a query.</p>
<pre><code class="language-sh">az vm show --resource-group QueryDemo --name TestVM --query "{objectID:id}" --output table
</code></pre>
<h2 id="more-resources">More resources</h2>
<ul>
<li><a href="https://github.com/Azure/azure-cli">https://github.com/Azure/azure-cli</a></li>
<li><a href="https://learn.microsoft.com/cli/azure/reference-index?view=azure-cli-latest">https://learn.microsoft.com/cli/azure/reference-index?view=azure-cli-latest</a></li>
</ul>
