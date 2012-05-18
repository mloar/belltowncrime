#!/bin/sh
/opt/bin/node `dirname $0`/update.js
/opt/bin/node `dirname $0`/render.js
/usr/bin/s3cmd sync -P -m 'text/html' -M `dirname $0`/out/ s3://www.belltowncrime.com/
