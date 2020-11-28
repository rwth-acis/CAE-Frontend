FROM node:8
USER root

ENV PORT 8070
ENV REQBAZ_BACKEND https://requirements-bazaar.org/bazaar
ENV REQBAZ_FRONTEND https://requirements-bazaar.org
ENV YJS_RESOURCE_PATH /socket.io

WORKDIR /usr/src/app
COPY . .

RUN apt-get update

RUN apt-get install -y --no-install-recommends supervisor git nginx
RUN npm_config_user=root npm install -g grunt-cli grunt polymer-cli

COPY docker/supervisorConfigs /etc/supervisor/conf.d

WORKDIR /usr/src/app/cae-app
RUN npm install

WORKDIR /usr/src/app/widgets
RUN npm install

WORKDIR /usr/src/app/syncmeta
RUN npm install
RUN cp -a node_modules/@rwth-acis/syncmeta-widgets/. widgets/
RUN cp -a node_modules/. widgets/node_modules/
WORKDIR /usr/src/app/syncmeta/widgets
RUN npm install

WORKDIR /usr/src/app
RUN git clone https://github.com/rwth-acis/CAE-WireframingEditor.git

WORKDIR /usr/src/app/CAE-WireframingEditor
RUN git checkout master && npm install

WORKDIR /usr/src/app
COPY docker/docker-entrypoint.sh docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
