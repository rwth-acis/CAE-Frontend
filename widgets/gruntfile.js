module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		host: typeof grunt.option('host') === 'string' ? grunt.option('host') : 'http://localhost:8001',
		yjsserver: typeof grunt.option('yjsserver') === 'string' ? grunt.option('yjsserver') : 'http://localhost:1234',
		caehost: typeof grunt.option('caehost') === 'string' ? grunt.option('caehost') : 'http://localhost:8080',
		reqbazbackend: typeof grunt.option('reqbazbackend') === 'string' ? grunt.option('reqbazbackend') : 'http://localhost:8080',
		reqbazfrontend: typeof grunt.option('reqbazfrontend') === 'string' ? grunt.option('reqbazfrontend') : 'http://localhost:8082',
		
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
						},
						{
							match: 'reqbazbackend',
							replace: '<%= reqbazbackend %>'
						},
						{
							match: 'reqbazfrontend',
							replace: '<%= reqbazfrontend %>'
						}
					]
				},
				files: [
					{src: "src/frontendComponentPersistenceWidget/index.html", dest: "dist/frontendComponentPersistenceWidget/index.html"},
					{src: "src/microservicePersistenceWidget/index.html", dest: "dist/microservicePersistenceWidget/index.html"},


					//CAE widgets XML
					{src: "src/applicationPersistenceWidget/widget.xml", dest: "dist/applicationPersistenceWidget/widget.xml"},
					{src: "src/frontendComponentPersistenceWidget/widget.xml", dest: "dist/frontendComponentPersistenceWidget/widget.xml"},
					{src: "src/microservicePersistenceWidget/widget.xml", dest: "dist/microservicePersistenceWidget/widget.xml"},
					
					{src: "src/frontendComponentSelectWidget/widget.xml", dest: "dist/frontendComponentSelectWidget/widget.xml"},
					{src: "src/microserviceSelectWidget/widget.xml", dest: "dist/microserviceSelectWidget/widget.xml"},
					{src: "src/liveCodeEditorWidget/index.html", dest: "dist/liveCodeEditorWidget/index.html"},

					{src: "src/metadataWidget/widget.xml", dest: "dist/metadataWidget/widget.xml"},
					{src: "src/requirementsBazaarWidget/widget.xml", dest: "dist/requirementsBazaarWidget/widget.xml"},
					{src: "src/requirementsBazaarWidget/index.html", dest: "dist/requirementsBazaarWidget/index.html"},
					{src: "src/swaggerWidget/widget.xml", dest: "dist/swaggerWidget/widget.xml"},

					{src: "src/swaggerWidget/swaggerUi.xml", dest: "dist/swaggerWidget/swaggerUi.xml"},
					{src: "src/swaggerWidget/swaggerUiEditor.xml", dest: "dist/swaggerWidget/swaggerUiEditor.xml"},

					//CAE widgets JS
					{src: "src/microservicePersistenceWidget/js/applicationScript.js", dest: "dist/microservicePersistenceWidget/js/applicationScript.js"},
					{src: "src/frontendComponentPersistenceWidget/js/applicationScript.js", dest: "dist/frontendComponentPersistenceWidget/js/applicationScript.js"},
					{src: "src/applicationPersistenceWidget/js/applicationScript.js", dest: "dist/applicationPersistenceWidget/js/applicationScript.js"},
					
					{src: "src/frontendComponentSelectWidget/js/syncmeta-plugin.js", dest:"dist/frontendComponentSelectWidget/js/syncmeta-plugin.js"},
					{src: "src/frontendComponentSelectWidget/js/applicationScript.js", dest:"dist/frontendComponentSelectWidget/js/applicationScript.js"},
					{src: "src/microserviceSelectWidget/js/syncmeta-plugin.js", dest:"dist/microserviceSelectWidget/js/syncmeta-plugin.js"},
					{src: "src/microserviceSelectWidget/js/applicationScript.js", dest:"dist/microserviceSelectWidget/js/applicationScript.js"},

					{src: "src/metadataWidget/js/applicationScript.js", dest: "dist/metadataWidget/js/applicationScript.js"},
					{src: "src/requirementsBazaarWidget/js/applicationScript.js", dest: "dist/requirementsBazaarWidget/js/applicationScript.js"},
					{src: "src/swaggerWidget/js/applicationScript.js", dest: "dist/swaggerWidget/js/applicationScript.js"},
					
					{src: "src/swaggerWidget/js/swaggerUi.js", dest: "dist/swaggerWidget/js/swaggerUi.js"},
					{src: "src/swaggerWidget/js/swaggerUiEditor.js", dest: "dist/swaggerWidget/js/swaggerUiEditor.js"},

					// Code Editor
					{src: "src/liveCodeEditorWidget/widget.xml", dest: "dist/liveCodeEditorWidget/widget.xml"},
					{src: "src/liveCodeEditorWidget/MicroserviceEditorWidget.xml", dest: "dist/liveCodeEditorWidget/MicroserviceEditorWidget.xml"},
					{src: "src/liveCodeEditorWidget/MicroserviceEditorWidget.html", dest: "dist/liveCodeEditorWidget/MicroserviceEditorWidget.html"},
					{src: "src/liveCodeEditorWidget/LivePreviewWidget.xml", dest: "dist/liveCodeEditorWidget/LivePreviewWidget.xml"},
					{src: "src/liveCodeEditorWidget/LivePreviewWidget.html", dest: "dist/liveCodeEditorWidget/LivePreviewWidget.html"},
					{src: "src/liveCodeEditorWidget/FrontendEditorWidget.xml", dest: "dist/liveCodeEditorWidget/FrontendEditorWidget.xml"},
					{src: "src/liveCodeEditorWidget/FrontendEditorWidget.html", dest: "dist/liveCodeEditorWidget/FrontendEditorWidget.html"},
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
			},
			metadataWidget: {
				files: [
					//CSS
					{expand: true, cwd: "src/metadataWidget", src:"css/*", dest: "dist/metadataWidget/"},
					//Static JS
					{expand: true, flatten: true, filter: 'isFile', src: "src/metadataWidget/js/las2peerWidgetLibrary.js", dest: "dist/metadataWidget/js/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/metadataWidget/js/iwc.js", dest: "dist/metadataWidget/js/"},
					
					// JSON REF
					{expand: true, flatten: true, filter: 'isFile', src: "src/metadataWidget/lib/json-ref-lite.min.js", dest: "dist/metadataWidget/lib/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/metadataWidget/lib/json-refs-standalone.js", dest: "dist/metadataWidget/lib/"},
					
					//Yjs
					{expand: true, cwd: "bower_components", src: "yjs/**", dest: "dist/metadataWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-array/**", dest: "dist/metadataWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-map/**", dest: "dist/metadataWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-memory/**", dest: "dist/metadataWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-text/**", dest: "dist/metadataWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-websockets-client/**", dest: "dist/metadataWidget/js/"}
				]
			},
			requirementsBazaarWidget: {
				files: [
					//CSS
					{expand: true, cwd: "src/requirementsBazaarWidget", src:"css/*", dest: "dist/requirementsBazaarWidget/"},
					//Static JS
					{expand: true, flatten: true, filter: 'isFile', src: "src/requirementsBazaarWidget/js/las2peerWidgetLibrary.js", dest: "dist/requirementsBazaarWidget/js/"},
				],
			},
			swaggerWidget: {
				files: [
					//CSS
					{expand: true, cwd: "src/swaggerWidget", src:"css/*", dest: "dist/swaggerWidget/"},
					
					//Swagger
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger/favicon-16x16.png", dest: "dist/swaggerWidget/lib/swagger/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger/favicon-32x32.png", dest: "dist/swaggerWidget/lib/swagger/"},

					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger/index.html", dest: "dist/swaggerWidget/lib/swagger/"},

					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger/oauth2-redirect.html", dest: "dist/swaggerWidget/lib/swagger/"},

					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger/swagger-ui.css", dest: "dist/swaggerWidget/lib/swagger/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger/swagger-ui.css.map", dest: "dist/swaggerWidget/lib/swagger/"},

					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger/swagger-ui.js", dest: "dist/swaggerWidget/lib/swagger/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger/swagger-ui.js.map", dest: "dist/swaggerWidget/lib/swagger/"},

					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger/swagger-ui-bundle.js", dest: "dist/swaggerWidget/lib/swagger/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger/swagger-ui-bundle.js.map", dest: "dist/swaggerWidget/lib/swagger/"},

					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger/swagger-ui-standalone-preset.js", dest: "dist/swaggerWidget/lib/swagger/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger/swagger-ui-standalone-preset.js.map", dest: "dist/swaggerWidget/lib/swagger/"},

					//Swagger Editor
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger-editor/favicon-16x16.png", dest: "dist/swaggerWidget/lib/swagger-editor/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger-editor/favicon-32x32.png", dest: "dist/swaggerWidget/lib/swagger-editor/"},

					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger-editor/index.html", dest: "dist/swaggerWidget/lib/swagger-editor/"},

					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger-editor/swagger-editor.css", dest: "dist/swaggerWidget/lib/swagger-editor/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger-editor/swagger-editor.css.map", dest: "dist/swaggerWidget/lib/swagger-editor/"},

					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger-editor/swagger-editor.js", dest: "dist/swaggerWidget/lib/swagger-editor/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger-editor/swagger-editor.js.map", dest: "dist/swaggerWidget/lib/swagger-editor/"},

					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger-editor/swagger-editor-bundle.js", dest: "dist/swaggerWidget/lib/swagger-editor/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger-editor/swagger-editor-bundle.js.map", dest: "dist/swaggerWidget/lib/swagger-editor/"},

					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger-editor/swagger-editor-standalone-preset.js", dest: "dist/swaggerWidget/lib/swagger-editor/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger-editor/swagger-editor-standalone-preset.js.map", dest: "dist/swaggerWidget/lib/swagger-editor/"},

					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger-editor/validation.worker.js", dest: "dist/swaggerWidget/lib/swagger-editor/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/swagger-editor/validation.worker.js.map", dest: "dist/swaggerWidget/lib/swagger-editor/"},

					// JSON to YAML
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/yaml.js", dest: "dist/swaggerWidget/lib/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/lib/json2yaml.js", dest: "dist/swaggerWidget/lib/"},

					//Static JS
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/js/las2peerWidgetLibrary.js", dest: "dist/swaggerWidget/js/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/js/iwc.js", dest: "dist/swaggerWidget/js/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/swaggerWidget/js/iwcOld.js", dest: "dist/swaggerWidget/js/"},
					//Yjs
					{expand: true, cwd: "bower_components", src: "yjs/**", dest: "dist/swaggerWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-array/**", dest: "dist/swaggerWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-map/**", dest: "dist/swaggerWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-memory/**", dest: "dist/swaggerWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-text/**", dest: "dist/swaggerWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-websockets-client/**", dest: "dist/swaggerWidget/js/"}
				]
			},
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
