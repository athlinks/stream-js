var fetch = require('@stream-io/cross-fetch');

var Headers = require('@stream-io/cross-fetch').Headers;

var utils = require('./utils');

var FormData = require('form-data');

var errors = require('./errors');

var StreamFileStore = function StreamFileStore() {
  this.initialize.apply(this, arguments);
};

StreamFileStore.prototype = {
  initialize: function initialize(client, token) {
    this.client = client;
    this.token = token;
  },
  // React Native does not auto-detect MIME type, you need to pass that via contentType
  // param. If you don't then Android will refuse to perform the upload
  upload: function upload(uri, name, contentType) {
    var data = new FormData();
    var fileField;

    if (utils.isReadableStream(uri)) {
      fileField = uri;
    } else {
      fileField = {
        uri: uri,
        name: name || uri.split('/').reverse()[0]
      };

      if (contentType != null) {
        fileField.type = contentType;
      }
    }

    data.append('file', fileField);
    return fetch("".concat(this.client.enrichUrl('files/'), "?api_key=").concat(this.client.apiKey), {
      method: 'post',
      body: data,
      headers: new Headers({
        Authorization: this.token
      })
    }).then(function (r) {
      if (r.ok) {
        return r.json();
      } // error


      return r.text().then(function (responseData) {
        r.statusCode = r.status;

        try {
          responseData = JSON.parse(responseData);
        } catch (e) {// ignore json parsing errors
        }

        throw new errors.StreamApiError(JSON.stringify(responseData) + ' with HTTP status code ' + r.status, responseData, r);
      });
    });
  },
  delete: function _delete(uri) {
    return this.client.delete({
      url: "files/",
      qs: {
        url: uri
      },
      signature: this.token
    });
  }
};
module.exports = StreamFileStore;