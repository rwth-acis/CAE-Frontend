FROM node:14-alpine
USER root

ENV PORT 8070
ENV REQBAZ_BACKEND https://requirements-bazaar.org/bazaar
ENV REQBAZ_FRONTEND https://requirements-bazaar.org
ENV YJS_RESOURCE_PATH /socket.io

RUN apk update

RUN apk add supervisor openssh git nginx jq python2 openrc && \
    npm_config_user=root npm install -g grunt-cli grunt polymer-cli

RUN mkdir -p /run/nginx

WORKDIR /usr/src/app
COPY . .

COPY docker/supervisorConfigs /etc/supervisor.d

WORKDIR /usr/src/app/cae-app
RUN npm install

WORKDIR /usr/src/app/widgets
RUN npm install

WORKDIR /usr/src/app/syncmeta
RUN npm install
RUN cp -a node_modules/@rwth-acis/syncmeta-widgets/. widgets/ && \
    cp -a node_modules/. widgets/node_modules/ && \
    rm -r node_modules
WORKDIR /usr/src/app/syncmeta/widgets
RUN npm install

WORKDIR /usr/src/app
RUN git clone -b v1.0.1 https://github.com/rwth-acis/CAE-WireframingEditor.git

WORKDIR /usr/src/app/CAE-WireframingEditor
RUN npm install

WORKDIR /usr/src/app
COPY docker/docker-entrypoint.sh docker-entrypoint.sh
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
