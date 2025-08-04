FROM python:3.12-slim

# Set environment variables to prevent Python from writing .pyc files and to buffer output
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install FFmpeg, curl, and other build essentials
# curl might be useful for healthchecks or other operations within the container
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    build-essential \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Set the working directory in the container
WORKDIR /app

# Copy only the dependency definition files first to leverage Docker cache
COPY pyproject.toml poetry.lock* ./

# Install project dependencies using Poetry
# --no-dev: Do not install development dependencies
# --no-root: Do not install the project itself as editable (it will be copied next)
# Poetry will detect it's running in a Docker container and install into the system Python environment
RUN poetry install --no-root

# Copy the rest of the application code into the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application using Uvicorn, managed by Poetry
# Uvicorn is run with --host 0.0.0.0 to be accessible from outside the container
CMD ["poetry", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
