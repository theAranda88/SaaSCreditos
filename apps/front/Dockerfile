FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/front/package.json ./apps/front/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN npm ci --ignore-scripts
COPY packages ./packages
COPY apps/front ./apps/front
RUN npm run build --workspace=@creditos/shared-types
RUN npm run build --workspace=@creditos/front

FROM nginx:1.27-alpine
COPY apps/front/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/front/dist/front/browser /usr/share/nginx/html
EXPOSE 80
