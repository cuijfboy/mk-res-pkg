var fs = require('fs')
var path = require('path')
var commandLineArgs = require('command-line-args')
var walk = require('walk')
var AdmZip = require('adm-zip')
var md5 = require('md5')

args = commandLineArgs([
	{name: 'name', type: String},
	{name: 'version', type: String},
	{name: 'url', type: String},
	{name: 'verbose', type: Boolean}
])

if(args.verbose == null) args.verbose = false
if(args.name == null || args.version == null || args.url == null){
	console.log('ERROR: INVALID ARGS !!!')
	console.log('USAGE: node mk-res-pkg.js --name <name> --version <version> --url <urlPrefix> --verbose')
	process.exit(1)
}
console.log(args)
console.log('Ready? GO! GO! GO!')

pageMapping = {}

writePageMapping = function(){
	jsonString = JSON.stringify(pageMapping, null, 4)
	if(args.verbose) console.log(jsonString)

	fs.writeFile('page_pageMapping.json', new Buffer(jsonString), function(err){
		if(err) throw err
		console.log('"page_pageMapping.json" generated !')

		createZipFile()
	})
}

createZipFile = function(){
	console.log('Generating zip file ...')
	zip = new AdmZip()
	zip.addLocalFolder(__dirname, args.name)
	zipName = args.name + '@' + args.version + '.zip'
	zipPath = __dirname + '/' + zipName
	zip.writeZip(zipPath)
	console.log('"' + zipName + '" generated !')

	calculateMd5(zipPath)
}

calculateMd5 = function(file){
	console.log('Calulatting MD5 ...')
	fs.readFile(file, function(err, buf){
		info = path.parse(file)
		console.log('MD5 (' + info.name + info.ext + ') = ' + md5(buf))
		
		console.log('Well Done !')
	})
}

waker = walk.walk(__dirname)

waker.on('file', function(root, stat, next){
	file = path.relative(__dirname, root + '/' + stat.name)
	if(args.verbose) console.log(file)
	pageMapping[args.url + '/' + file] = '/' + file

	next()
})

waker.on('end', function(){
	writePageMapping()
})