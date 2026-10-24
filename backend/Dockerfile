FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY routers ./routers
COPY model ./model
COPY source ./source
COPY utility ./utility
COPY information ./information
COPY assets ./assets
RUN useradd --create-home --uid 10001 appuser
USER appuser
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port \"${PORT}\" --workers 1 --proxy-headers --forwarded-allow-ips='*'"]
