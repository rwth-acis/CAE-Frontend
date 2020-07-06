#!/bin/bash

ENV_VARIABLE_NOT_SET=false
check_if_exists () {
    if [[ -z "$1" ]]; then
        echo "$2 env variable is not set"
        ENV_VARIABLE_NOT_SET=true
    fi
}

check_if_exists "$WEBHOST" "WEBHOST"
check_if_exists "$CAE_BACKEND_URL" "CAE_BACKEND_URL"
check_if_exists "$OIDC_CLIENT_ID" "OIDC_CLIENT_ID"
check_if_exists "$YJS" "YJS"
check_if_exists "$YJS_RESOURCE_PATH" "YJS_RESOURCE_PATH"
check_if_exists "$DEPLOYMENT_URL" "DEPLOYMENT_URL"

sed -i "s={WEBHOST}=$WEBHOST=g" src/static.js
sed -i "s={CAE_BACKEND_URL}=$CAE_BACKEND_URL=g" src/static.js
sed -i "s={OIDC_CLIENT_ID}=$OIDC_CLIENT_ID=g" src/cae-static-app.js
sed -i "s={YJS_ADDRESS}=$YJS=g" src/static.js
sed -i "s={YJS_RESOURCE_PATH}=$YJS_RESOURCE_PATH=g" src/static.js
sed -i "s={DEPLOYMENT_URL}=$DEPLOYMENT_URL=g" src/static.js
