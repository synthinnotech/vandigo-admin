FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM alpine:3.19
COPY --from=build /app/build /build
CMD ["sh", "-c", "rm -rf /output/* && cp -r /build/* /output/ && echo 'Admin panel build copied to /output'"]
