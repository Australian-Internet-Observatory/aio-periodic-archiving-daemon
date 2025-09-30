FROM python:3.9
LABEL MAINTAINER="AIO"


# Install PostgreSQL client tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# install dependencies
COPY requirements.txt /tmp
RUN python3 -m pip install --upgrade pip setuptools \
    && python3 -m pip install -r /tmp/requirements.txt

WORKDIR /app

COPY /lib /app