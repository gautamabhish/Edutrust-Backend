FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY . . 
 ### If there wa no postinsall i could have copied after as node_modules have cached 
RUN npm install 

RUN npm run build


### Production Stage
FROM node:20-alpine AS prod

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN npm i --only=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["node", "dist/server.js"]

