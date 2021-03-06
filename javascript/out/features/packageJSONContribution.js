/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var vscode_1 = require('vscode');
var markedTextUtil_1 = require('./markedTextUtil');
var nls = require('vscode-nls');
var localize = nls.loadMessageBundle(__filename);
var LIMIT = 40;
var PackageJSONContribution = (function () {
    function PackageJSONContribution(xhr) {
        this.xhr = xhr;
        this.mostDependedOn = ['lodash', 'async', 'underscore', 'request', 'commander', 'express', 'debug', 'chalk', 'colors', 'q', 'coffee-script',
            'mkdirp', 'optimist', 'through2', 'yeoman-generator', 'moment', 'bluebird', 'glob', 'gulp-util', 'minimist', 'cheerio', 'jade', 'redis', 'node-uuid',
            'socket', 'io', 'uglify-js', 'winston', 'through', 'fs-extra', 'handlebars', 'body-parser', 'rimraf', 'mime', 'semver', 'mongodb', 'jquery',
            'grunt', 'connect', 'yosay', 'underscore', 'string', 'xml2js', 'ejs', 'mongoose', 'marked', 'extend', 'mocha', 'superagent', 'js-yaml', 'xtend',
            'shelljs', 'gulp', 'yargs', 'browserify', 'minimatch', 'react', 'less', 'prompt', 'inquirer', 'ws', 'event-stream', 'inherits', 'mysql', 'esprima',
            'jsdom', 'stylus', 'when', 'readable-stream', 'aws-sdk', 'concat-stream', 'chai', 'Thenable', 'wrench'];
    }
    PackageJSONContribution.prototype.getDocumentSelector = function () {
        return [{ language: 'json', pattern: '**/package.json' }];
    };
    PackageJSONContribution.prototype.collectDefaultSuggestions = function (fileName, result) {
        var defaultValue = {
            'name': '${1:name}',
            'description': '${2:description}',
            'authors': '${3:author}',
            'version': '${4:1.0.0}',
            'main': '${5:pathToMain}',
            'dependencies': {}
        };
        var proposal = new vscode_1.CompletionItem(localize(0, null));
        proposal.kind = vscode_1.CompletionItemKind.Module;
        proposal.insertText = new vscode_1.SnippetString(JSON.stringify(defaultValue, null, '\t'));
        result.add(proposal);
        return Promise.resolve(null);
    };
    PackageJSONContribution.prototype.collectPropertySuggestions = function (resource, location, currentWord, addValue, isLast, collector) {
        if ((location.matches(['dependencies']) || location.matches(['devDependencies']) || location.matches(['optionalDependencies']) || location.matches(['peerDependencies']))) {
            var queryUrl = void 0;
            if (currentWord.length > 0) {
                queryUrl = 'https://skimdb.npmjs.com/registry/_design/app/_view/browseAll?group_level=1&limit=' + LIMIT + '&start_key=%5B%22' + encodeURIComponent(currentWord) + '%22%5D&end_key=%5B%22' + encodeURIComponent(currentWord + 'z') + '%22,%7B%7D%5D';
                return this.xhr({
                    url: queryUrl
                }).then(function (success) {
                    if (success.status === 200) {
                        try {
                            var obj = JSON.parse(success.responseText);
                            if (obj && Array.isArray(obj.rows)) {
                                var results = obj.rows;
                                for (var i = 0; i < results.length; i++) {
                                    var keys = results[i].key;
                                    if (Array.isArray(keys) && keys.length > 0) {
                                        var name = keys[0];
                                        var insertText = new vscode_1.SnippetString().appendText(JSON.stringify(name));
                                        if (addValue) {
                                            insertText.appendText(': ').appendPlaceholder('*');
                                            if (!isLast) {
                                                insertText.appendText(',');
                                            }
                                        }
                                        var proposal = new vscode_1.CompletionItem(name);
                                        proposal.kind = vscode_1.CompletionItemKind.Property;
                                        proposal.insertText = insertText;
                                        proposal.filterText = JSON.stringify(name);
                                        proposal.documentation = '';
                                        collector.add(proposal);
                                    }
                                }
                                if (results.length === LIMIT) {
                                    collector.setAsIncomplete();
                                }
                            }
                        }
                        catch (e) {
                        }
                    }
                    else {
                        collector.error(localize(1, null, success.responseText));
                        return 0;
                    }
                }, function (error) {
                    collector.error(localize(2, null, error.responseText));
                    return 0;
                });
            }
            else {
                this.mostDependedOn.forEach(function (name) {
                    var insertText = new vscode_1.SnippetString().appendText(JSON.stringify(name));
                    if (addValue) {
                        insertText.appendText(': ').appendPlaceholder('*');
                        if (!isLast) {
                            insertText.appendText(',');
                        }
                    }
                    var proposal = new vscode_1.CompletionItem(name);
                    proposal.kind = vscode_1.CompletionItemKind.Property;
                    proposal.insertText = insertText;
                    proposal.filterText = JSON.stringify(name);
                    proposal.documentation = '';
                    collector.add(proposal);
                });
                collector.setAsIncomplete();
                return Promise.resolve(null);
            }
        }
        return null;
    };
    PackageJSONContribution.prototype.collectValueSuggestions = function (fileName, location, result) {
        if ((location.matches(['dependencies', '*']) || location.matches(['devDependencies', '*']) || location.matches(['optionalDependencies', '*']) || location.matches(['peerDependencies', '*']))) {
            var currentKey = location.path[location.path.length - 1];
            if (typeof currentKey === 'string') {
                var queryUrl = 'http://registry.npmjs.org/' + encodeURIComponent(currentKey).replace('%40', '@');
                return this.xhr({
                    url: queryUrl
                }).then(function (success) {
                    try {
                        var obj = JSON.parse(success.responseText);
                        var latest = obj && obj['dist-tags'] && obj['dist-tags']['latest'];
                        if (latest) {
                            var name = JSON.stringify(latest);
                            var proposal = new vscode_1.CompletionItem(name);
                            proposal.kind = vscode_1.CompletionItemKind.Property;
                            proposal.insertText = name;
                            proposal.documentation = localize(3, null);
                            result.add(proposal);
                            name = JSON.stringify('^' + latest);
                            proposal = new vscode_1.CompletionItem(name);
                            proposal.kind = vscode_1.CompletionItemKind.Property;
                            proposal.insertText = name;
                            proposal.documentation = localize(4, null);
                            result.add(proposal);
                            name = JSON.stringify('~' + latest);
                            proposal = new vscode_1.CompletionItem(name);
                            proposal.kind = vscode_1.CompletionItemKind.Property;
                            proposal.insertText = name;
                            proposal.documentation = localize(5, null);
                            result.add(proposal);
                        }
                    }
                    catch (e) {
                    }
                    return 0;
                }, function (error) {
                    return 0;
                });
            }
        }
        return null;
    };
    PackageJSONContribution.prototype.resolveSuggestion = function (item) {
        if (item.kind === vscode_1.CompletionItemKind.Property && item.documentation === '') {
            return this.getInfo(item.label).then(function (infos) {
                if (infos.length > 0) {
                    item.documentation = infos[0];
                    if (infos.length > 1) {
                        item.detail = infos[1];
                    }
                    return item;
                }
                return null;
            });
        }
        ;
        return null;
    };
    PackageJSONContribution.prototype.getInfo = function (pack) {
        var queryUrl = 'http://registry.npmjs.org/' + encodeURIComponent(pack).replace('%40', '@');
        return this.xhr({
            url: queryUrl
        }).then(function (success) {
            try {
                var obj = JSON.parse(success.responseText);
                if (obj) {
                    var result = [];
                    if (obj.description) {
                        result.push(obj.description);
                    }
                    var latest = obj && obj['dist-tags'] && obj['dist-tags']['latest'];
                    if (latest) {
                        result.push(localize(6, null, latest));
                    }
                    return result;
                }
            }
            catch (e) {
            }
            return [];
        }, function (error) {
            return [];
        });
    };
    PackageJSONContribution.prototype.getInfoContribution = function (fileName, location) {
        if ((location.matches(['dependencies', '*']) || location.matches(['devDependencies', '*']) || location.matches(['optionalDependencies', '*']) || location.matches(['peerDependencies', '*']))) {
            var pack = location.path[location.path.length - 1];
            if (typeof pack === 'string') {
                return this.getInfo(pack).then(function (infos) {
                    if (infos.length) {
                        return [infos.map(markedTextUtil_1.textToMarkedString).join('\n\n')];
                    }
                    return null;
                });
            }
        }
        return null;
    };
    return PackageJSONContribution;
}());
exports.PackageJSONContribution = PackageJSONContribution;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/ee428b0eead68bf0fb99ab5fdc4439be227b6281/extensions\javascript\out/features\packageJSONContribution.js.map
