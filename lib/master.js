'use strict';
var util = require('util');
var net = require('net');

var IPHash = require('./ip-hash');
var headerParse = require('./header-parser').parse;
var debug = require('debug')('sticky-listen:master');
module.exports = Master;
var TCP_DELIMITER = '\r\n';
util.inherits(Master, net.Server);
function Master(options) {
    if (!options || typeof options.activeWorkers !== 'function') {
        throw new TypeError('Must provide activeWorkers option (returns a list of worker processes)');
    }
    debug(options);
    net.Server.call(this, {
        pauseOnConnect: true
    }, this.balance);
    this.workers = options.activeWorkers;
    this.retryDelay = options.retryDelay || 150;
    this.maxRetries = options.maxRetries || 5;
    this.behindProxy = options.behindProxy || false;
    if (options.strategy) {
        this.strategy = options.strategy;
    }
    this.hasher = new IPHash();
    this.handleData = mkDataHandler(this);
}

Master.prototype.balance = function balance(socket) {
  var self = this;
  debug('balance', this.behindProxy);
  if (this.behindProxy) {
    var buffers = [];
    socket.resume();
    return socket.on('data', function(data) {
      buffers.push(data);
      var datas = Buffer.concat(buffers);

      if (datas.toString('utf8').indexOf(TCP_DELIMITER) >= 0) {    
        return self.handleData.call(socket, datas);
      }
    });
  }
  var hash = this.hasher.hashString(socket.remoteAddress || '127.0.0.1');
  this.delegate(hash, socket, null, 0);
};

function mkDataHandler(master) {
  return function(data) {
    this.pause();
    var ip;
    var pos = headerParse(data), hash;
    if (!pos) {
      ip = this.remoteAddress || '127.0.0.1';
    } else {
      ip = pos;
    }
    hash = master.hasher.hashString(ip);
    debug('hash is %s fro ip %s', hash, ip);
    master.delegate(hash, this, data, 0);
  };
}

Master.prototype.delegate = function delegate(hash, socket, data, retry) {
  var workers = this.workers();
  var responsibleWorker = workers[hash % workers.length];
  if (responsibleWorker == null) {
    var retryCount = retry + 1;
    if (retryCount < this.maxRetries) {
      setTimeout(delegate.bind(this, hash, socket, data, retryCount), this.retryDelay);
    } else {
      socket.end('HTTP/1.0 502 Bad Gateway\n\n');
    }
  } else {
    if (data != null) {
      data = data.toString('binary');
  }
    responsibleWorker.send({msg: 'sticky:balance', payload: data}, socket);
  }
};
