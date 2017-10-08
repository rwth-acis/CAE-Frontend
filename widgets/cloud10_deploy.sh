grunt --host=http://cloud10.dbis.rwth-aachen.de:8085/cae --caehost=http://cloud10.dbis.rwth-aachen.de:8082 --yjsserver=http://cloud10.dbis.rwth-aachen.de:8083

#Set url in /widgets/src/liveCodeEditorWidget/lib/config.js

echo COPY TO cloud10
scp -r dist/** cae@cloud10.dbis.rwth-aachen.de:./web