var fs = require('fs')
  , path = require('path')
  , field = require('field')

function get (fields) {
  return field.get(this, fields)
}

function set (fields, value) {
  return field.set(this, fields, value)
}


function loadFiles (dir, callback) {
  var retObj = {}
    , errObj = {}

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
        obj.get = get.bind(obj)
        obj.set = set.bind(obj)
        obj.getPath = function() { return currentFile }
        retObj[file] = obj
      }

      if (files.length > 0)
        readFile(files.pop(), again)
      else {
        //console.log('CALLED: ' + x)
        if (Object.keys(errObj).length > 0)
          callback(new Error('jsoncfg: An error occured. See the third parameter.'), retObj, errObj)
        else
          callback(null, retObj, null)
      }
    }
    readFile(files.pop(), again)
  })
}

function loadFilesSync (dir) {
  var files = filterForJson(dir, fs.readdirSync(dir))
    , retObj = {}
    , errObj = {}


  files.forEach(function(file) {
    var f = path.basename(file, '.json')
    try {
      var obj = readFileSync(file)
    } catch (err) {
      errObj[f] = err
    }

    if (!errObj[f]) { //no err parsing
      obj.get = get//.bind(obj)
      obj.set = set//.bind(obj)
      obj.getPath = function() { return file }
      retObj[f] = obj
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


function filterForJson (dir, files) {
  return files.filter(function(f) {
    return (path.extname(f) === '.json') //only json files
  })
  .map(function(f) {
    return path.join(dir, f)
  })
}


function readFile(file, callback) {
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


