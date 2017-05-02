# east rethink

rethinkdb adapter for [east](https://github.com/okv/east) (node.js database migration tool) which uses 
[pensuer](https://github.com/hueniverse/penseur)

All executed migrations names will be stored at `migrations` table in the
current database. Object with following properties will be passed to `migrate`
and `rollback` functions:

* `db` - instance of [pensuer](https://github.com/hueniverse/penseur)


## Installation

```sh
npm install east east-rethink -g
```

alternatively you could install it locally


## Usage

go to project dir and run

```sh
east init
```

create `.eastrc` file at current directory

```js
{
    "adapter": "east-rethink",
    "tables": ["card", "group", "user"],
    "database": {
        "name": "mydatabase",
        "migrationTable": "mymigrationtable",
        "connection": {
            "host": "localhost",
            "port": 28015
        }
    }
}
```

where 
* `tables` is an array of the tables you wish to connect to in your database.
* `database` is a json object with the following properties: `name` - database name, `migrationTable` - migration table name (optional - defaults to 'migration'), `connection` - a json object with `host` and `port` providing the host name and port number for your database respectively.

now we can create some migrations

```sh
east create apples
east create bananas
```

created files will looks like this one

```js
exports.migrate = function(client, done) {
    var db = client.db;
    done();
};

exports.rollback = function(client, done) {
    var db = client.db;
    done();
};
```

edit created files and insert  

to 1_apples

```js
exports.migrate = function(client, done) {
    var db = client.db;
    db.card.insert( { id: 1, type: 'apple', color: 'red' }, (err, results) => {

        if (err) return done(err);

        return done(null);
    });
};

exports.rollback = function(client, done) {
    var db = client.db;

    db.card.remove({ id: 1 }, (err) => {

        if (err) return done(err);

        return done(null);
    });
};
```

to 2_bananas

```js
exports.migrate = function(client, done) {
    var db = client.db;
    db.card.insert( { id: 2, type: 'banana', color: 'yellow' }, (err, results) => {

        if (err) return done(err);

        return done(null);
    });
};

exports.rollback = function(client, done) {
    var db = client.db;
    db.card.remove({ id: 2 }, (err) => {

        if (err) return done(err);

        return done(null);
    });
};
```

now we can execute our migrations

```sh
east migrate
```

output

```sh
target migrations:
    1_apples
    2_bananas
migrate `1_apples`
migration done
migrate `2_bananas`
migration done
```

and roll them back

```sh
east rollback
```

output

```sh
target migrations:
    2_bananas
    1_apples
rollback `2_bananas`
migration successfully rolled back
rollback `1_apples`
migration successfully rolled back
```

you can specify one or several particular migrations for migrate/rollback e.g.

```sh
east migrate 1_apples
```

or

```sh
east migrate 1_apples 2_bananas
```

Run `east -h` to see all commands, `east <command> -h` to see detail command help,
see also [east page](https://github.com/okv/east#usage) for command examples.


## Running test

run [east](https://github.com/okv/east#running-test) tests with this adapter