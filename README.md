# homebridge-connectedbytcp
Home bridge Plugin for Connected by TCP

# Setting up your TCP Lights
Fixtures are ignored - is explose each as an individual bulb.

# Installation
 * Install homebridge using: npm install -g homebridge
 * Install this plugin using: npm install -g homebridge-connectedbytcp
 * Update your configuration file. See the sample below.

# Configuration

You will need to have a static IP address assigned to your hub reachable by homebridge.
If possible you can use your router and the MAC address of the device to consistently
assign a static IP that can be referenced in the configuration.

You will initially need to run by putting the hub into sync mode and not including
the token in the config.  When you run this way, the plugin will request a token
a log it into your configure like so:

```
Hub is synced, update your config.json to include:
  token: e2de937chr0lhrlqd6bus3l2z5jcy5p3vs7013bq
```

Afterwards, add the token to your config and restart homebridge.

```
    "platforms": [
       {
         "platform": "ConnectedByTcp",
         "name": "ConnectedByTcp",
         "ip": "172.16.1.40",
         "loglevel":"3"         
       }
    ],
```

# TCP Connected API

General documentation on what I have discovered about the TCP Connected API.

## Notes on the TCP API
* Parameter Order Matters:
1. cmd
2. data
3. fmt - always pass "fmt=xml" as the only supported option.

## GWRLogin

This is required to create a token that can be used for subsequent calls to the hub.
The hub needs to be placed in sync-mode, and then this call should be made passing in
a GUID as the email and the password.

Request:
```
POST
cmd:GWRLogin
data:
<gip>
  <version>1</version>
  <email>a1be5ae8-fe17-4946-a0e2-346ef7082f51</email>
  <password>a1be5ae8-fe17-4946-a0e2-346ef7082f51</password>
</gip>
```

Response:
```
<gip>
   <version>1</version>
   <rc>200</rc>
   <token>e2de937chr0lhrlqd6bus3l2z5jcy5p3vs7013bq</token>
</gip>
```

### Working CURL:
```
curl -vvv -X POST -k -H "Content-Type: text/xml" -d "cmd=GWRLogin" -d "data=%3Cgip%3E%3Cversion%3E1%3C%2Fversion%3E%3Cemail%3Ea1be5ae8-fe17-4946-a0e2-346ef7082f51%3C%2Femail%3E%3Cpassword%3Ea1be5ae8-fe17-4946-a0e2-346ef7082f51%3C%2Fpassword%3E%3C%2Fgip%3E" -d "fmt=xml" "https://172.16.1.40/gwr/gop.php"
```

## RoomGetCarousel

Returns a list of all of the rooms and devices inside of each individual room.  The list
of fields is carriage-return (\n) delimited in the string which will then get URL encoded
in the message send (%0A).

Request:
```
POST
cmd:RoomGetCarousel
data:
<gip>
  <version>1</version>
  <token>e2de937chr0lhrlqd6bus3l2z5jcy5p3vs7013bq</token>
  <fields>name
          control
          power
          product
          class
          realtype
          status
  </fields>
</gip>
```

Reponse:
```
<gip>
  <version>1</version>
  <rc>200</rc>
  <room>
    <rid>2</rid>
    <name>Bedroom</name>
    <desc></desc>
    <known>1</known>
    <type>0</type>
    <color>004fd9</color>
    <colorid>2</colorid>
    <img>images/blue.png</img>
    <power>0</power>
    <poweravg>0</poweravg>
    <energy>0</energy>
    <device>
      <did>216518569934732173</did>
      <known>1</known>
      <lock>0</lock>
      <state>1</state>
      <level>100</level>
    </device>
    <device>
      <did>216518569935837586</did>
      <known>1</known>
      <lock>0</lock>
      <state>1</state>
      <level>100</level>
    </device>
  </room>
</gip>
```

## DeviceSendCommand

Sends a command to a device, such as turning the lights on/off.

Request:
```
POST
cmd:RoomGetCarousel
data:
<gip>
  <version>1</version>
  <token>e2de937chr0lhrlqd6bus3l2z5jcy5p3vs7013bq</token>
  <did>216518569934732173</did>
  <value>1</value>
</gip>
```

Result:
```
<gip>
  <version>1</version>
  <rc>200</rc>
</gip>
```