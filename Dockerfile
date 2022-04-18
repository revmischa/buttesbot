FROM node:16
RUN apt-get update && apt-get install -y \
	vim tcl-dev
RUN npm install npm@latest -g
RUN adduser app --home /code

USER app
WORKDIR /code
COPY package.json /code/
RUN npm install
