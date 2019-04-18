var Service, Characteristic;
var request = require('request');
let exec = require('child_process').exec;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-broadlinkrm-samsungtv", "SamsungTVBroadlinkAccessory", SamsungTVBroadlinkAccessory);
}

function SamsungTVBroadlinkAccessory(log, config) {
  this.log = log;
  this.config = config;
  this.name = config["name"]
  this.authorization = config["authorization"] || "111-11-111"
  this.hostname = config["hostname"] || "SamsungTV"
  this.timeout = config["timeout"] || 2000

  this.service = new Service.Television(this.name);
  
  this.service
    .getCharacteristic(Characteristic.Active)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this));
  
  this.log("SamsungTVBroadlinkAccessory Initialized")
}

SamsungTVBroadlinkAccessory.prototype.getState = function(callback) {
  var that = this
  request("http://"+this.hostname+":8001/api/v2/", {timeout: this.timeout}, function(error, response, body) {
    if (error) {
      var readtimeout = (error.code === 'ETIMEDOUT')
      var connectiontimeout = (error.connect === true)
      that.log("Read Timeout: " + readtimeout)
      that.log("Connection Timeout: " + connectiontimeout)
      return callback(null, 0);
    }
    that.log("SamsungTVBroadlinkAccessory: Get State: ACTIVE");
    callback(null, 1);
  })
}

SamsungTVBroadlinkAccessory.prototype.setState = function(active, callback) {
    var that = this
    that.log("SamsungTVBroadlinkAccessory: Set State: " + active);
    that.log("Checking if already ACTIVE")
    const options = {
        url: 'http://localhost:51827/characteristics',
        headers: {
          'Authorization': this.authorization,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout,
        body: "{\"characteristics\":[{\"aid\":43,\"iid\":10,\"value\":true}]}"
    };
    request("http://"+this.hostname+":8001/api/v2/", {timeout: this.timeout}, function(error, response, body) {
      if (error) {
        var readtimeout = (error.code === 'ETIMEDOUT')
        var connectiontimeout = (error.connect === true)
        that.log("Read Timeout: " + readtimeout)
        that.log("Connection Timeout: " + connectiontimeout)
        if (active) {
          that.log("Sending POWER Command")
          request.put(options, function(error, response, body) {
            if (error) {
              that.log("error sending to homebridge")
            }
          })            
        }
        else {
          that.log("SamsungTVBroadlinkAccessory: Is already OFF");
        }
      }
      else {
        if (active) {
          that.log("SamsungTVBroadlinkAccessory: Is already ACTIVE");
        }
        else {
          that.log("Sending POWER Command")
          request.put(options, function(error, response, body) {
            if (error) {
              that.log("error sending to homebridge")
            }
          })            
        }
      }
      callback();
  })
}

SamsungTVBroadlinkAccessory.prototype.getServices = function() {
  return [this.service];
}