# CAE-Frontend

[![Docker image][docker-build-image]][docker-repo]

This repository contains frontend application of CAE and CAE specific widgets which will accompany to Syncmeta widgets.

# Usage

First build the image:
```
$ cd CAE-Frontend
$ docker build -t rwthacis/cae-frontend .
```

Then you can run the image like this:
```
# Application will run on port 8070 locally in Docker container however host port mapping can be changed.
# Pass necessary environment variables which is specified in the following section with '-e' flag during initialization.
docker run -e <env1>=<val1> -e <env2>=<val2> -p 8070:8070 rwthacis/cae-frontend
```

After container started to run, application can be accessed via `http://127.0.0.1:8070`

CAE Frontend is using [YJS][yjs-github] for interwidget communication, therefore it needs [y-websocket-server][y-websocket-server] instance. 
It can be started with following command:
```
docker run -p 1234:1234  -d rwthacis/y-websockets-server
```
Then, address of y-websockets-server instance need to be passed to CAE-Frontend Docker container during initialization with `YJS` environment variable. If websocket server is started with previous command, its address will be `127.0.0.1:1234` and this value need to be passed to CAE Frontend Docker container during initialization.

Other components of the CAE such as backend services(Model Persistence Service, Code Generation Service) and Jenkins also need to be available in order to have full fledged CAE. You can follow instructions on [main CAE repo][main-cae-repo] in order to make all parts available.

Following environment variables are needed to be passed to container during initialization:

* `WEBHOST`: Url address of CAE Frontend application
* `YJS`: Root url address of Yjs websocket server. If it is running behind reverse proxy, relative path need to be provided with the `yjs_resource_path` env variable.
* `CODEGEN`: Url address of Code Generation Service
* `CAE_BACKEND_URL`: Url address of CAE backend
* `CODE_EDITOR_BOWER`: Url address of Bower components for Live Code Editor widget
* `OIDC_CLIENT_ID`: OIDC client id which is used in CAE Frontend for authentication purpose. Client id can be acquired from Learning Layers after client registration

Following environment variables have default values however they can be changed during initialization:

* `PORT`: Port which Nginx server is listening locally. This port need to be made accessible to outside with port mapping during initialization. Default value is `8070`.
* `YJS_RESOURCE_PATH`: Resource path of Yjs websocker server. If websocket server running behind reverse proxy and `/yjs` path is redirected to websocket server, this env variable need to be `/yjs/socket.io`. Default value is `/socket.io`.
* `REQBAZ_BACKEND`: Backend url address of Requirements Bazaar website. Default value is `https://requirements-bazaar.org/bazaar`
* `REQBAZ_FRONTEND`: Url address of Requirements Bazaar website. Default value is `https://requirements-bazaar.org`


[docker-build-image]: https://img.shields.io/docker/cloud/build/rwthacis/cae-frontend
[docker-repo]: https://hub.docker.com/r/rwthacis/cae-frontend
[yjs-github]: https://github.com/yjs/yjs
[y-websocket-server]: https://github.com/y-js/y-websockets-server
[main-cae-repo]: https://github.com/rwth-acis/CAE
