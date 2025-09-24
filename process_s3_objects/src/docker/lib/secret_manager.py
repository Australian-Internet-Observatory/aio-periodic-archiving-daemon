import boto3
from botocore.exceptions import ClientError
import base64
import logging
import json
import os

# AUTOMATION_ACCOUNT_SECRET_TEST = 'dev-cilogon'
# AUTOMATION_ACCOUNT_SECRET_PRD
REGION_NAME = 'ap-southeast-2'

AUTOMATION_ACCOUNT_SECRET_TEST = os.getenv('AUTOMATION_ACCOUNT_SECRET_TEST')
# AUTOMATION_ACCOUNT_SECRET_PRD = os.getenv('AUTOMATION_ACCOUNT_SECRET_PRD') 
REGION_NAME = os.getenv('REGION_NAME')

def get_secret_by_name(secret_name):

    secret = None
    decoded_binary_secret = None

    # Create a Secrets Manager client
    client=boto3.client(
        'secretsmanager',
        region_name=REGION_NAME
    )

    # In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
    # See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    # We rethrow the exception by default.

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'DecryptionFailureException':
            # Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InternalServiceErrorException':
            # An error occurred on the server side.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InvalidParameterException':
            # You provided an invalid value for a parameter.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InvalidRequestException':
            # You provided a parameter value that is not valid for the current state of the resource.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'ResourceNotFoundException':
            # We can't find the resource that you asked for.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
    else:
        if 'SecretString' in get_secret_value_response:
            secret = get_secret_value_response['SecretString']
        else:
            # Decrypts secret using the associated KMS CMK.
            # Depending on whether the secret is a string or binary, one of these fields will be populated.
            decoded_binary_secret = base64.b64decode(get_secret_value_response['SecretBinary'])
    response = json.loads(secret)
    return response



class secret_manager:
    
    @staticmethod
    def get_secret():
        """
        Get the secret from AWS Secrets Manager.
        """
        return get_secret_by_name(AUTOMATION_ACCOUNT_SECRET_TEST)

    @staticmethod
    def get_prd_secret():
        """
        Get the secret from AWS Secrets Manager.
        """
        return get_secret_by_name(AUTOMATION_ACCOUNT_SECRET_PRD)

if __name__ == "__main__":
    # Test the secret manager
    secret = secret_manager.get_secret()
    print(secret)
    print(secret['cilogon_client_id'])
    print(secret['cilogon_client_secret'])