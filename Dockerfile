#building dist.
FROM node:20-alpine

WORKDIR /tmp

RUN mkdir -p /tmp/build/app

COPY ./package.json /tmp/build/app/

WORKDIR /tmp/build/app/

RUN npm install --legacy-peer-deps

COPY ./ /tmp/build/app/

RUN npm run build

FROM nginx:stable-alpine AS webapp-dynamic

RUN apk update
RUN apk add jq

WORKDIR /usr/app

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./docker/25-env-replace.sh /docker-entrypoint.d/

RUN chmod +x  /docker-entrypoint.d/25-env-replace.sh
#copy frontend (angular) static files
COPY --from=0 /tmp/build/app/dist/app/browser /opt/frontend/datacatalog-ui/

EXPOSE 80


CMD ["nginx", "-g", "daemon off;"]
