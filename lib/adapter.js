'use strict';

const Pensuer = require('penseur');
const Hoek = require('hoek');
const Path = require('path');
const Util = require('./util');

const Adapter = function (params) {

    this.params = params || {};
    if (!this.params.database) {
        throw new Error('Database Connection params should be set');
    }

    if (typeof this.params.database !== 'function') {
        this.params.configure = (cb) => cb(null, params.database);
    }
    else {
        this.params.configure = this.params.database;
    }
};

Adapter.prototype.getTemplatePath = function () {

    return Path.join(__dirname, 'migrationTemplate.js');
};

Adapter.prototype.configure = function (callback) {

    const self = this;

    self.params.configure((err, database) => {

        if (err) {
            return callback(err);
        }

        self.params.database = database;
        self.params.database.migrationTable = self.params.database.migrationTable || 'migration';
        callback();
    });
};

Adapter.prototype.connect = function (callback) {

    const self = this;

    self.configure((err) => {

        if (err) {
            return callback(err);
        }

        const settings = Hoek.clone(self.params.database.connection);
        const tableName = self.params.database.migrationTable;
        this.db = new Pensuer.Db(self.params.database.name, settings);
        this.db.table(self.params.tables);
        const callbackified = Util.callbackify(() => {

            return this.db.connect().then(() => {

                return this.db.establish({ [tableName]: { purge: false } });
            });
        });

        callbackified((err) => {

            if (err) {
                return callback(err);
            }
            return callback(null, { db: self.db });
        });
    });
};

Adapter.prototype.disconnect = function (callback) {

    Util.callbackify(this.db.close.bind(this.db))(() => {

        return callback();
    });
};

Adapter.prototype.getExecutedMigrationNames = function (callback) {

    const self = this;
    const tableName = self.params.database.migrationTable;

    const table = this.db[tableName];
    Util.callbackify(table.query.bind(table))({}, (err, migrations) => {

        if (err) {
            return callback(err);
        }

        if (migrations === null) {
            return callback(null, []);
        }

        callback(null, migrations.map((row) => {

            return row.name;
        }));
    });
};

Adapter.prototype.markExecuted = function (name, callback) {

    const self = this;
    const tableName = self.params.database.migrationTable;

    const table = this.db[tableName];
    const insert = Util.callbackify(table.insert.bind(table));

    insert({ name, created: Date.now() }, (err, id) => {

        if (err) {
            return callback(err);
        }

        return callback(null);
    });
};

Adapter.prototype.unmarkExecuted = function (name, callback) {

    const self = this;
    const tableName = self.params.database.migrationTable;

    const table = this.db[tableName];
    const remove = Util.callbackify(table.remove.bind(table));

    remove({ name }, (err) => {

        if (err) {
            return callback(err);
        }

        return callback(null);
    });
};

module.exports = Adapter;
