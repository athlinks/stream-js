var request = require('request');
var StreamFeed = require('./feed');
var signing = require('./signing');
var errors = require('./errors');
var crypto = require('crypto');

var StreamClient = function () {
    this.initialize.apply(this, arguments);
};

StreamClient.prototype = {
	baseUrl: 'https://getstream.io',
	
    initialize: function (key, secret, fayeUrl) {
    	/*
    	 * API key and secret
    	 * Secret is optional
    	 */
    	this.key = key;
    	this.secret = secret;
        this.fayeUrl = fayeUrl ? fayeUrl : 'https://getstream.io/faye';
    },
    
    feed: function(feedId, token, siteId) {
    	/*
    	 * Returns a feed object for the given feed id and token
    	 * Example:
    	 * 
    	 * client.feed('user1', 'token2');
    	 */
    	var match = feedId.match(/\:/g);
    	if (match === null || match.length != 1) {
    		throw new errors.FeedError('Wrong feed format ' + feedId + ' correct format is flat:1');
    	}
    	
    	if (crypto.createHash && this.secret && !token) {
    		// we are server side, have a secret but no feed signature
    		token = signing.sign(this.secret, feedId.replace(':', ''));
    	}
    	
    	if (!token) {
    		throw new errors.FeedError('Missing token, in client side mode please provide a feed secret');
    	}
    	
    	var feed = new StreamFeed(this, feedId, token, siteId);
    	return feed;
    },

    enrichUrl: function(relativeUrl) {
    	var url = this.baseUrl + relativeUrl;
    	if (url.indexOf('?') != -1) {
    		url += '&api_key=' + this.key;
    	} else {
    		url += '?api_key=' + this.key;
    	}
    	return url;
    },
    
    enrichKwargs: function(kwargs) {
    	kwargs.url = this.enrichUrl(kwargs.url);
    	kwargs.json = true;
    	var secret = kwargs.secret || this.secret;
    	kwargs.headers = {};
    	kwargs.headers.Authorization = secret;
    	return kwargs;
    },
    /*
     * Shortcuts for post, get and delete HTTP methods
     */
    get: function(kwargs, cb) {
    	kwargs = this.enrichKwargs(kwargs);
    	kwargs.method = 'GET';
    	return request.get(kwargs, cb);
    },
    post: function(kwargs, cb) {
    	kwargs = this.enrichKwargs(kwargs);
    	kwargs.method = 'POST';
    	return request(kwargs, cb);
    },
    delete: function(kwargs, cb) {
    	kwargs = this.enrichKwargs(kwargs);
    	kwargs.method = 'DELETE';
    	return request(kwargs, cb);
    }
};

module.exports = StreamClient;