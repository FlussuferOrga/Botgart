# ---- Base Node ----
FROM node:alpine AS base

# set working directory
WORKDIR /app

# ---- Dependencies ----
FROM base AS dependencies

RUN apk add --no-cache make gcc g++ python
# install node packages
RUN npm install -g npm
RUN npm set progress=false && npm config set depth 0

COPY package*.json ./
RUN npm install -q

# ---- Build ----
FROM base AS build
# copy production node_modules
COPY --from=dependencies /app/node_modules /app/node_modules
COPY . .
RUN npm run build

# ---- final ----
FROM base AS final
RUN apk add --no-cache curl

COPY --from=dependencies /app/node_modules /app/node_modules
COPY --from=build /app/built /app/built

# --- Entrypoint ---
COPY docker-entrypoint.sh /usr/local/bin/

ENV HTTP_PORT 3000
EXPOSE 3000

VOLUME /app/log
VOLUME /app/db
#VOLUME /app/conf #need some work to move the config file into a seperate folder

HEALTHCHECK --interval=5m --timeout=2m --start-period=45s \
   CMD curl -f --retry 6 --max-time 5 --retry-delay 10 --retry-max-time 60 " http://localhost:${HTTP_PORT}/health" || bash -c 'kill -s 15 -1 && (sleep 10; kill -s 9 -1)'

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node","/app/built/index.js"]
