FROM node:8
USER root

ENV PORT 8070
ENV REQBAZ_BACKEND https://requirements-bazaar.org/bazaar
ENV REQBAZ_FRONTEND https://requirements-bazaar.org

WORKDIR /usr/src/app
COPY . .

RUN apt-get update

RUN apt-get install -y --no-install-recommends supervisor git nginx
RUN npm_config_user=root npm install -g bower grunt-cli grunt

COPY docker/supervisorConfigs /etc/supervisor/conf.d

WORKDIR /usr/src/app/widgets
RUN npm install && bower install --allow-root

WORKDIR /usr/src/app
RUN git clone https://github.com/rwth-acis/syncmeta.git

WORKDIR /usr/src/app/syncmeta
RUN npm install && bower install --allow-root

WORKDIR /usr/src/app
RUN git clone https://github.com/rwth-acis/CAE-WireframingEditor.git

# It is not working when it is built again 
# therefore built version is used 
WORKDIR /usr/src/app/CAE-WireframingEditor
RUN git checkout gh-pages

WORKDIR /usr/src/app
COPY docker/docker-entrypoint.sh docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
