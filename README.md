# homebridge-connectedbytcp
Home bridge Plugin for Connected by TCP

# Setting up your TCP Lights
Fixtures will be considered a single device in HomeKit - so if you wish to control
each light individually, do no group them into fixtures.  If you don't, go for it!

# Notes on the TCP API
* Parameter Order Matters:
1. cmd
2. data
3. fmt

## Working CURL:
```
curl -vvv -X POST -k -H "Content-Type: text/xml" -d "cmd=GWRLogin" -d "data=%3Cgip%3E%3Cversion%3E1%3C%2Fversion%3E%3Cemail%3Ea1be5ae8-fe17-4946-a0e2-346ef7082f51%3C%2Femail%3E%3Cpassword%3Ea1be5ae8-fe17-4946-a0e2-346ef7082f51%3C%2Fpassword%3E%3C%2Fgip%3E" -d "fmt=xml" "https://172.16.1.40/gwr/gop.php"
```