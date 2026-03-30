# Use a lightweight Python image
FROM python:3.11-slim

# Set the working directory to app
WORKDIR /app

# Copy the requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY . .

# Expose port (Railway will use its own PORT env var)
EXPOSE 8000

# Start the server (handles dynamic PORT)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000"]
