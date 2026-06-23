FROM node:24-alpine AS build-stage

WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build

FROM node:24-alpine AS production

WORKDIR /app

COPY --from=build-stage /app/build /app/build
COPY --from=build-stage /app/node_modules /app/node_modules


