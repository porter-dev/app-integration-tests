# Development environment
# -----------------------
FROM node:latest
WORKDIR /webpack

COPY package*.json ./

RUN npm install

ENV NODE_ENV=development
ARG SPONSOR

CMD node index.js