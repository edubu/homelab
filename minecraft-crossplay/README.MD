# Minecraft Crossplay

## Description

This container will start a Minecraft Java Server with a GeyserMC Proxy. Therefore, both Bedrock and Java clients can connect and play together.
Connect to this server from anything. Phone, Xbox, PC, Nintendo Switch

## Prerequisites

### Port Forwarding

To allow devices outside of your network to connect, you will have to forward the following ports:TODO

## Steps to run

1. Dependencies
   Make sure that docker is installed
2. Clone github repository
3. Create data folder to store game files locally(other than within the container)

```bash
    mkdir data
```

4. Run docker container

```bash
docker compose up --build -d
```

5. Verify it is running correctly

```bash
docker compose logs -f
```

6. Have fun
