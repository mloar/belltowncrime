#!/bin/sh
cd `dirname $0`
node update.js
node liquor.js
node render.js
./node_modules/s3-cli/cli.js sync -P --region 'us-west-2' --default-mime-type 'text/html' out/ s3://www.belltowncrime.com/
./node_modules/s3-cli/cli.js put -P --region 'us-west-2' --default-mime-type 'text/css' main.css s3://www.belltowncrime.com/main.css
