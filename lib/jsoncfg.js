var fs = require('fs')
  , path = require('path')
  , field = require('field')

function loadFiles (dir, cache, callback) {
  var retObj = {}
    , errObj = {}

  if (typeof cache == 'function') {
    callback = cache
    cache = {}
  } else {
    cache = cache || {}
  }

  fs.readdir(dir, function(err, files) {
    if (err) return callback(err, {}, null)

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
        readFile(files.pop(), cache, again)
      else {
        //console.log('CALLED: ' + x)
        if (Object.keys(errObj).length > 0)
          callback(new Error('jsoncfg: An error occured. See the third parameter.'), retObj, errObj)
        else
          callback(null, retObj, null)
      }
    }
    readFile(files.pop(), cache, again)
  })
}

function loadFilesSync (dir, cache) {
  var files = filterForJson(dir, fs.readdirSync(dir))
    , retObj = {}
    , errObj = {}
    , cache = cache || {}


  files.forEach(function(file) {
    var f = path.basename(file, '.json')

    if (typeof cache[file] == 'undefined') {
      try {
        var obj = readFileSync(file)
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
  return retObj;
}

module.exports.loadFiles = loadFiles
module.exports.loadFilesSync = loadFilesSync


/////////////////////
// PRIVATE METHODS
/////////////////////

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


function readFile(file, cache, callback) {
  if (typeof cache[file] != 'undefined')
    return callback(null, cache[file], file)

  fs.readFile(file, 'utf8', function(err, data) {
    if (err) return callback(err, {}, file)
        
    try {
      var obj = JSON.parse(data);
      callback(null, obj, file);
    } catch (err2) {
      callback(err2, null, file);
    }      
  })
}

function readFileSync(file) {
  var data = fs.readFileSync(file, 'utf8');
  return JSON.parse(data);
}


