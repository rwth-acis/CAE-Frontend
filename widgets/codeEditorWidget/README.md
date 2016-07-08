# A Live collaborative Code Editor for the Community Application Editor

## Build steps
1. Please make sure to have *npm*, *bower* and *grunt* already installed
    * Use your favorite package manager or grab *npm* from [here][2]
    * Use *npm* to install *bower*: ```npm install -g bower```
    * Use *npm* to first install grunt-cli and then grunt itself: ```npm install -g grunt-cli grunt```
2. Install dependencies: ```bower install```
3. Install development dependencies: ```npm install```
4. Copy *src/lib/config.js.sample* and name it *src/lib/config.js*
5. Change the urls in *src/lib/config.js* to the actual used urls
6. Run ```grunt``` to build the library for the code editor and live preview widget.
