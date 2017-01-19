module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		host: typeof grunt.option('host') === 'string' ? grunt.option('host') : 'http://localhost:8001',
		yjsserver: typeof grunt.option('yjsserver') === 'string' ? grunt.option('yjsserver') : 'wss://yjs.dbis.rwth-aachen.de:5082',
		caehost: typeof grunt.option('caehost') === 'string' ? grunt.option('caehost') : 'http://localhost:8080',
		browserify:{
			options:{
				transform: [
					["babelify",{presets: ["es2015"],global:true}]
				]
			},
      specs:{
				src : ['node_modules/regenerator/runtime.js','tests/tests.js'],
				dest : 'dist/liveCodeEditorWidget/specs.js',
        options:{
          alias : {
            'openapp' : "./tests/liveCodeEditorWidget/roleSpaceMockup.js"
          }
        }
      },
			CAECode:{
				src : ['node_modules/regenerator/runtime.js','src/liveCodeEditorWidget/main.js'],
				dest : 'dist/liveCodeEditorWidget/main.dev.js',
        options:{
          alias : {
            'openapp' : "./src/liveCodeEditorWidget/lib/openapp.js"
          }
        }
			},
      CAELivePreview:{
        src: ["src/liveCodeEditorWidget/livePreview.js"],
        dest : 'dist/liveCodeEditorWidget/livePreview.dev.js',
        options:{
          alias : {
            'openapp' : "./src/liveCodeEditorWidget/lib/openapp.js"
          }
        }
      }
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			dist: {
				files: {
					'dist/liveCodeEditorWidget/main.min.js' : ['dist/liveCodeEditorWidget/main.dev.js'],
					'dist/liveCodeEditorWidget/livePreview.min.js' : ['dist/liveCodeEditorWidget/livePreview.dev.js']
				}
			}
		},
		qunit:{
			all:{
				options:{
					urls:[
						'http://localhost:8001/tests/index.html'
					],
					webpageProperties: {
						viewportSize: {width: 2, height: 2}
					}
				}
			}
		},
		connect: {
			server: {
				options: {
					port: 8001,
					base: './dist',
					keepalive: true
        }
			}
		},
		replace: {
			widgetPaths: {
				options: {
					patterns: [
						{
							match: 'host',
							replace: '<%= host %>'
						},
						{
							match: 'yjsserver',
							replace: '<%= yjsserver %>'
						},
						{
							match: 'caehost',
							replace: '<%= caehost %>'
						}
					]
				},
				files: [
					//CAE widgets XML
					{src: "src/applicationPersistenceWidget/widget.xml", dest: "dist/applicationPersistenceWidget/widget.xml"},
					{src: "src/frontendComponentPersistenceWidget/widget.xml", dest: "dist/frontendComponentPersistenceWidget/widget.xml"},
					{src: "src/microservicePersistenceWidget/widget.xml", dest: "dist/microservicePersistenceWidget/widget.xml"},
					
					{src: "src/frontendComponentSelectWidget/widget.xml", dest: "dist/frontendComponentSelectWidget/widget.xml"},
					{src: "src/microserviceSelectWidget/widget.xml", dest: "dist/microserviceSelectWidget/widget.xml"},
					{src: "src/liveCodeEditorWidget/index.html", dest: "dist/liveCodeEditorWidget/index.html"},
					//CAE widgets JS
					{src: "src/microservicePersistenceWidget/js/applicationScript.js", dest: "dist/microservicePersistenceWidget/js/applicationScript.js"},
					{src: "src/frontendComponentPersistenceWidget/js/applicationScript.js", dest: "dist/frontendComponentPersistenceWidget/js/applicationScript.js"},
					{src: "src/applicationPersistenceWidget/js/applicationScript.js", dest: "dist/applicationPersistenceWidget/js/applicationScript.js"},
					
					{src: "src/frontendComponentSelectWidget/js/syncmeta-plugin.js", dest:"dist/frontendComponentSelectWidget/js/syncmeta-plugin.js"},
					{src: "src/frontendComponentSelectWidget/js/applicationScript.js", dest:"dist/frontendComponentSelectWidget/js/applicationScript.js"},
					{src: "src/microserviceSelectWidget/js/syncmeta-plugin.js", dest:"dist/microserviceSelectWidget/js/syncmeta-plugin.js"},
					{src: "src/microserviceSelectWidget/js/applicationScript.js", dest:"dist/microserviceSelectWidget/js/applicationScript.js"},
					// Code Editor
					{src: "src/liveCodeEditorWidget/widget.xml", dest: "dist/liveCodeEditorWidget/widget.xml"},
					{src: "src/liveCodeEditorWidget/MicroserviceEditorWidget.xml", dest: "dist/liveCodeEditorWidget/MicroserviceEditorWidget.xml"},
					{src: "src/liveCodeEditorWidget/livePreviewWidget.xml", dest: "dist/liveCodeEditorWidget/livePreviewWidget.xml"},
					{src: "src/liveCodeEditorWidget/FrontendEditorWidget.xml", dest: "dist/liveCodeEditorWidget/FrontendEditorWidget.xml"}
				]
			}
		},
		copy: {
			applicationPersistenceWidget: {
				files: [
					//CSS
					{expand: true, cwd: "src/applicationPersistenceWidget", src:"css/*", dest: "dist/applicationPersistenceWidget/"},
					//Static JS
					//{expand: true, cwd: "src/applicationPersistenceWidget", src:"js/*", dest:"dist/applicationPersistenceWidget/"}
					{expand: true, flatten: true, filter: 'isFile', src: "src/applicationPersistenceWidget/js/las2peerWidgetLibrary.js", dest: "dist/applicationPersistenceWidget/js/"},
					//Yjs
					{expand: true, cwd: "bower_components", src: "yjs/**", dest: "dist/applicationPersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-array/**", dest: "dist/applicationPersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-map/**", dest: "dist/applicationPersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-memory/**", dest: "dist/applicationPersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-text/**", dest: "dist/applicationPersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-websockets-client/**", dest: "dist/applicationPersistenceWidget/js/"}
				]
			},
			frontendComponentPersistenceWidget: {
				files: [
					//CSS
					{expand: true, cwd: "src/frontendComponentPersistenceWidget", src:"css/*", dest: "dist/frontendComponentPersistenceWidget/"},
					//Static JS
				  //{expand: true, cwd: "src/frontendComponentPersistenceWidget", src:"js/*", dest:"dist/frontendComponentPersistenceWidget/"}
					{expand: true, flatten: true, filter: 'isFile', src: "src/frontendComponentPersistenceWidget/js/las2peerWidgetLibrary.js", dest: "dist/frontendComponentPersistenceWidget/js/"},
					//Yjs
					{expand: true, cwd: "bower_components", src: "yjs/**", dest: "dist/frontendComponentPersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-array/**", dest: "dist/frontendComponentPersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-map/**", dest: "dist/frontendComponentPersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-memory/**", dest: "dist/frontendComponentPersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-text/**", dest: "dist/frontendComponentPersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-websockets-client/**", dest: "dist/frontendComponentPersistenceWidget/js/"}
				]
			},
			microservicePersistenceWidget: {
				files: [
					//CSS
					{expand: true, cwd: "src/microservicePersistenceWidget", src:"css/*", dest: "dist/microservicePersistenceWidget/"},
					//Static JS
					//{expand: true, cwd: "src/microservicePersistenceWidget", src:"js/*", dest: "dist/microservicePersistenceWidget/"}
					{expand: true, flatten: true, filter: 'isFile', src: "src/microservicePersistenceWidget/js/las2peerWidgetLibrary.js", dest: "dist/microservicePersistenceWidget/js/"},
					//Yjs
					{expand: true, cwd: "bower_components", src: "yjs/**", dest: "dist/microservicePersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-array/**", dest: "dist/microservicePersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-map/**", dest: "dist/microservicePersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-memory/**", dest: "dist/microservicePersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-text/**", dest: "dist/microservicePersistenceWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-websockets-client/**", dest: "dist/microservicePersistenceWidget/js/"}
				]
			},
			frontendComponentSelectWidget: {
				files: [
					//CSS
					{expand: true, cwd: "src/frontendComponentSelectWidget", src:"css/*", dest: "dist/frontendComponentSelectWidget/"},
					//Static JS
					//{expand: true, cwd: "src/frontendComponentSelectWidget", src:"js/*", dest: "dist/frontendComponentSelectWidget/"}
					{expand: true, flatten: true, filter: 'isFile', src: "src/frontendComponentSelectWidget/js/extendedLas2peerWidgetLibrary.js", dest: "dist/frontendComponentSelectWidget/js/"},
					//{expand: true, flatten: true, filter: 'isFile', src: "src/frontendComponentSelectWidget/js/applicationScript.js", dest: "dist/frontendComponentSelectWidget/js/"},
					//Yjs
					{expand: true, cwd: "bower_components", src: "yjs/**", dest: "dist/frontendComponentSelectWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-array/**", dest: "dist/frontendComponentSelectWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-map/**", dest: "dist/frontendComponentSelectWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-memory/**", dest: "dist/frontendComponentSelectWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-text/**", dest: "dist/frontendComponentSelectWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-websockets-client/**", dest: "dist/frontendComponentSelectWidget/js/"}
				]
			},
			microserviceSelectWidget: {
				files: [
					//CSS
					{expand: true, cwd: "src/microserviceSelectWidget", src:"css/*", dest: "dist/microserviceSelectWidget/"},
					//Static JS
					//{expand: true, cwd: "src/microserviceSelectWidget", src:"js/*", dest: "dist/microserviceSelectWidget/"}
					{expand: true, flatten: true, filter: 'isFile', src: "src/microserviceSelectWidget/js/extendedLas2peerWidgetLibrary.js", dest: "dist/microserviceSelectWidget/js/"},
					//{expand: true, flatten: true, filter: 'isFile', src: "src/microserviceSelectWidget/js/applicationScript.js", dest: "dist/microserviceSelectWidget/js/"},
					//Yjs
					{expand: true, cwd: "bower_components", src: "yjs/**", dest: "dist/microserviceSelectWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-array/**", dest: "dist/microserviceSelectWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-map/**", dest: "dist/microserviceSelectWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-memory/**", dest: "dist/microserviceSelectWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-text/**", dest: "dist/microserviceSelectWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-websockets-client/**", dest: "dist/microserviceSelectWidget/js/"}
				]
			},
			liveCodeEditorWidget: {
				files: [
					//CSS
					{expand: true, cwd: "src/liveCodeEditorWidget", src:"css/*", dest: "dist/liveCodeEditorWidget/"},
					//Images
					{expand: true, cwd: "src/liveCodeEditorWidget", src:"img/*", dest: "dist/liveCodeEditorWidget/"},
					//Copy bower components
					{expand: true, src: "bower_components/**", dest: "dist/liveCodeEditorWidget/"},
					//static js
					{expand: true, flatten: true, filter: 'isFile', src: "src/liveCodeEditorWidget/mode-xml.js", dest: "dist/liveCodeEditorWidget/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/liveCodeEditorWidget/iwc.js", dest: "dist/liveCodeEditorWidget/"}
				]
			}
		}
});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-replace');

	grunt.registerTask("default", ["browserify","uglify","replace","copy"]);
	grunt.registerTask("specs", ["browserify:specs","connect:server","qunit"]);
};
