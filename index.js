var request = require("request"),
    uuid = require("node-uuid"),
    xml2js = require('xml2js'),
    Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerPlatform("homebridge-conntectedbytcp", "ConnectedByTcp", ConnectedByTcp);
};

function ConnectedByTcp(log, config) {
  this.log        = log;
  this.name       = config["name"];
  this.ip         = config["ip"];
  this.token      = config["token"];
  this.loglevel   = config["loglevel"];
  this.devices    = [];
  
  if(this.token === undefined) {
    this.log("Password not in config, attempting to sync hub: [" + this.ip + "]");
    this.syncHub();
  }
};

ConnectedByTcp.prototype = {
  accessories: function (callback) {
    var self = this;
    
    self.log("in accessories");
    self.search(function() { self.registerAccessories(callback) });
  },
  registerAccessories: function (callback) {
    var self = this;
    self.log("returning devices: " + self.devices);
    callback(self.devices);
  },
  syncHub: function() {
    // /gwr/gop.php?cmd=GWRLogin&data=<gip><version>1</version><email>[myuuid]</email><password>[myuuid]</password></gip>&fmt=xml
    var self = this,
        hubAddress = "https://" + this.ip + "/gwr/gop.php",
        loginUid = uuid.v4(),
        cmd="GWRLogin",
        data=encodeURIComponent("<gip><version>1</version><email>"+loginUid+"</email><password>"+loginUid+"</password></gip>"),
        fmt="xml";

    request({
      "rejectUnauthorized": false,
      "url": hubAddress,
      "method": "POST",
      headers: {
        'Content-Type': 'text/xml'
      },
      body: "cmd=" + cmd + "&data=" + data + "&fmt=xml"
    }, function(error, response, body) {
      if (error && error.code == "ECONNREFUSED") {
        self.log("Unabled to connect to IP, is this the right IP address for your hub?");
      } else if (error) {
        self.log("error.code: " + error.code);
        self.log("error.errno: " + error.errno);
        self.log("error.syscall: " + error.syscall);
      } else if(body == "<gip><version>1</version><rc>404</rc></gip>") {
        self.log("Hub is not in sync mode, set to sync mode an try again.");
      } else if(body.match(/.*<token>(.*)<\/token>.*/) !== null) {
        // Token Matches
        // <gip><version>1</version><rc>200</rc><token>e2de937chr0lhrlqd6bus3l2z5jcy5p3vs7013bn</token></gip>
        self.token = body.replace(/.*<token>(.*)<\/token>.*/,"$1");
        self.log("Hub is synced, update your config.json to include:");
        self.log("  token: " + self.token);
      } else {
        self.log("error: " + error);
        self.log("response: " + response);
        self.log("body: " + body);
      }
    });
  },
  search: function(searchCallback) {
    var self = this,
        hubAddress = "https://" + self.ip + "/gwr/gop.php",
        cmd="RoomGetCarousel",
        data=encodeURIComponent("<gip><version>1</version><token>" + self.token + "</token><fields>name\ncontrol\npower\nproduct\nclass\nrealtype\nstatus</fields></gip>"),
        fmt="xml";

    self.roomGetCarousel(function(result) {
      for (var i = 0; i < result.gip.room.length; i++) {
        for (var j = 0; j < result.gip.room[i].device.length; j++) {
          for (var k = 0; k < result.gip.room[i].device[j].did.length; k++) {
            var newDevice = new TcpLightbulb(
                              self,
                              self.log, 
                              result.gip.room[i].device[j].did[k],
                              result.gip.room[i].device[j].state[k],
                              result.gip.room[i].device[j].level[k]);
            
              self.devices.push(newDevice);
          }
        }
      }
      searchCallback();
    });
  },
  
  roomGetCarousel: function(callback) {
    var self = this,
        hubAddress = "https://" + self.ip + "/gwr/gop.php",
        cmd="RoomGetCarousel",
        data=encodeURIComponent("<gip><version>1</version><token>" + self.token + "</token><fields>name\ncontrol\npower\nproduct\nclass\nrealtype\nstatus</fields></gip>"),
        fmt="xml";

    request({
      "rejectUnauthorized": false,
      "url": hubAddress,
      "method": "POST",
      headers: {
        'Content-Type': 'text/xml'
      },
      body: "cmd=" + cmd + "&data=" + data + "&fmt=xml"
    }, function(error, response, body) {
      if (error && error.code == "ECONNREFUSED") {
        self.log("Unabled to connect to IP, is this the right IP address for your hub?");
      } else if (error) {
        self.log("error.code: " + error.code);
        self.log("error.errno: " + error.errno);
        self.log("error.syscall: " + error.syscall);
      } else if(body == "<gip><version>1</version><rc>404</rc></gip>") {
        self.log("Hub is not in sync mode, set to sync mode an try again.");
      } else {
        xml2js.parseString(body, function (err, result) {
          if(callback) {
	          callback(result);
	      }
        });
      }
    });
  
  },
  
  deviceUpdateStatus: function(tcpLightbulb, callback) {
    var self = this;
    
    self.roomGetCarousel(function(result) {
      if(self.loglevel >= 3) {
        self.log("deviceUpdateStatus: Calback from roomGetCarousel : [%s]", JSON.stringify(result));
      }
      for (var i = 0; i < result.gip.room.length; i++) {
        for (var j = 0; j < result.gip.room[i].device.length; j++) {
          for (var k = 0; k < result.gip.room[i].device[j].did.length; k++) {
            if(tcpLightbulb.deviceid == result.gip.room[i].device[j].did[k]) {
              if(self.loglevel >= 3) {
                self.log("deviceUpdateStatus: Updating bulb based on result [%s]",
                  JSON.stringify(result.gip.room[i].device[j]));
              }
                
              tcpLightbulb.state = result.gip.room[i].device[j].state[k];
              tcpLightbulb.level = result.gip.room[i].device[j].level[k];
          }
          }
        }
      }
      
      callback();
    });
  },
  
  deviceSendCommand: function(deviceid, statevalue) {
    var self = this,
        hubAddress = "https://" + self.ip + "/gwr/gop.php",
        cmd="DeviceSendCommand",
        unencodedData = "<gip><version>1</version><token>" + self.token + "</token><did>" + deviceid + "</did><value>" + statevalue + "</value></gip>",
        data=encodeURIComponent(unencodedData);
        fmt="xml",
        body="cmd=" + cmd + "&data=" + data + "&fmt=xml";

    if(self.loglevel >= 3) {
      self.log("Sending device request: %s", unencodedData);
    }        

    request({
      "rejectUnauthorized": false,
      "url": hubAddress,
      "method": "POST",
      headers: {
        'Content-Type': 'text/xml'
      },
      body: body
    }, function(error, response, body) {
      if (error && error.code == "ECONNREFUSED") {
        self.log("Unabled to connect to IP, is this the right IP address for your hub?");
      } else if (error) {
        self.log("error.code: " + error.code);
        self.log("error.errno: " + error.errno);
        self.log("error.syscall: " + error.syscall);
      } else if(body == "<gip><version>1</version><rc>404</rc></gip>") {
        self.log("Token is invalid, switch back to sync mode to try again.");
      } else {
        self.log("Parsing XML");
        xml2js.parseString(body, function (err, result) {
          self.log("Done parsing XML: " + JSON.stringify());
        });
        

        self.log("error: " + error);
        self.log("response: " + response);
        self.log("body: " + body);
      }
    });
  }
};

function TcpLightbulb(connectedByTcp, log, deviceid, state, level) {
  var self = this;
  
  self.connectedByTcp = connectedByTcp;
  self.log = log;
  self.name = "Bulb " + deviceid;
  self.deviceid = deviceid;
  self.state = state;
  self.level = level;  
  self.log("Creating Lightbulb with device id '%s' and state '%s'", self.deviceid, self.state);
};

TcpLightbulb.prototype = {
  getPowerOn: function(callback) {
    var self = this;
    
    self.log("getPowerOn: Power state for the '%s' is %s", self.name, self.state);
    self.connectedByTcp.deviceUpdateStatus(this, function() {
      callback(null, self.state > 0);  
    });
  },

  setPowerOn: function(powerOn, callback) {
    var self = this;

    self.log("Set power state on the '%s' to %s", self.name, powerOn);
    self.connectedByTcp.deviceSendCommand(self.deviceid, powerOn == true ? 1 : 0);
    callback(null);
  },

  getServices: function() {
    var lightbulbService = new Service.Lightbulb(this.name);
    
    lightbulbService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getPowerOn.bind(this))
      .on('set', this.setPowerOn.bind(this));
    
    return [lightbulbService];
  }
}
