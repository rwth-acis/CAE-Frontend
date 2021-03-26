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
check_if_exists "$GIT_ORGANIZATION" "GIT_ORGANIZATION"
check_if_exists "$GITHUB_OAUTH_CLIENTID" "GITHUB_OAUTH_CLIENTID"

if [ "$ENV_VARIABLE_NOT_SET" = true ] ; then
    echo "Missing environment variables, exiting..."
    exit 1
fi

# modify values in src/static.js
sed -i "s={WEBHOST}=$WEBHOST=g" src/static.js
sed -i "s={CAE_BACKEND_URL}=$CAE_BACKEND_URL=g" src/static.js
sed -i "s={YJS_ADDRESS}=$YJS=g" src/static.js
sed -i "s={YJS_RESOURCE_PATH}=$YJS_RESOURCE_PATH=g" src/static.js
sed -i "s={DEPLOYMENT_URL}=$DEPLOYMENT_URL=g" src/static.js
sed -i "s={GIT_ORGANIZATION}=$GIT_ORGANIZATION=g" src/static.js
sed -i "s={REQBAZ_BACKEND}=$REQBAZ_BACKEND=g" src/static.js
sed -i "s={REQBAZ_FRONTEND}=$REQBAZ_FRONTEND=g" src/static.js
sed -i "s={GITHUB_OAUTH_CLIENTID}=$GITHUB_OAUTH_CLIENTID=g" src/static.js
sed -i "s={PROJECT_SERVICE_URL}=$PROJECT_SERVICE_URL=g" src/static.js 
sed -i "s={CONTACT_SERVICE_URL}=$CONTACT_SERVICE_URL=g" src/static.js

# modify values in src/cae-static-app.js
sed -i "s={OIDC_CLIENT_ID}=$OIDC_CLIENT_ID=g" src/cae-static-app.js
# read current version from package.json
VERSION=$(jq -r .version package.json)
# put current version as subtitle into frontend statusbar
sed -i "s={STATUSBAR_SUBTITLE}=v$VERSION=g" src/cae-static-app.js
