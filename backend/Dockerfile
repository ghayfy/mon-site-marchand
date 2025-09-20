FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 4000

CMD ["sh","-lc","node scripts/migrate.js; node app.js"]
