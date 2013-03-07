#!/bin/sh
cd `dirname $0`
/home/mloar/opt/bin/node update.js
/home/mloar/opt/bin/node liquor.js
/home/mloar/opt/bin/node render.js
/usr/bin/s3cmd sync -P -m 'text/html' -M out/ s3://www.belltowncrime.com/
