# be/Dockerfile
FROM oven/bun

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install

COPY . .

EXPOSE 8000

CMD ["bun", "run", "start"]


