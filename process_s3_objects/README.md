# S3 to PostgreSQL data injestion

This project contains a Python script and associated files to process JSON objects from an AWS S3 bucket, ingest the data into a PostgreSQL database, and manage the processed objects within S3.

## Overview

The core of this project is the `process_s3_objects.py` script. This script connects to a specified S3 bucket, iterates through each object (JSON file), extracts relevant data, and then inserts that data into a PostgreSQL database. It also handles moving the processed files to a separate "_processed_" folder in the S3 bucket and adds a timestamped tag for tracking.

The project uses the following key components:

- `process_s3_objects.py:` The main script that orchestrates the data ingestion workflow. It connects to S3, retrieves objects, calls functions to handle data extraction and database insertion, and manages file movement within the S3 bucket.


- `database_ingestion.py:` This script contains the functions responsible for connecting to the PostgreSQL database and performing the data extraction and insertion operations. It uses secrets manager service to retrive database credentials.


- `secret_manager.py:`: A utility for securely retrieving secrets (like database credentials) from AWS Secrets Manager.


- `Dockerfile:` Defines the environment for the application, including installing necessary dependencies like boto3 and the PostgreSQL client.


- `requirements.txt:` Lists the Python libraries required for the project, such as boto3, awscli, botocore, and psycopg2-binary.


- `Makefile:` Provides convenient commands for building the Docker image and running the script.


- `table_creation.sql:` Contains the SQL commands for creating the necessary tables in the PostgreSQL database

## Dependencies:

The project relies on the python packages outlined in `requirement.txt`


## Setup and Usage:

1. ### Database setup
   Before running the script, you must set up the PostgreSQL database and create the required tables.

> [!IMPORTANT]
> Created a PostgreSQL on AWS: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html
   
   Use the SQL commands in `table_creation.sql` to `create the object_dump` and `object_dump_time_stamp` tables. The `uuid-ossp` extension is used to generate UUIDs for the primary keys.

2. ### AWS configuration (for local testing)
   To run the application locally on docker, the application requires access to AWS services, specifically S3 and Secrets Manager. Configure your AWS credentials and region, ensuring they are accessible to the Docker container. This can be done by mounting your local `.aws` directory.
   The `secret_manager.py` script is configured to retrieve secrets from AWS Secrets Manager using the region ap-southeast-2 and a test secret named `dev-cilogon`.

   Since the database is running on AWS RDS in a private subnet, the Docker container cannot connect to it directly. The project uses an SSH tunnel to securely forward traffic from your local machine to the remote database.
   
   Before running the ingestion process, you must open the SSH tunnel by running the following command from the `Makefile` in a separate terminal:

   ``` bash
   make ssh-db
   ```

   This command connects to the jump box `(3.26.23.185)` and forwards a local port `(5432)` on your host machine to the remote AWS RDS instance` (testbrowserext.cjpd8tzzheam.ap-southeast-2.rds.amazonaws.com)`.
   The `database_ingestion.py` script is already configured to connect to the database via this tunnel. It uses `host="host.docker.internal"` which directs the connection to the local forwarded port, which in turn routes the request to the remote database. 

> [!NOTE]
> If you are setting up a new environment from scratch, you will need to change the hardcoded values for the `secret_name`, `jump box IP`, `RDS endpoint`, and `SSH key path` in the Makefile and database_ingestion.py files to match your new AWS environment.

3. ### Running with Docker:
   
   The project includes a `Makefile` to simplify building and running the application within a Docker container.
   - #### Build the Docker image: 
  This command builds a Docker image named `process_s3_object`s using the `Dockerfile`.

  ``` bash
  make build
  ```

  - #### Run the data injestion script:
  
  This command runs the `process_s3_objects.py` script inside the Docker container. It mounts your local AWS credentials and sets the `AWS_DEFAULT_PROFILE` environment variable. The script will connect to the S3 bucket specified by the `BUCKET` variable in `process_s3_objects.py` and begin processing files. Processed files will be moved to a `processed/` folder within the same bucket.
``` bash
make run
```

4. #### Database Connection
   The `database_ingestion.py` script connects to the PostgreSQL database using the host `host.docker.internal`. This is a Docker-specific hostname that allows the container to connect to the host machine's network, which is useful for development purposes. For deployment in other environments like ECS, the host would need to be changed.
