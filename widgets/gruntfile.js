module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		host: typeof grunt.option('host') === 'string' ? grunt.option('host') : 'http://localhost:8001',
		yjsserver: typeof grunt.option('yjsserver') === 'string' ? grunt.option('yjsserver') : 'http://localhost:1234',
		yjsresourcepath: grunt.option('yjsresourcepath'),
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
							match: 'yjsresourcepath',
							replace: '<%= yjsresourcepath %>'
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
				  //CAE widgets XML
					{src: "src/liveCodeEditorWidget/index.html", dest: "dist/liveCodeEditorWidget/index.html"},

					{src: "src/matchingWidget/widget.xml", dest: "dist/matchingWidget/widget.xml"},
					{src: "src/matchingWidget/widget.html", dest: "dist/matchingWidget/widget.html"},
					{src: "src/requirementsBazaarWidget/widget.xml", dest: "dist/requirementsBazaarWidget/widget.xml"},
					{src: "src/requirementsBazaarWidget/index.html", dest: "dist/requirementsBazaarWidget/index.html"},
					{src: "src/swaggerWidget/widget.xml", dest: "dist/swaggerWidget/widget.xml"},

					{src: "src/swaggerWidget/swaggerUi.xml", dest: "dist/swaggerWidget/swaggerUi.xml"},
					{src: "src/swaggerWidget/swaggerUiEditor.xml", dest: "dist/swaggerWidget/swaggerUiEditor.xml"},

					{src: "src/swaggerWidget/widget.html", dest: "dist/swaggerWidget/widget.html"},

					{src: "src/swaggerWidget/swaggerUi.html", dest: "dist/swaggerWidget/swaggerUi.html"},
					{src: "src/swaggerWidget/swaggerUiEditor.html", dest: "dist/swaggerWidget/swaggerUiEditor.html"},

					//CAE widgets JS
					{src: "src/matchingWidget/js/applicationScript.js", dest: "dist/matchingWidget/js/applicationScript.js"},
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
			matchingWidget: {
				files: [
					//CSS
					{expand: true, cwd: "src/matchingWidget", src:"css/*", dest: "dist/matchingWidget/"},
					//Static JS
					{expand: true, flatten: true, filter: 'isFile', src: "src/matchingWidget/js/las2peerWidgetLibrary.js", dest: "dist/matchingWidget/js/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/matchingWidget/js/iwc.js", dest: "dist/matchingWidget/js/"},
					
					// JSON REF
					{expand: true, flatten: true, filter: 'isFile', src: "src/matchingWidget/lib/json-ref-lite.min.js", dest: "dist/matchingWidget/lib/"},
					{expand: true, flatten: true, filter: 'isFile', src: "src/matchingWidget/lib/json-refs-standalone.js", dest: "dist/matchingWidget/lib/"},
					
					//Yjs
					{expand: true, cwd: "bower_components", src: "yjs/**", dest: "dist/matchingWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-array/**", dest: "dist/matchingWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-map/**", dest: "dist/matchingWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-memory/**", dest: "dist/matchingWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-text/**", dest: "dist/matchingWidget/js/"},
					{expand: true, cwd: "bower_components", src: "y-websockets-client/**", dest: "dist/matchingWidget/js/"}
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
