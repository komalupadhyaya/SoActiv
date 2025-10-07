# be/Dockerfile
FROM oven/bun

WORKDIR /app

COPY package* .

RUN bun install

COPY . .

EXPOSE 8000

CMD ["bun", "run", "dev"]


