/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var vscode_languageserver_1 = require('vscode-languageserver');
var vscode_css_languageservice_1 = require('vscode-css-languageservice');
var languageModelCache_1 = require('./languageModelCache');
var ColorSymbolRequest;
(function (ColorSymbolRequest) {
    ColorSymbolRequest.type = { get method() { return 'css/colorSymbols'; }, _: null };
})(ColorSymbolRequest || (ColorSymbolRequest = {}));
// Create a connection for the server.
var connection = vscode_languageserver_1.createConnection();
console.log = connection.console.log.bind(connection.console);
console.error = connection.console.error.bind(connection.console);
// Create a simple text document manager. The text document manager
// supports full document sync only
var documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
var stylesheets = languageModelCache_1.getLanguageModelCache(10, 60, function (document) { return getLanguageService(document).parseStylesheet(document); });
documents.onDidClose(function (e) {
    stylesheets.onDocumentRemoved(e.document);
});
connection.onShutdown(function () {
    stylesheets.dispose();
});
// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities.
connection.onInitialize(function (params) {
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind,
            completionProvider: { resolveProvider: false },
            hoverProvider: true,
            documentSymbolProvider: true,
            referencesProvider: true,
            definitionProvider: true,
            documentHighlightProvider: true,
            codeActionProvider: true,
            renameProvider: true
        }
    };
});
var languageServices = {
    css: vscode_css_languageservice_1.getCSSLanguageService(),
    scss: vscode_css_languageservice_1.getSCSSLanguageService(),
    less: vscode_css_languageservice_1.getLESSLanguageService()
};
function getLanguageService(document) {
    var service = languageServices[document.languageId];
    if (!service) {
        connection.console.log('Document type is ' + document.languageId + ', using css instead.');
        service = languageServices['css'];
    }
    return service;
}
// The settings have changed. Is send on server activation as well.
connection.onDidChangeConfiguration(function (change) {
    updateConfiguration(change.settings);
});
function updateConfiguration(settings) {
    for (var languageId in languageServices) {
        languageServices[languageId].configure(settings[languageId]);
    }
    // Revalidate any open text documents
    documents.all().forEach(triggerValidation);
}
var pendingValidationRequests = {};
var validationDelayMs = 200;
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(function (change) {
    triggerValidation(change.document);
});
// a document has closed: clear all diagnostics
documents.onDidClose(function (event) {
    cleanPendingValidation(event.document);
    connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});
function cleanPendingValidation(textDocument) {
    var request = pendingValidationRequests[textDocument.uri];
    if (request) {
        clearTimeout(request);
        delete pendingValidationRequests[textDocument.uri];
    }
}
function triggerValidation(textDocument) {
    cleanPendingValidation(textDocument);
    pendingValidationRequests[textDocument.uri] = setTimeout(function () {
        delete pendingValidationRequests[textDocument.uri];
        validateTextDocument(textDocument);
    }, validationDelayMs);
}
function validateTextDocument(textDocument) {
    var stylesheet = stylesheets.get(textDocument);
    var diagnostics = getLanguageService(textDocument).doValidation(textDocument, stylesheet);
    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: diagnostics });
}
connection.onCompletion(function (textDocumentPosition) {
    var document = documents.get(textDocumentPosition.textDocument.uri);
    var stylesheet = stylesheets.get(document);
    return getLanguageService(document).doComplete(document, textDocumentPosition.position, stylesheet);
});
connection.onHover(function (textDocumentPosition) {
    var document = documents.get(textDocumentPosition.textDocument.uri);
    var styleSheet = stylesheets.get(document);
    return getLanguageService(document).doHover(document, textDocumentPosition.position, styleSheet);
});
connection.onDocumentSymbol(function (documentSymbolParams) {
    var document = documents.get(documentSymbolParams.textDocument.uri);
    var stylesheet = stylesheets.get(document);
    return getLanguageService(document).findDocumentSymbols(document, stylesheet);
});
connection.onDefinition(function (documentSymbolParams) {
    var document = documents.get(documentSymbolParams.textDocument.uri);
    var stylesheet = stylesheets.get(document);
    return getLanguageService(document).findDefinition(document, documentSymbolParams.position, stylesheet);
});
connection.onDocumentHighlight(function (documentSymbolParams) {
    var document = documents.get(documentSymbolParams.textDocument.uri);
    var stylesheet = stylesheets.get(document);
    return getLanguageService(document).findDocumentHighlights(document, documentSymbolParams.position, stylesheet);
});
connection.onReferences(function (referenceParams) {
    var document = documents.get(referenceParams.textDocument.uri);
    var stylesheet = stylesheets.get(document);
    return getLanguageService(document).findReferences(document, referenceParams.position, stylesheet);
});
connection.onCodeAction(function (codeActionParams) {
    var document = documents.get(codeActionParams.textDocument.uri);
    var stylesheet = stylesheets.get(document);
    return getLanguageService(document).doCodeActions(document, codeActionParams.range, codeActionParams.context, stylesheet);
});
connection.onRequest(ColorSymbolRequest.type, function (uri) {
    var document = documents.get(uri);
    if (document) {
        var stylesheet = stylesheets.get(document);
        return getLanguageService(document).findColorSymbols(document, stylesheet);
    }
    return [];
});
connection.onRenameRequest(function (renameParameters) {
    var document = documents.get(renameParameters.textDocument.uri);
    var stylesheet = stylesheets.get(document);
    return getLanguageService(document).doRename(document, renameParameters.position, renameParameters.newName, stylesheet);
});
// Listen on the connection
connection.listen();
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/ee428b0eead68bf0fb99ab5fdc4439be227b6281/extensions\css\server\out/cssServerMain.js.map
