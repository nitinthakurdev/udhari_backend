# ========================
#   build stage 
# ========================

FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY . .

RUN npm run build;

# ======================
# production build
# ======================

FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY errorMessages.json ./
COPY successMessages.json ./
COPY validationMessage.json ./

RUN npm ci --omit=dev

COPY .sequelizerc ./
COPY sequelize ./sequelize
COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/index.js"]

