# Deployment Guide

## Quick Start with Docker Compose

The simplest way to deploy emage:

```bash
docker-compose up -d
```

Access the application at: `http://localhost:4001`

## Docker Deployment Options

### Option 1: Docker Compose (Recommended)

**Start the application:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f
```

**Stop the application:**
```bash
docker-compose down
```

**Rebuild after changes:**
```bash
docker-compose up -d --build
```

### Option 2: Docker CLI

**Build the image:**
```bash
docker build -t emage:latest .
```

**Run the container:**
```bash
docker run -d \
  --name emage-app \
  -p 4001:80 \
  --restart unless-stopped \
  emage:latest
```

**View logs:**
```bash
docker logs -f emage-app
```

**Stop and remove:**
```bash
docker stop emage-app
docker rm emage-app
```

## Port Configuration

By default, the application runs on port 4001. To use a different port:

**Docker Compose:**
Edit `docker-compose.yml` and change the ports mapping:
```yaml
ports:
  - "8080:80"  # Change 8080 to your desired port
```

**Docker CLI:**
```bash
docker run -d -p 8080:80 --name emage-app emage:latest
```

## Production Deployment

### Behind a Reverse Proxy

If deploying behind nginx, Apache, or Traefik:

**Nginx example:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Docker Compose with custom port:**
```yaml
services:
  emage:
    build: .
    ports:
      - "127.0.0.1:4001:80"  # Only accessible locally
```

### With SSL/HTTPS

Use a reverse proxy like nginx or Traefik with Let's Encrypt for SSL.

**Example with Traefik labels in docker-compose.yml:**
```yaml
services:
  emage:
    build: .
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.emage.rule=Host(`emage.yourdomain.com`)"
      - "traefik.http.routers.emage.entrypoints=websecure"
      - "traefik.http.routers.emage.tls.certresolver=letsencrypt"
```

## Resource Requirements

**Minimum:**
- 512MB RAM
- 1 CPU core
- 100MB disk space

**Recommended:**
- 1GB RAM
- 2 CPU cores
- 200MB disk space

## Health Check

The container includes a health check that runs every 30 seconds:

**Check container health:**
```bash
docker ps
```

Look for the `STATUS` column showing `healthy`.

**View health check logs:**
```bash
docker inspect emage-app | grep -A 10 Health
```

## Environment Variables

The application doesn't require any environment variables as it runs entirely client-side.

## Updating

**Pull latest code and rebuild:**
```bash
git pull
docker-compose down
docker-compose up -d --build
```

**Or with Docker CLI:**
```bash
git pull
docker stop emage-app
docker rm emage-app
docker build -t emage:latest .
docker run -d -p 4001:80 --name emage-app emage:latest
```

## Troubleshooting

**Container won't start:**
```bash
docker logs emage-app
```

**Port already in use:**
```bash
  # Check what's using port 4001
  lsof -i :4001
  
  # Use a different port
  docker run -d -p 4002:80 --name emage-app emage:latest
```

**Build fails:**
```bash
# Clean build
docker-compose build --no-cache
```

**Container is unhealthy:**
```bash
# Check nginx logs
docker exec emage-app cat /var/log/nginx/error.log
```

## Backup

Since the application is stateless and runs client-side, no backup is needed. Just keep your source code in version control.

## Monitoring

**Container stats:**
```bash
docker stats emage-app
```

**Nginx access logs:**
```bash
docker exec emage-app tail -f /var/log/nginx/access.log
```

## Security Best Practices

1. Always run behind a reverse proxy with SSL in production
2. Keep Docker and the base images updated
3. Use specific version tags instead of `latest` in production
4. Limit container resources:
   ```bash
   docker run -d \
      --memory="512m" \
      --cpus="1" \
      -p 4001:80 \
      emage:latest
   ```

## Cloud Deployment

The Docker container can be deployed to:
- **AWS**: ECS, Fargate, or EC2
- **Google Cloud**: Cloud Run, GKE, or Compute Engine
- **Azure**: Container Instances or AKS
- **DigitalOcean**: App Platform or Droplets
- **Heroku**: Container Registry
- **Fly.io**: Dockerfile-based deployment

Refer to your cloud provider's documentation for container deployment.
