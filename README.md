Node.js - jsoncfg
================

Easily read JSON files from a directory. Great for configuration.


Why?
----

I store configuration data in JSON files. It's handy to load them up and parse them with one method. Also, it includes undefined field support from [field](https://github.com/jprichardson/node-field).



Installation
------------

    npm install jsoncfg



Usage
------

### Example

Let's assume that you have the following files structure:

```
./config
├── database.json
├── malformed.json
├── shopping.json
├── weird\ name2.json
├── weird-name.json
└── weird_name3.json
```

let's assume that `database.json` looks like:

```json
{
    "development": {
        "name": "myapp_development",
        "host": "127.0.0.1",
        "port": 27017
    },
    "test": {
        "name": "myapp_test",
        "host": "127.0.0.1",
        "port": 27017
    },
    "production": {
        "name": "myapp_production",
        "host": "myserver.com",
        "port": 27017
    }
}
```


```javascript
var jsoncfg = require('jsoncfg');

jsoncfg.loadFiles('./config', function(err, files, errInfo) {
  if (err) { //this is an error object, see errInfo for all errors for each file
    console.log(errInfo['malformed']) //could not parse 'malformed.json'
  }

  console.log(files.database.production.host) //"myserver.com"

  var dbCfg = files.database

  //can also use string notation to avoid the following:
  var host = (dbCfg && dbCfg.production && dbCfg.production.host)
  host = dbCfg.get('production.host')

  //use ':' if you prefer
  host = dbCfg.get('production:host')

  //or treat everything as a field, including the configuration file
  host = files.get('database:production.host')

  //you can also create fields
  dbCfg.set('production.location.country', 'US') //returns old value if overwriting or value, or `undefined` if new
  console.log(dbCfg.production.location.country) //'US'
})

```

### loadFiles(dir, [cache], callback)

**TODO**

### loadFilesSync(dir, [cache])

**TODO**


Config Files
------------

For a full configuration package, see: [fnoc](https://github.com/jprichardson/node-fnoc) which is built on this.



License
-------

(MIT License)

Copyright 2013, JP Richardson  <jprichardson@gmail.com>


