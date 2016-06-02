module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		browserify:{
			options:{
				transform: [
					["babelify",{presets: ["es2015"],global:true}]
				]
			},
			CAECode:{
				src : ['node_modules/regenerator/runtime.js','src/main.js'],
				dest : 'dist/main.dev.js'
			},
      CAELivePreview:{
        src: ["src/livePreview.js"],
        dest : 'dist/livePreview.dev.js'
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
		}
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask("default", ["browserify","uglify"]);

};
