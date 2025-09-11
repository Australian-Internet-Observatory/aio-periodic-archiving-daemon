NAME=s3dump

GIT_HASH=$(shell git rev-parse HEAD)

all: build run

build:
	docker build --pull -t ${NAME}:${GIT_HASH} .

run:
	docker run -it --rm \
	-v ${HOME}/.aws:/root/.aws \
	-e AWS_DEFAULT_PROFILE=qut \
	${NAME}:${GIT_HASH} python s3_task.py

run-db2:
	docker run -it -e PGPASSWORD=test12345678 ${NAME}:${GIT_HASH} psql \
	-h testbrowserext.cjpd8tzzheam.ap-southeast-2.rds.amazonaws.com \
	-U postgres \
	-d testbrowserext \
	-p 5432


ssh-db:
	ssh -i /Users/E129044/Downloads/psqljumpbox.pem -L 5432:testbrowserext.cjpd8tzzheam.ap-southeast-2.rds.amazonaws.com:5432 ec2-user@3.26.23.185

run-db:
	psql -h host.docker.internal -h testbrowserext.cjpd8tzzheam.ap-southeast-2.rds.amazonaws.com -U postgres -p 5432