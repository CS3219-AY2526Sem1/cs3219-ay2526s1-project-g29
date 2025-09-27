FROM python:3.12-alpine
WORKDIR /app

# Tools for healthcheck
RUN apk add --no-cache curl

# Tiny Flask app with / and /health
RUN pip install --no-cache-dir flask
RUN printf '%s\n' \
"from flask import Flask" \
"app = Flask(__name__)" \
"@app.get('/')" \
"def root(): return 'service OK'" \
"@app.get('/health')" \
"def health(): return 'ok'" \
"if __name__ == '__main__': app.run(host='0.0.0.0', port=8080)" \
> app.py

EXPOSE 8080
CMD [ "python", "app.py" ]