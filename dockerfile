FROM node:alpine
WORKDIR /app

COPY package*.json ./

# Install latest chromium for Puppeteer
RUN apk update && apk add --no-cache nmap && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk update && apk add --no-cache chromium harfbuzz "freetype>2.8" ttf-freefont nss

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN npm install --only=production && npm cache clean --force
COPY . .
# RUN npm run test

CMD ["node", "app.js"]
