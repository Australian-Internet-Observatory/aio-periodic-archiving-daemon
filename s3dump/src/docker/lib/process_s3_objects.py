import boto3
import json
from datetime import datetime
import database_ingestion as db
import secret_manager

BUCKET = "browser-extension-payload-test"
FOLDER = "processed"
TIMESTAMP=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

TAGS = [
    {'Key': 'Project', 'Value': 'AIO'},
    {'Key': 'Environment', 'Value': 'Dev'},
    {'Key': 'Proccssedtime', 'Value': TIMESTAMP}
]

s3 = boto3.client("s3")

# add time stamp to the tag
def add_processed_tags(bucket, key, tags):
    s3.put_object_tagging(
            Bucket=bucket,
            Key=key,
            Tagging={
                'TagSet': tags
            }
        )
    print(f"Tags successfully added to bucket '{bucket}'.")

# Move the object to processed folder and add tags
def move_to_processed_folder(bucket, key):
    old_object_name=key.split('/')[-1] 
    new_key = f"processed/{old_object_name}_processed"
    s3.copy_object(Bucket=bucket, CopySource={"Bucket": bucket, "Key": key}, Key=new_key)
    s3.delete_object(Bucket=bucket, Key=key)
    print(f"Moved {key} to {new_key}")
    add_processed_tags(bucket, new_key, TAGS)

# process object
def process_object(bucket,key):
    try:
        # get the content of the file
        obj = s3.get_object(Bucket=BUCKET,Key=key)
        obj_data = json.loads(obj['Body'].read())
        print("Loaded Object data\n", obj_data)
    except Exception as e:
        print(f"Failed at load object data for {key}: {e}")
        return
        
    try:
        generated_id = db.copy_data_to_db(obj_data)
    except Exception as e:
        print(f"Failed at DB insert for {key}: {e}")
        return

    try:
        db.populate_audit_log(generated_id)
    except Exception as e:
        print(f"Failed at auditlog step {key}: {e}")
        return

    try:    
        # TODO: Re-enable the move to folder
        # move_to_processed_folder(bucket,key)
        pass
    except Exception as e:
        print(f"Failed at moving file to processed folder {key}: {e}")
        return
    
    print(f"\nSuccessfully processed {key}")

# list objects using paginator
def process_all_objects(bucket):
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            print(obj["Key"])
            print(f"Retriving S3 object with key: {key}")

            # skip all objects in processing folder
            if key.startswith("processed/"):
                print(f"Skipping already processed object: {key}")
                continue
            
            print("\nProcessing objects..\n")
            process_object(bucket, key)

if __name__ == "__main__":
    process_all_objects(BUCKET)