'''
	This AWS Lambda function is responsible for the following aspects of cloud functionality:

		* Demographic Data Collection

		* Pushing data donations to the data donation processing bucket
'''
import io
import sys
import uuid
import json
import time
import boto3
import random
from openpyxl import Workbook

if (__name__ == "__main__"): import ipdb

SECRET_KEY = "open_sesame_123" # TODO - replace with an environment variable

AWS_S3 = boto3.resource("s3")
AWS_S3_CLIENT = boto3.client("s3")

CONFIG = json.loads(open(os.path.join(os.getcwd(), "config.json")))


'''
	This function determines the contents of a subbucket within an S3 bucket
'''
def subbucket_contents(kwargs, search_criteria="CommonPrefixes"):
	results = list()
	if (search_criteria == "CommonPrefixes"):
		results = [x for x in [prefix if (prefix is None) else prefix.get("Prefix") 
			for prefix in AWS_S3_CLIENT.get_paginator("list_objects_v2").paginate(
				**{**{"Delimiter" : "/"}, **kwargs}).search("CommonPrefixes")] if (x is not None)]
	else:
		try:
			for batch_obj in [x for x in AWS_S3_CLIENT.get_paginator("list_objects_v2").paginate(**{**{"Delimiter" : "/"}, **kwargs})]:
				for key_obj in batch_obj["Contents"]:
					results.append(key_obj["Key"])
		except:
			pass
			# Bucket is probably empty
	return results

'''
	This function generates a presigned URL
'''

def generate_presigned_url(bucket, key, expiry_seconds=3600, aws_region=None):
	s3_client = boto3.client("s3", region_name=aws_region)
	return s3_client.generate_presigned_url(
		"get_object",
		Params={"Bucket": bucket, "Key": key},
		ExpiresIn=expiry_seconds,
	)

'''
	This function runs a safe 'get' over a dict path
'''
def get(x,y):
	v = x
	try: 
		for z in y: v = v[z]
	except: v = None
	return v


'''
	This function generates a demographic ID, that is then associated with a demographic participant
'''
def demographic_id(this_uuid): return f'entries/{this_uuid}/registration_object.json'

'''
	This function reads a demographic entry from the demographic bucket
'''
def demographic_entry_read(this_uuid):
	return json.loads(AWS_S3.Object(CONFIG["s3_demographic_data_bucket"], demographic_id(this_uuid)).get()['Body'].read())

'''
	This function writes a demographic entry to the demographic bucket
'''
def demographic_entry_add(this_registration_object):
	AWS_S3.Object(CONFIG["s3_demographic_data_bucket"], demographic_id(this_registration_object["uuid"])).put(Body=json.dumps(this_registration_object, indent=3))

'''
	This function registers a participant
'''
def demographic_register(event, context):
	output = dict()
	try:
		demographic_entry_add(event["registrationObject"] | {
				"created_at" : int(time.time())
			})
		output["registrationSuccess"] = True
	except:
		print(traceback.format_exc())
		output["registrationSuccess"] = False
	return output

'''
	This function compiles an Excel spreadsheet, containing the details of all participants
'''

def demographic_report(event, context):
	output = dict()
	if (event["secret_key"] == SECRET_KEY):
		# Read in all participants' details
		participant_details = list()
		for entry in subbucket_contents({"Bucket" : CONFIG["s3_demographic_data_bucket"], "Prefix" : "entries/"}):
			_, participant_uuid, _ = entry.split("/")
			participant_details.append(demographic_entry_read(participant_uuid))
		# Restructure into a 'flat' format
		participant_details_flat = list()
		for this_participant_detail in participant_details:
			participant_details_flat.append({
					CONFIG["demographic_details"]["mappings"][k]["name"] : get(this_participant_detail, CONFIG["demographic_details"]["mappings"][k]["path"])
				for k in CONFIG["demographic_details"]["mappings"]})
		# Export to an Excel format, and push to the bucket
		wb = Workbook()
		ws = wb.active
		headers = [CONFIG["demographic_details"]["mappings"][k]["name"] for k in CONFIG["demographic_details"]["orderings"]]
		ws.append(headers)
		for row in participant_details_flat: ws.append([row.get(h) for h in headers])
		buf = io.BytesIO()
		wb.save(buf)
		buf.seek(0)
		report_key = f"reports/report.{int(time.time())}.xlsx"
		AWS_S3.Object(CONFIG["s3_demographic_data_bucket"], report_key).put(
			Body=buf.getvalue(), ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		# Generate a presigned link URL for the results
		output["link_url"] = generate_presigned_url(CONFIG["s3_demographic_data_bucket"], report_key, expiry_seconds=3600, aws_region="ap-southeast-2")
	else:
		output["error"] = "INCORRECT_SECRET_KEY"
	return output


processes = {
		"register" : demographic_register,
		"report" : demographic_report

def lambda_handler(event, context):
	event_body = event if (not "body" in event) else json.loads(event["body"])

	response_obj = { 'statusCode': 200, 'body': dict() }

	if (("action" in event_body) and (event_body["action"] in processes)):
		response_obj["body"] |= processes[event_body["action"]](event_body, context)
	else:
		# Data donation capture event
		AWS_S3.Object(CONFIG["s3_data_donation_bucket"], str(uuid.uuid4())).put(Body=json.dumps(json.loads(event["body"]), indent=3))

	response_obj["body"] = json.dumps(response_obj["body"])

	return response_obj

def demographic_report_local():
	print(json.loads(lambda_handler({
			"action" : "report", 
			"secret_key" : SECRET_KEY
		}, None)["body"])["link_url"])

def demographic_register_simulation():
	print(json.dumps(lambda_handler({
			"action" : "register", 
			"registrationObject" : {
			    "uuid": str(uuid.uuid4()),
			    "version" : "1.0.0.0",
			    "demographic_details": {
			        "age": random.randint(18,120),
			        "gender": random.choice(["male", "female", "non-binary", "prefer-not-to-say", "other"]),
			        "postcode": random.randint(1000,9999),
			        "political_preference": random.choice(["alp", "liberal", "nationals", "greens", "one-nation", "uap", "independent", "other", "prefer-not-to-say"]),
			        "income_bracket": random.choice(["lt-30k", "30-50k", "50-75k", "75-100k", "100-150k", "150-200k", "200k-plus", "prefer-not-to-say"]),
			        "education_level": random.choice(["no-formal", "year10", "year12", "cert-i-iv", "diploma", "adv-diploma-assoc-degree", "bachelor", "grad-cert-dip", "masters", "doctorate"])
			    }
			}
		}, None), indent=3))

processes_local = {
		"register_simulation" : demographic_register_simulation,
		"report" : demographic_report_local
	}



if (__name__ == "__main__"):
	processes_local[sys.argv[1]]()


