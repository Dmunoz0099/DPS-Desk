 @echo off
  netsh advfirewall firewall add rule name="Allow ICMP" direction=in action=allow protocol=icmpv4
  netsh advfirewall firewall add rule name="Allow WebRTC UDP" dir=in action=allow protocol=UDP localport=49152-65535
  echo Firewall abierto
  pause