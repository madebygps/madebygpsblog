---
title: "Introduction to Docker Containers"
description: "Oh Docker... let's get started."
pubDate: 2022-01-16
updatedDate: 2024-04-28
tags: ["cloud", "docker"]
featureImage: "https://images.unsplash.com/photo-1605745341075-1b7460b99df8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDN8fGRvY2tlcnxlbnwwfHx8fDE2NDIyOTYwODY&ixlib=rb-1.2.1&q=80&w=2000"
---

<p><a href="https://docs.microsoft.com/learn/modules/intro-to-docker-containers/">Introduction to Docker containers - Learn</a></p>
<p><a href="https://docs.docker.com/get-started/overview/">Docker overview</a></p>
<h1 id="the-problem-containers-solve">The problem containers solve</h1>
<p>There's usually more than one team working on the success of your application. There's the development team that creates the application, and the operations team that take care of the deployment and management of it. Typically each team will have an environment they work in:</p>
<ul>
<li>Development environment.</li>
<li>QA environment.</li>
<li>Pre-production environment.</li>
<li>Production environment.</li>
</ul>
<p>etc.</p>
<p>There are some challenges that occur because of this setup:</p>
<ul>
<li>Different environments require different software and hardware management.</li>
<li>Each deployment of our app to our environments must happen consistently.</li>
<li>Each deployment must execute in such a way that it's isolated from other applications running on the same hardware to make best use of resources without compromising each other.</li>
<li>Our applications must be portable.</li>
</ul>
<p>This is where containers come in to save the day.</p>
<h1 id="what-is-a-container">What is a container?</h1>
<p>A container is a loosely isolated environment that allows us to build and run software packages. These packages (called container images) include the code and all dependencies to run applications quickly and reliably on any computing environment.</p>
<p>The container image becomes the unit we use to distribute our applications.</p>
<p>The process of deploying and running our apps with containers is called containerization.</p>
<p>One of the strengths of containerization is that you don't have to configure hardware and spend time installing operating systems and software to host a deployment.</p>
<p>Since containers are isolated from each other, they help us improve the security of our application. Multiple containers can run on the same hardware, improving the efficiency of hardware use.</p>
<h1 id="what-is-docker">What is Docker?</h1>
<p>Docker is the most popular containerization platform. We use it to develop, ship, and run containers.</p>
<h1 id="docker-architecture">Docker Architecture</h1>
<p><img src="https://docs.microsoft.com/learn/modules/intro-to-docker-containers/media/2-docker-architecture.svg" alt="https://docs.microsoft.com/learn/modules/intro-to-docker-containers/media/2-docker-architecture.svg" loading="lazy"></p>
<h2 id="docker-host">Docker Host</h2>
<h3 id="docker-engine">Docker Engine</h3>
<p>The Docker Engine is configured as a client-server implementation where the client and server can run on the same host or on a remote one and communicate via the Docker REST API. Components making up the engine are:</p>
<ul>
<li><strong>The Docker client</strong>
<ul>
<li>It’s a command-line named <code>docker</code> used to interact with a local or remote Docker server and functions as the primary interface to manage containers.</li>
</ul>
</li>
<li><strong>The Docker server</strong>
<ul>
<li>A daemon named <code>dockerd</code> (computer program that runs as a background process). It’s job is to respond to requests from the Docker client via the Docker Rest API, interact with other daemons, and keep track of the lifecycle our the containers.</li>
</ul>
</li>
<li><strong>Docker objects</strong>
<ul>
<li>When working with Docker, you’ll create and work with images, containers, networks, plugins, and other objects.</li>
</ul>
</li>
</ul>
<h2 id="docker-hub">Docker Hub</h2>
<p>Docker Hub is a Docker container registry and it’s the default public registry Docker uses for image management. A container registry are repositories that we can use to store and distribute container images we create.</p>
<h1 id="how-docker-images-work">How Docker images work</h1>
<h2 id="what-is-a-container-image">What is a container image?</h2>
<p>A container image is made up of:</p>
<ul>
<li>application code</li>
<li>system packages</li>
<li>binaries</li>
<li>libraries</li>
<li>configuration files</li>
<li>operating system</li>
</ul>
<p>This image, when run, becomes a container. An image is immutable, to apply changes to it you would have to create a new image.</p>
<p><strong>A container image is an immutable package that contains all the application code, system packages, binaries, libraries, configuration files, and the operating system running in the container. Docker containers running on Linux share the host OS kernel and don't require a container OS as long as the binary can access the OS kernel directly.</strong></p>
<h2 id="what-is-the-host-os">What is the host OS?</h2>
<p>The OS on which the Docker engine is running on is the host OS.</p>
<ul>
<li>Containers running on Linux share the same host OS kernel and don’t require a container OS as long as they binary can access the OS kernel directly.</li>
<li>Containers running on Windows need a container OS. The container depends on the OS kernel to manage services such as the file system, network management, process scheduling, and memory management.</li>
</ul>
<h2 id="what-is-the-container-os">What is the container OS?</h2>
<p>The container OS is the OS that is part of the container image. We can include different versions of Linux or Windows in a container and this allows us to access specific OS features.</p>
<p><img src="https://docs.microsoft.com/learn/modules/intro-to-docker-containers/media/3-container-ubuntu-host-os.svg" alt="https://docs.microsoft.com/learn/modules/intro-to-docker-containers/media/3-container-ubuntu-host-os.svg" loading="lazy"></p>
<p>It’s isolated from the host OS and is the environment in which we deploy and run our app. This isolation means the environment for our application running in development is the same as in production.</p>
<h2 id="what-is-the-stackable-unification-file-system-unionfs">What is the Stackable Unification File System (<code>Unionfs</code>)</h2>
<p><a href="https://unionfs.filesystems.org/">Unionfs: A Stackable Unification File System</a></p>
<p><code>Unionfs</code> is a file system that allows you to stack several directories, called branches, in such a way that it appears as if the content is merged. It works on top of other file systems and came into existence because containers need a more efficient way to share physical memory segments than conventional file systems.</p>
<p><a href="https://medium.com/@knoldus/unionfs-a-file-system-of-a-container-2136cd11a779">UnionFS : A File System of a Container</a></p>
<p><img src="https://miro.medium.com/max/462/0*BhhgkPFuHnQhOcy0.jpg" alt="https://miro.medium.com/max/462/0*BhhgkPFuHnQhOcy0.jpg" loading="lazy"></p>
<p>Though the content appears merged, it is kept physically separate. <code>Unionfs</code> allows you to add and remove branches as you build out your file system.</p>
<h2 id="base-image-and-parent-image">Base image and parent image</h2>
<p><a href="https://docs.docker.com/develop/develop-images/baseimages/">Create a base image</a></p>
<ul>
<li><strong>Base image:</strong> an image that uses the Docker <code>scratch</code> image (empty container that doesn’t create a file system layer). This type of image assumes the app can directly use the host OS kernel.
<ul>
<li>Allow us more control over the contents of the final image.</li>
</ul>
</li>
<li><strong>Parent image:</strong> an image that your image is based on.
<ul>
<li>Most dockerfiles start from a parent image since they are already based on an OS and other components installed we would need.</li>
</ul>
</li>
</ul>
<h2 id="what-is-a-dockerfile">What is a Dockerfile?</h2>
<p>A Dockerfile is a text file that contains the instructions we use to build and run a Docker image. It defines:</p>
<ul>
<li>The base or parent image we use to create the new image.</li>
<li>Commands to update the base OS and install additional software.</li>
<li>Build artifacts to include (developed application, etc.).</li>
<li>Services to expose (storage, network configuration, etc.).</li>
<li>Command to run when the container is launched.</li>
</ul>
<pre><code class="language-bash"># Step 1: Specify the parent image for the new image
FROM ubuntu:18.04

# Step 2: Update OS packages and install additional software
RUN apt -y update &amp;&amp;  apt install -y wget nginx software-properties-common apt-transport-https \
	&amp;&amp; wget -q https://packages.microsoft.com/config/ubuntu/18.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb \
	&amp;&amp; dpkg -i packages-microsoft-prod.deb \
	&amp;&amp; add-apt-repository universe \
	&amp;&amp; apt -y update \
	&amp;&amp; apt install -y dotnet-sdk-3.0

# Step 3: Configure Nginx environment
CMD service nginx start

# Step 4: Configure Nginx environment
COPY ./default /etc/nginx/sites-available/default

# STEP 5: Configure work directory
WORKDIR /app

# STEP 6: Copy website code to container
COPY ./website/. .

# STEP 7: Configure network requirements
EXPOSE 80:8080

# STEP 8: Define the entry point of the process that runs in the container
ENTRYPOINT ["dotnet", "website.dll"]
</code></pre>
<p>Each of these steps creates a cached container image as we build the final container image. These cached container images are layered on top of the previous and presented as a single image once all steps are complete (thanks to <code>unionfs</code>)</p>
<p>The <code>ENTRYPOINT</code> command indicates which process will execute once we run a container from an image.</p>
<h2 id="how-to-manage-docker-images">How to manage Docker images</h2>
<p>The Docker CLI allows us to manage images by building, listing, removing, and running them. The CLI sends all queries to the <code>docerkd</code> daemon.</p>
<ul>
<li>We use <code>docker build</code> to build Docker images.</li>
<li>An image tag is a text string that is used to version an image. We can tag an image by using the <code>-t</code> command flag when building. If not specified, the image is labeled with the <code>latest</code> tag.</li>
<li><code>docker images</code> is used to view images on a local docker registry.</li>
<li><code>docker rmi</code> is used to remove an image from the local docker registry.
<ul>
<li>You can’t remove an image if it is still in use.</li>
</ul>
</li>
</ul>
<h1 id="how-docker-containers-work">How Docker containers work</h1>
<h2 id="how-to-manage-docker-containers">How to manage Docker containers</h2>
<p>A docker container has a lifecycle that you can manage and track the state of the container.</p>
<p><img src="https://docs.microsoft.com/learn/modules/intro-to-docker-containers/media/4-docker-container-lifecycle.svg" alt="https://docs.microsoft.com/learn/modules/intro-to-docker-containers/media/4-docker-container-lifecycle.svg" loading="lazy"></p>
<ul>
<li>Use the <code>run</code> command to place a container in run state
<ul>
<li>A container is considered in a running state until it’s paused, stopped, or killed.</li>
<li>A container can self-exit when the running process completes, or if the process goes into a fault state.</li>
</ul>
</li>
<li>Use the <code>restart</code> command to restart a container
<ul>
<li>When restarting a container, it receives a termination signal to enable any running processes to shut down gracefully before the container’s kernel is terminated.</li>
</ul>
</li>
<li>Use the <code>pause</code> command to a pause a running container.
<ul>
<li>This process suspends all processes in the container.</li>
</ul>
</li>
<li>Use the <code>stop</code> command to stop a running container.
<ul>
<li>This command enables the working process to shut down gracefully be sending it a termination signal. The container’s kernel terminated the working process in the container.</li>
</ul>
</li>
<li>Use the <code>kill</code> command to send a kill signal to the container if you need to terminate it.
<ul>
<li>The running process doesn’t capture the kill signal, only the container’s kernel.</li>
<li>This command will forcefully terminate the working process in the container.</li>
</ul>
</li>
<li>Use the <code>remove</code> command to remove a container that are in a stopped state. all data stored in the container gets destroyed.</li>
</ul>
<h2 id="how-to-view-available-containers">How to view available containers</h2>
<ul>
<li>use the <code>docker ps</code> command to list running containers.
<ul>
<li>Pass the <code>-a</code> argument to see all containers in all states.</li>
</ul>
</li>
</ul>
<h2 id="why-are-containers-given-a-name">Why are containers given a name?</h2>
<p>Use the <code>--name</code> flag to give a container an explicit name. Names are unique and enable us to run multiple container instances of the same image.</p>
<h1 id="docker-container-storage-configuration">Docker container storage configuration</h1>
<p>Always consider containers as temporary when thinking about storing data.</p>
<ul>
<li>Container storage is temporary</li>
<li>Container storage is coupled to the underlying host machine</li>
<li>Container storage divers are less performant</li>
</ul>
<p>Containers can make use of volumes and bind mounts to persist data.</p>
<h2 id="what-is-a-volume">What is a volume?</h2>
<ul>
<li>A volume is store on the host filesystem at a specific folder location and is considered the preferred data storage strategy to use with containers.
<ul>
<li>Choose a folder that isn’t going to be modified by non-Docker processes.
<ul>
<li>Create and manage the volume with the <code>docker volume create</code> command.</li>
<li>You can create volumes as part of the container creation process (dockerfile).</li>
<li>Docker will create the volume is if doesn’t exist when you try to mount the volume into a container the first time.</li>
<li>After mounted, these volumes are isolated from the host machine.</li>
<li>Multiple containers can simultaneously use the same volumes.</li>
<li>Volumes don’t get removed when a container stops using it.</li>
</ul>
</li>
</ul>
</li>
</ul>
<h2 id="what-is-a-bind-mound">What is a bind mound?</h2>
<ul>
<li>Conceptually the same as a volume except you can mount any file or folder on the host. You’re also expecting the host can change the contents of these mounts.</li>
<li>They have limited functionality compared to volumes.</li>
<li>More performant.</li>
<li>Depend on the host having a specific folder structure in place.</li>
</ul>
<h1 id="docker-container-network-configuration">Docker container network configuration</h1>
<p>Network configuration enables us to build and configure apps that can communicate securely with each other.</p>
<h2 id="what-is-the-bridge-network">What is the bridge network?</h2>
<p>The bridge network is the default configuration applied to containers when launched without specifying any additional network configuration.</p>
<ul>
<li>It’s internal, private, and isolated the container network from the Docker host network.</li>
<li>Each container in the bridge network is assigned an IP address and subnet mask with the hostname defaulting to the container name.</li>
<li>Containers connected to the default bridge network are allowed to access other bridge connected containers by IP address and not by hostnames.</li>
<li>To enable port mapping between the container ports and the docker host ports, use the Docker port <code>--publish</code> flag.  This effectively configures a firewall rule that maps the ports.</li>
<li>the&nbsp;<em>Docker0</em>&nbsp;network interface isn't available on macOS when using the bridge network</li>
</ul>
<h2 id="host-network">Host network</h2>
<p>The host network enables you to run the container on the host network directly. This effectively removes the isolation between the host and the container at a network level.</p>
<p>The container can use only ports not already used by the host.</p>
<p>host network configuration isn't supported for both Windows and macOS desktops.</p>
<h2 id="none-network">None network</h2>
<p>To disabled networking for containers, use the none network option.</p>
<h1 id="when-to-use-docker-containers">When to use Docker containers</h1>
<ul>
<li>Efficient use of hardware.
<ul>
<li>By removing the VM and the additional OS requirement, we can free resources on the host and use it for running other containers.</li>
</ul>
</li>
<li>Container isolation.
<ul>
<li>Docker containers provide security features to run multiple containers simultaneously on the same host without affecting each other</li>
</ul>
</li>
<li>Application portability
<ul>
<li>With Docker, the container becomes the unit we use to distribute applications. This concept ensures that we have a standardized container format.</li>
</ul>
</li>
<li>Management of hosting environments
<ul>
<li>We configure our application's environment internally to the container. This containment provides flexibility for our operations team to manage the application's environment much closer.</li>
</ul>
</li>
<li>Cloud deployments
<ul>
<li>Docker containers are the default container architecture used in the Azure containerization services and are supported on many other cloud platforms.</li>
</ul>
</li>
</ul>
<h1 id="when-not-to-use-docker-containers">When not to use Docker containers?</h1>
<ul>
<li>Security and virtualization
<ul>
<li>Containers share a single host OS kernel, which can be a single point of attack.</li>
</ul>
</li>
<li>Service monitoring
<ul>
<li>Managing the applications and containers are more complicated than traditional VM deployments. Logging features exist that tell us about the state of the running containers. However, more detailed information about services inside the container is harder to monitor.</li>
</ul>
</li>
</ul>
