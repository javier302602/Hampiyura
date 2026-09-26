# API de HampiYura en Docker. Imagen de PRODUCCIÓN: compila TypeScript y arranca con `node dist/main.js`.
# Se conservan las dependencias de desarrollo a propósito: el seed (`prisma/seed.ts`) y los scripts de datos corren con tsx en cada arranque.
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
# scripts/ = carga de las 27 plantas, fichas, sellos y conservación (rondas 28 a 31): corren con tsx en cada arranque (idempotentes).
COPY scripts ./scripts
COPY docker-entrypoint.sh ./
# uploads = fotos/PDF subidos (volumen); state = secreto JWT autogenerado (volumen). Ambos con dueño "node".
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh \
    && mkdir -p uploads state && chown -R node:node /app
USER node
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=10 \
    CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/plantas').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["./docker-entrypoint.sh"]
