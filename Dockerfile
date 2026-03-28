# Use a lightweight Python image
FROM python:3.11-slim

# Set the working directory to root
WORKDIR /app

# Copy the backend requirements to the root for the builder to see
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

# Change working directory to backend so Python can find 'app'
WORKDIR /app/backend

# Expose port (Railway will use its own PORT env var)
EXPOSE 8000

# Start the server
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
