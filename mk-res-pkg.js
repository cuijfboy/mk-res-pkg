#! /usr/bin/env node

var fs = require('fs')
var path = require('path')
var commandLineArgs = require('command-line-args')
var walk = require('walk')
var md5 = require('md5')
var slash = require('slash')
var archiver = require('archiver');

args = commandLineArgs([
	{name: 'name', type: String},
	{name: 'version', type: String},
	{name: 'url', type: String},
	{name: 'verbose', type: Boolean}
])
pwd = process.cwd()

if(args.verbose == null) args.verbose = false
if(args.name == null || args.version == null || args.url == null){
	console.log('ERROR: INVALID ARGS !!!')
	console.log('USAGE: mk-res-pkg --name <name> --version <version> --url <urlPrefix> --verbose')
	process.exit(1)
}
console.log('current directory:' + pwd)
console.log('Ready? GO! GO! GO!')

pageMapping = {}

writePageMapping = function(){
	jsonString = JSON.stringify(pageMapping, null, 4)
	if(args.verbose) console.log(jsonString)

	fs.writeFile('page_mapping.json', new Buffer(jsonString), function(err){
		if(err) throw err
		console.log('"page_mapping.json" generated !')

		createZipFile()
	})
}

createZipFile = function(){
	console.log('Generating zip file ...')
	zipName = args.name + '@' + args.version + '.zip'
	zipPath = pwd + '/' + zipName

	zip = archiver('zip');
	zip.bulk([
		{cwd: pwd, src: ['**/*'], expand: true, dest: args.name}
	]);
	
	output = fs.createWriteStream(zipPath);
	output.on('close', function() {
		fs.unlink('page_mapping.json')
		
		calculateMd5(zipPath)
	});
	zip.pipe(output);

	zip.finalize(function(err, bytes) {
		if(err) throw err
	});
}

calculateMd5 = function(file){
	console.log('Calulatting MD5 ...')
	fs.readFile(file, function(err, buf){
		info = path.parse(file)
		console.log('MD5 (' + info.name + info.ext + ') = ' + md5(buf))

		console.log('Well Done !')
	})
}

walker = walk.walk(pwd)
walker.on('file', function(root, stat, next){
	file = slash(path.relative(pwd, root + '/' + stat.name))
	if(args.verbose) console.log(file)
	pageMapping[args.url + '/' + file] = '/' + args.name + '/' + file

	next()
})
walker.on('end', function(){
	writePageMapping()
})