#!/bin/sh
PATH=$PATH:/usr/local/bin
cd `dirname $0`
node update.js
node liquor.js
node render.js
/usr/bin/s3cmd sync -P -m 'text/html' out/ s3://www.belltowncrime.com/
