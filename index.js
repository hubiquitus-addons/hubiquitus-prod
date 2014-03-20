var hubiquitus = require('hubiquitus-core');
var logger = hubiquitus.logger('hubiquitus:addons:prod');
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;

var conf = {
  maxmem: 1.5,
  interval: 10000,
  autoCrash: false,
  crashDelay: 0,
  enableEvents: true
};

var running = false;
var scheduledTick = null;

exports.__proto__ = new EventEmitter();

exports.configure = function (options) {
  options = options || {};
  if (_.isNumber(options.maxmem)) conf.maxmem = options.maxmem;
  if (_.isNumber(options.interval)) conf.interval = options.interval;
  if (_.isBoolean(options.autoCrash)) conf.autoCrash = options.autoCrash;
  if (_.isNumber(options.crashDelay)) conf.crashDelay = options.crashDelay;
  if (_.isBoolean(options.enableEvents)) conf.enableEvents = options.enableEvents;
};

exports.start = function () {
  if (running) return;
  logger.info('starting...', {conf: conf});
  running = true;
  (function tick() {
    var mem = process.memoryUsage().rss;
    if (mem > conf.maxmem * 1000000000) {
      logger.warn('max memory allowed (' + conf.maxmem + 'GB) exceeded');
      if (conf.enableEvents) exports.emit('memwarn', {max: conf.maxmem, current: mem});
      if (conf.autoCrash) crash();
    }
    running && (scheduledTick = setTimeout(tick, conf.interval));
  })();
};

exports.stop = function () {
  if (!running) return;
  logger.info('stopping...');
  running = false;
  scheduledTick && clearTimeout(scheduledTick);
};

function crash() {
  setTimeout(function () {
    process.exit(1);
  }, conf.crashDelay);
}
