//I'm not particularly proud of this code...

module.exports.loadFiles = loadFiles
module.exports.loadFilesSync = loadFilesSync

var fs = require('fs')
  , path = require('path')
  , field = require('field')

function loadFiles (dir, options, callback) {
  var retObj = {}
    , errObj = {}

  if (typeof options == 'function') {
    callback = options
    options = {}
  } else {
    options = options || {cache: {}}
  }

  retObj.get = get

  if (!options.cache) options.cache = {}

  fs.readdir(dir, function(err, files) {
    if (err) return callback(err, retObj, null)

    files = filterForJson(dir, files)

    //console.log('TOTAL: ' + files.length)
    //var x = 0
    function again (err, obj, currentFile) {
      var file = path.basename(currentFile, '.json')
      //x += 1
      if (err) 
        errObj[file] = err
      else {
        retObj[file] = attachMethods(obj, currentFile)
      }

      if (files.length > 0)
        readFile(files.pop(), options, again)
      else {
        if (Object.keys(errObj).length > 0)
          callback(new Error('jsoncfg: An error occured. See the third parameter.'), retObj, errObj)
        else
          callback(null, retObj, null)
      }
    }
    readFile(files.pop(), options, again)
  })
}

function loadFilesSync (dir, options) {
  var retObj = {}
    , errObj = {}
    , options = options || {}
    , cache = options.cache || {}
    , files = []

  retObj.get = get

  try {
    files = fs.readdirSync(dir)
  } catch (err) {
    errObj[err] = err
  }

  files = filterForJson(dir, files) 
  files.forEach(function(file) {
    var f = path.basename(file, '.json')

    if (typeof cache[file] == 'undefined') {
      try {
        var obj = readFileSync(file, options.transformer)
      } catch (err) {
        errObj[f] = err
      }

      if (!errObj[f]) { //no err parsing
        retObj[f] = attachMethods (obj, file)
      }
    } else {
      retObj[f] = cache[file]
    }
  })

  retObj.errors = errObj;
  retObj.get = get
  return retObj;
}




/////////////////////
// PRIVATE METHODS
/////////////////////

function get (fileAndField) { //on main jsoncfg object
  var fields = fileAndField.split(/\:|\./)
    , file = fields.shift()

  if (typeof this[file] != 'undefined')
    return this[file].get(fields.join('.'))
  else
    return undefined
}

function attachMethods (obj, file) {
  function get (fields) {
    return field.get(this, fields)
  }

  function set (fields, value) {
    return field.set(this, fields, value)
  }

  obj.get = get
  obj.set = set
  obj.getPath = function() { return file }
  return obj
}

function filterForJson (dir, files) {
  return files.filter(function(f) {
    return (path.extname(f) === '.json') //only json files
  })
  .map(function(f) {
    return path.join(dir, f)
  })
}


function readFile(file, options, callback) {
  var cache = options.cache

  if (typeof cache[file] != 'undefined')
    return callback(null, cache[file], file)

  fs.readFile(file, 'utf8', function(err, data) {
    if (err) return callback(err, {}, file)
        
    try {
      var obj = JSON.parse(data, options.transformer);
      callback(null, obj, file);
    } catch (err2) {
      callback(err2, null, file);
    }      
  })
}

function readFileSync(file, transformer) {
  var data = fs.readFileSync(file, 'utf8');
  return JSON.parse(data, transformer);
}


