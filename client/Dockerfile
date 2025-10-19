FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

RUN npx ng build --configuration production-spa

RUN ! grep -R -nE "http://(localhost|127\.0\.0\.1):4000" dist/client/browser || (echo "ERROR: Found localhost:4000 in built bundle" && exit 1)

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/client/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
