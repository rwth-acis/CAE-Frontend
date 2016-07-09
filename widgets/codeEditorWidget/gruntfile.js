module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		browserify:{
			options:{
				transform: [
					["babelify",{presets: ["es2015"],global:true}]
				]
			},
      specs:{
				src : ['node_modules/regenerator/runtime.js','tests/tests.js'],
				dest : 'dist/specs.js',
        options:{
          alias : {
            'openapp' : "./tests/roleSpaceMockup.js"
          }
        }
      },
			CAECode:{
				src : ['node_modules/regenerator/runtime.js','src/main.js'],
				dest : 'dist/main.dev.js',
        options:{
          alias : {
            'openapp' : "./src/lib/openapp.js"
          }
        }
			},
      CAELivePreview:{
        src: ["src/livePreview.js"],
        dest : 'dist/livePreview.dev.js',
        options:{
          alias : {
            'openapp' : "./src/lib/openapp.js"
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
					'dist/main.min.js' : ['dist/main.dev.js'],
					'dist/livePreview.min.js' : ['dist/livePreview.dev.js']
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
					base: '.'
        }
			}
		}
});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-qunit');

	grunt.registerTask("default", ["browserify","uglify"]);
	grunt.registerTask("specs", ["browserify:specs","connect:server","qunit"]);
};
