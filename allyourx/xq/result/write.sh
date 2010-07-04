rsync --recursive --delete --exclude=".svn" ../data/assets ./
java -classpath ../lib/saxon/saxon9.jar net.sf.saxon.Query ../data/design.xq
