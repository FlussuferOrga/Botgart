# ---- Base Node ----
FROM node:alpine AS base

# set working directory
WORKDIR /app


# ---- Dependencies ----
FROM base AS dependencies
ENV NO_UPDATE_NOTIFIER=true

RUN apk add --no-cache make gcc g++ python

# install node packages
RUN npm config set update-notifier false && npm set progress=true && npm config set depth 0

COPY package*.json ./
RUN npm install --only=production


# ---- Build ----
FROM base AS build
ENV NO_UPDATE_NOTIFIER=true
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

ENV HTTP_PORT=3000
EXPOSE 3000

VOLUME /app/log
VOLUME /app/db
#VOLUME /app/conf #need some work to move the config file into a seperate folder

HEALTHCHECK --interval=1m --timeout=20s --start-period=30s \
   CMD curl -f --max-time 15s "http://127.0.0.1:${HTTP_PORT}/health" || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node","/app/built/index.js"]
