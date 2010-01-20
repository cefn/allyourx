#!/bin/sh
rsync --verbose --recursive --compress -e ssh --rsync-path=/home/admin/bin/rsync ./ admin@everyaction.com@everyaction.com:/var/www/html/allyourx.org/
