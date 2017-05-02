'use strict';

const Pensuer = require('penseur');
const Hoek = require('hoek');
const Path = require('path');

const Adapter = function (params) {

    this.params = params || {};
    if (!this.params.database) {
        throw new Error('Database Connection params should be set');
    }

    if (typeof this.params.database.migrationTable !== 'string') {
        this.params.database.migrationTable = 'migration';
    }
};

Adapter.prototype.getTemplatePath = function () {

    return Path.join(__dirname, 'migrationTemplate.js');
};

Adapter.prototype.connect = function (callback) {

    const self = this;
    const settings = Hoek.clone(self.params.database.connection);
    const tableName = self.params.database.migrationTable;
    this.db = new Pensuer.Db(self.params.database.name, settings);
    this.db.table(self.params.tables);
    this.db.connect( (err) => {

        if (err) {
            return callback(err);
        }

        this.db.establish({ [tableName]: { purge: false } }, (err) => {

            if (err) {
                return callback(err);
            }

            return callback(null, { db: self.db });
        });
    });
};

Adapter.prototype.disconnect = function (callback) {

    this.db.close(() => {

        return callback();
    });
};

Adapter.prototype.getExecutedMigrationNames = function (callback) {

    const self = this;
    const tableName = self.params.database.migrationTable;

    this.db[tableName].query({}, (err, migrations) => {

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

    this.db[tableName].insert({ name: name, created: Date.now() }, (err, id) => {

        if (err) {
            return callback(err);
        }

        return callback(null);
    });
};

Adapter.prototype.unmarkExecuted = function (name, callback) {

    const self = this;
    const tableName = self.params.database.migrationTable;

    this.db[tableName].remove({ name: name }, (err) => {

        if (err) {
            return callback(err);
        }

        return callback(null);
    });
};

module.exports = Adapter;
