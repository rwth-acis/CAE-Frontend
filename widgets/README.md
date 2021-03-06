# The CAE frontend consisting of additional widgets, including a live collaborative code editor

## Build steps
1. Please make sure to have *npm*, *bower* and *grunt* already installed
    * Use your favorite package manager to install *npm*
    * Use *npm* to install *bower*: ```npm install -g bower```
    * Use *npm* to first install grunt-cli and then grunt itself: ```npm install -g grunt-cli grunt```
2. Install dependencies: ```bower install```
3. Install development dependencies: ```npm install```
4. Copy *src/liveCodeEditorWidget/lib/config.js.sample* and name it *src/liveCodeEditorWidget/lib/config.js*
5. Change the urls in *src/lib/config.js* to the actual used urls
6. Run ```grunt --host=yourhostprefix --yjsserver=urlToYjs --caehost=urlToCAEService --reqbazbackend=urlToRequirementsBazaarApi --reqbazfrontend=urlToRequirementsBazaarFrontend``` to build the libray for the code editor / live preview and to configure all widgets for your deployment. If no parameter is given host defaults to "http://localhost:8001" and caehost to "http://localhost:8080". The yjs server parameter defaults to 'wss://yjs.dbis.rwth-aachen.de:5082', please make sure it is set to the same url as in your syncmeta config.
7. Use ```grunt connect```to start a development web server on port 8001, serving the widgets from the dist directory.
