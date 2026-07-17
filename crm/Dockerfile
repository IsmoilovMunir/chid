# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_PUBLIC_SITE_URL=https://chid.ru
ARG VITE_CHID_PHONE=+7 (000) 000-00-00
ARG VITE_CHID_PHONE_HREF=+70000000000
ARG VITE_CHID_EMAIL=info@chid.ru
ENV VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL \
    VITE_CHID_PHONE=$VITE_CHID_PHONE \
    VITE_CHID_PHONE_HREF=$VITE_CHID_PHONE_HREF \
    VITE_CHID_EMAIL=$VITE_CHID_EMAIL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
