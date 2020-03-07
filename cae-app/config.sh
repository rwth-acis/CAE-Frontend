#!/bin/bash

ENV_VARIABLE_NOT_SET=false
check_if_exists () {
    if [[ -z "$1" ]]; then
        echo "$2 env variable is not set"
        ENV_VARIABLE_NOT_SET=true
    fi
}

check_if_exists "$WEBHOST" "WEBHOST"
check_if_exists "$OIDC_CLIENT_ID" "OIDC_CLIENT_ID"

sed -i "s={WEBHOST}=$WEBHOST=g" src/frontend-modeling.js
sed -i "s={WEBHOST}=$WEBHOST=g" src/microservice-modeling.js
sed -i "s={WEBHOST}=$WEBHOST=g" src/application-modeling.js
sed -i "s={OIDC_CLIENT_ID}=$OIDC_CLIENT_ID=g" src/cae-static-app.js
sed -i "s={YJS_ADDRESS}=$YJS=g" src/metamodel-uploader.js
