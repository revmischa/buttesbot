FROM node:14-bullseye-slim
RUN apt update
RUN apt install -y tcl-dev python3
RUN npm install npm@latest -g

WORKDIR /asset/nodejs/node_modules
RUN HOME=/tmp npm install --no-save tcl
