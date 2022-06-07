FROM node:16-alpine

RUN apk add --no-cache msttcorefonts-installer fontconfig imagemagick
RUN update-ms-fonts

WORKDIR /app
COPY . .
RUN yarn install --production

VOLUME [ "/app/static" ]

EXPOSE 3000
CMD [ "node", "index.js" ]