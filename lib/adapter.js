'use strict';

const Pensuer = require('penseur');
const Hoek = require('hoek');
const Path = require('path');

const Adapter = function (params) {

    this.params = params || {};
    if (!this.params.database) {
        throw new Error('Database Connection params should be set');
    }
};

Adapter.prototype.getTemplatePath = function () {

    return Path.join(__dirname, 'migrationTemplate.js');
};

Adapter.prototype.connect = function (callback) {

    const self = this;
    const settings = Hoek.clone(self.params.database.connection);
    this.db = new Pensuer.Db(self.params.database.name, settings);
    this.db.table(self.params.tables);
    this.db.connect( (err) => {

        if (err) {
            return callback(err);
        }

        this.db.establish({ migration: { purge: false } }, (err) => {

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

    this.db.migration.query({}, (err, migrations) => {

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

    this.db.migration.insert({ name: name }, (err, id) => {

        if (err) {
            return callback(err);
        }

        return callback(null);
    });
};

Adapter.prototype.unmarkExecuted = function (name, callback) {

    this.db.migration.remove({ name:name }, (err) => {

        if (err) {
            return callback(err);
        }

        return callback(null);
    });
};

module.exports = Adapter;
