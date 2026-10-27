FROM python:3.12-slim-bookworm
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 HOST=0.0.0.0 PORT=8790 CIVIC_STATE_DIR=/var/lib/mobywatel CIVIC_PUBLIC_CACHE=/var/lib/mobywatel/public-cache
RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils tesseract-ocr tesseract-ocr-pol tesseract-ocr-eng imagemagick ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY serwer/ serwer/
COPY mockup/ mockup/
RUN useradd --create-home --uid 10001 mobywatel && mkdir -p /var/lib/mobywatel && chown -R mobywatel /app /var/lib/mobywatel
USER mobywatel
EXPOSE 8790
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD python3 -c "import os,urllib.request;urllib.request.urlopen('http://127.0.0.1:%s/api/health' % os.environ.get('PORT','8790'),timeout=4)"
CMD ["python3", "serwer/server.py"]
