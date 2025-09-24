NAME=process_s3_objects

GIT_HASH=$(shell git rev-parse HEAD)


all: build run

build:
	docker build --pull -t ${NAME}:${GIT_HASH} .

run:
	docker run -it --rm \
	-v ${HOME}/.aws:/root/.aws \
	-e AWS_DEFAULT_PROFILE=qut \
	${NAME}:${GIT_HASH} python process_s3_objects.py

# ensure that you setup the .pem key path and the hostname
# ssh -i <path to .pem> -L 5432:<your database hostname>:5432 ec2-user@<jumpbox-ip>

ssh-db:
	ssh -i /Users/E129044/Downloads/psqljumpbox.pem -L 5432:testbrowserext.cjpd8tzzheam.ap-southeast-2.rds.amazonaws.com:5432 ec2-user@3.26.23.185

# run plsql scripts through CLI for debugging and testing
run-db:
	psql -h host.docker.internal -h testbrowserext.cjpd8tzzheam.ap-southeast-2.rds.amazonaws.com -U postgres -p 5432