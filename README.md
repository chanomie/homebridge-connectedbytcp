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

## DeviceSendCommand - On/Off

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

## DeviceSendCommand - Dimming

Sends a command to a device for the level (dimming) of the device.

Request:
```
POST
cmd:RoomGetCarousel
data:
<gip>
  <version>1</version>
  <token>e2de937chr0lhrlqd6bus3l2z5jcy5p3vs7013bq</token>
  <did>216518569934732173</did>
  <value>50</value>
  <type>level</type>
</gip>
```

Result:
```
<gip>
  <version>1</version>
  <rc>200</rc>
</gip>
```

## Get Scenes (SceneGetList)
Get a list of the configured scenes for you devices.

Request:
```
cmd:SceneGetList
fmt:xml
data:
<gip>
  <version>1</version>
  <token>e2de937chr0lhrlqd6bus3l2z5jcy5p3vs7013bq</token>
  <islocal>1</islocal>
</gip>
```

Example Response:
```
<gip>
  <version>1</version>
  <rc>200</rc>
  <enable>1</enable>
  <scene>
    <sid>1</sid>
    <active>1</active>
    <name>Home</name>
    <desc></desc>
    <order>0</order>
    <type>manualcustom</type>
    <icon>img/scene/on/home.png</icon>
  </scene>
  <scene>
    <sid>2</sid>
    <active>1</active><name>Away</name>
    <desc></desc>
    <order>1</order>
    <type>manualcustom</type>
    <icon>img/scene/on/away.png</icon>
  </scene>
</gip>
```

## Get Gateway Info (GatewayGetInfo)

Request:
```
cmd:GatewayGetInfo
fmt:xml
data:
<gip>
  <version>1</version>
  <token>e2de937chr0lhrlqd6bus3l2z5jcy5p3vs7013bq</token>
  <fwnew>1</fwnew>
</gip>
```

Example Response:
```
<gip>
  <version>1</version>
  <rc>200</rc>
  <gateway>
    <gid>138787592000000</gid>
    <online>1</online>
    <primary>1</primary>
    <fwversion>3.0.39</fwversion>
    <fwnew>3.0.39</fwnew>
    <mac>D4:A9:28:01:01:01</mac>
    <serial>16G1-1168-00000</serial>
    <lastreboot></lastreboot>
    <lastseen></lastseen>
    <lanip>172.16.1.40/24</lanip>
    <externalip></externalip>
    <gipserver>tcp.greenwavereality.com</gipserver>
  </gateway>
</gip>
```

## UserGetListDefaultRooms

Request:
```
cmd:UserGetListDefaultRooms
fmt:xml
data:
<gip>
  <version>1</version>
  <token>1234567890</token>
</gip>
```

Example Response:
```
<gip>
  <version>1</version>
  <rc>200</rc>
  <room>
    <id>1</id>
    <name>Other</name>
    <desc>Other</desc>
  </room>
  <room>
    <id>2</id>
    <name>Living Room</name>
    <desc>Living Room</desc>
  </room>
  <room>
    <id>3</id>
    <name>Bedroom</name>
    <desc>Bedroom</desc>
  </room>
  <room>
    <id>4</id>
    <name>Kitchen</name>
    <desc>Kitchen</desc>
  </room>
  <room>
    <id>5</id>
    <name>Dining Room</name>
    <desc>Dining Room</desc>
  </room>
  <room>
    <id>6</id>
    <name>Family Room</name>
    <desc>Family Room</desc>
  </room>
  <room>
    <id>7</id>
    <name>Bathroom</name>
    <desc>Bathroom</desc>
  </room>
  <room>
    <id>8</id>
    <name>Garage</name>
    <desc>Garage</desc>
  </room>
  <room>
    <id>9</id>
    <name>Laundry Room</name>
    <desc>Laundry Room</desc>
  </room>
  <room>
    <id>10</id>
    <name>Utility Room</name>
    <desc>Utility Room</desc>
  </room>
  <room>
    <id>11</id>
    <name>Office</name>
    <desc>Office</desc>
  </room>
  <room>
    <id>12</id>
    <name>Hallway / Stairway</name>
    <desc>Hallway / Stairway</desc>
  </room>
  <room>
    <id>13</id>
    <name>Exterior</name>
    <desc>Exterior</desc>
  </room>
</gip>
```

## UserGetListDefaultColors

Request:
```
cmd:UserGetListDefaultColors
fmt:xml
data:
<gip>
  <version>1</version>
  <token>1234567890</token>
</gip>
```

Example Response:
```
<gip>
  <version>1</version>
  <rc>200</rc>
  <color>
    <id>0</id>
    <name>Black</name>
    <value>000000</value>
  </color>
  <color>
    <id>1</id>
    <name>Green</name>
    <value>00bd1f</value>
  </color>
  <color>
    <id>2</id>
    <name>Blue</name>
    <value>004fd9</value>
  </color>
  <color>
    <id>3</id>
    <name>Red</name>
    <value>e30000</value>
  </color>
  <color>
    <id>4</id>
    <name>Yellow</name>
    <value>dde500</value>
  </color>
  <color>
    <id>5</id>
    <name>Purple</name>
    <value>845fcf</value>
  </color>
  <color>
    <id>6</id>
    <name>Orange</name>
    <value>fa8a00</value>
  </color>
  <color>
    <id>7</id>
    <name>Aqua</name>
    <value>4bc3de</value>
  </color>
  <color>
    <id>8</id>
    <name>Pink</name>
    <value>ff59b7</value>
  </color>
  <color>
    <id>9</id>
    <name>White</name>
    <value>ffffff</value>
  </color>
</gip>
```

## Batch Commands (GWRBatch)
Runs a batch of commands against the hub.

Request:
```
cmd:GWRBatch
fmt:xml
data:
<gwrcmds>
  <gwrcmd>
    <gcmd>SceneGetList</gcmd>
    <gdata>
      <gip>
        <version>1</version>
        <token>1234567890</token>
        <islocal>1</islocal>
      </gip>
    </gdata>
  </gwrcmd>
</gwrcmds>
```

Example Response:
```
<gwrcmds>
  <gwrcmd>
    <gcmd>SceneGetList</gcmd>
    <gdata>
      <gip>
        <version>1</version>
        <rc>200</rc>
        <enable>1</enable>
        <scene>
          <sid>1</sid>
          <active>1</active>
          <name>Home</name>
          <desc></desc>
          <order>0</order>
          <type>manualcustom</type>
          <icon>img/scene/on/home.png</icon>
        </scene>
        <scene>
          <sid>2</sid>
          <active>1</active>
          <name>Away</name>
          <desc></desc>
          <order>1</order>
          <type>manualcustom</type>
          <icon>img/scene/on/away.png</icon>
        </scene>
      </gip>
    </gdata>
  </gwrcmd>
</gwrcmds>
``` 

# Thanks

Thanks to (stockmopar) who figured out security when TCP added the token that required
syncing the hub.  This article was vital in getting me back in business:
http://home.stockmopar.com/updated-connected-by-tcp-api/