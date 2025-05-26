# nowDB

[![Travis Build Status](https://travis-ci.org/StevenPerez/nowdb.svg?branch=master)](https://travis-ci.org/StevenPerez/nowdb)
[![codecov](https://codecov.io/gh/StevenPerez/nowdb/branch/master/graph/badge.svg)](https://codecov.io/gh/StevenPerez/nowdb)
#### JSON DB that Broadcasts the changes.

- **Awesome to communicate changes via sockets:** You can listen db and table changes, so you can enable / disable and filter by whatever broadcast response. :loudspeaker:
- **Easy to use with http requests too:** It works perfect as a normal local json db. :radio:
- **It is free !!!** :money_with_wings:

## Getting Started

Install nowDB using `npm`:

```
npm install --save nowdb
```

### Setup
```
const nowdb = require('nowdb')(); // Don't forget the last parentesis !!!
```

Every method in this library requires the props: `path`, `fileName`, `emit (default true)`, `adapter (default null)`

If you wish to avoid passing those props in every method, you can define it in this way:
```
const nowdb = require('nowdb')({ path: './db', fileName: 'db.json' });
```

## Listening db and table events with Sparkles

#### DB events
```
sparkles.on('db-event', (event) => {

    // event.adapter allows you to pass objects like sockets through the table / schema methods.

    console.log(event);

});
```

#### Table events
```
sparkles.on('table-event', (event) => {

    // event.adapter allows you to pass objects like sockets through the table / schema methods.

    console.log(event);

});
```
## Interface
```
const { schema, setSchema, table, setTable, sparkles } = nowdb;
```

## schema:

#### init method
```
params:  { table, path, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit: { init: true, actionKey: 'SCHEMA_INIT' }


description: Creates the directory and a json file with a default empty object as content.
```


#### dirExist method
```
params:  { path, emit (bool, default = true), adapter (default = null) }

response / last emit: { isDirectory: true, actionKey: 'DIR_EXIST' }


description: Checks if a directory exists in the specified path.
```

#### dirDelete method
```
params:  { path, emit (bool, default = true), adapter (default = null) }

response / last emit: { dirDelete: true, actionKey: 'DIR_DELETE' }


description: Deletes a directory in the specified path.
```

#### dirCreate method
```
params:  { path, emit (bool, default = true), adapter (default = null) }

response / last emit: { dirCreated: true, actionKey: 'DIR_CREATE' }


description: Creates a directory in the specified path.
```

#### read method
```
params:  { path, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit: { schemaRead: true, tables: {}, actionKey: 'SCHEMA_READ' }


description: Reads the json db file in the specified path. The prop tables has the content of our db.
```

#### exist method
```
params:  { path, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit: { isFile: true, actionKey: 'SCHEMA_EXIST' }


description: Checks if a the json db file exists in the specified path.
```

#### remove method
```
params:  { path, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit: { schemaRemoved: true, actionKey: 'SCHEMA_REMOVE' }


description: Removes the json db file in the specified path.
```

#### create method
```
params:  { path, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit: { schemaCreated: true, actionKey: 'SCHEMA_CREATE' }


description: Creates the json db file in the specified path. It writes an empty object by default.
```

## setSchema

This function returns an instance of `schema` by selecting if the returned `schema object` will emit or not the changes.
```
const mySchema = setSchema({ emit (bool, default = true), adapter (default = null) });
mySchema.createDir(...);
```
**NOTE:** You can still passing the `emit` prop to each method if you want to broadcast specific changes.

## table

#### create method
```
params:  { table, path, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit: { tableCreated: true, actionKey: 'TABLE_CREATE' }


description: Creates table in the schema. It writes an empty array by default in the new prop table.
```

#### exist method
```
params:  { table, path, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit: { tableExist: true, actionKey: 'TABLE_EXIST' }


description: Checks if a table in the schema.
```

#### remove method
```
params:  { table, path, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit: { tableRemoved: true, actionKey: 'TABLE_REMOVE' }


description: Removes a table in the schema.
```

#### read method
```
params:  { table, path, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit: { tableRead: true, rows: [], actionKey: 'TABLE_READ' }


description: Reads a table in the schema. The rows prop contains the data of the table.
```

#### insert method
```
params:  { table, path, value, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit:
{
    tableRowInserted: true,
    table: 'Table_A',
    oldVal: null,
    newVal: { hi: 'world', uid: '5a484476-170d-41c8-bf9c-ba98d1ed6cac' },
    actionKey: 'TABLE_ROW_INSERT'
}


description: Inserts a row in the table.
```

#### update method
```
params:  { table, path, value, uid, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit:
{
    tableRowUpdated: true,
    table: 'Table_B',
    oldVal: { yolo: 'Martha', uid: 'c635d00b-c46e-43be-aec2-c00b815d103b' },
    newVal: { yolo: 'Juan', uid: 'c635d00b-c46e-43be-aec2-c00b815d103b' },
    actionKey: 'TABLE_ROW_UPDATE'
}


description: Updates a row in the table.
```

#### replace method
```
params:  { table, path, value, uid, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit:
{
    tableRowReplaced: true,
    table: 'Table_B',
    oldVal: { yolo: 'Juan', uid: 'c635d00b-c46e-43be-aec2-c00b815d103b' },
    newVal: { name: 'Pedro', uid: 'c635d00b-c46e-43be-aec2-c00b815d103b' },
    actionKey: 'TABLE_ROW_REPLACE'
}


description: Replaces / Transforms the structure of a row in the table.
```

#### del method
```
params:  { table, path, uid, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit:
{
    tableRowDeleted: true,
    table: 'Table_B',
    oldVal: { yolo: 'John', uid: '71f3f22e-29f8-49d3-93a6-79eff2badb16' },
    newVal: null,
    actionKey: 'TABLE_ROW_DELETE'
}


description: Deletes a row in the table.
```

#### get method
```
params:  { table, path, uid, fileName, emit (bool, default = true), adapter (default = null) }

response / last emit:
{
    tableRowGet: true,
    row: { name: 'Pedro', uid: '9497f7fd-a37b-4d97-88d2-897e8d120483' },
    actionKey: 'TABLE_ROW_GET'
}


description: Gets a row in the table by uid.
```

## setTable

This function returns an instance of `table` by selecting if the returned `table object` will emit or not the changes and reducing the scope for a specific table interaction.
```
const myTableB = setTable({ table: 'Table_B', emit (bool, default = true), adapter (default = null) });
myTableB.insert(...);
```
**NOTE:** You can still passing the `emit` prop to each method if you want to broadcast specific changes.

## sparkles
This library was created by phated (https://www.npmjs.com/package/sparkles) :clap:, I used it to broadcast the db and table events.

### Important :pushpin:
If you import the nowdb library in this way:
```
const nowdb = require('nowdb')();
```
You should pass the `path`, `filename` on each method, e.g:
```
table.insert({
    path: './db',
    fileName: 'db.json',
    table: 'Table_A',
    value: { hi: 'world' }
});
```

#### **BUT**

If you pass the `path`, `filename`, `emit (optional, default = true)`, `adapter (optional, default = null)` in the constructor, you will avoid to pass those props to each methods, e.g:
```
const nowdb = require('nowdb')({ path: './db', fileName: 'db.json' });
```
so,
```
table.insert({
    table: 'Table_A',
    value: { hi: 'world' }
});
```
also,
```
const myTableA = setTable({ table: 'Table_A' });

myTableA.insert({
    value: { hi: 'world' }
});
```

## Demo Code
https://github.com/StevenPerez/nowdb-demo

<img src="https://github.com/StevenPerez/images/blob/master/nowdb.gif"></img>


<br/>
<br/>
<br/>
<br/>
<p>Author: Steven Pérez Alfaro</p>
<p>www.stevengpa.com</p>
<p>www.stevengpa.com/youtube</p>
<br/>
<br/>
<br/>
<br/>
MIT License

Copyright (c) 2017 Steven Pérez Alfaro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
