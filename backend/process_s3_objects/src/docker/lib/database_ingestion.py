import psycopg2
import secret_manager

secret_name="dev-cilogon"
secrets = secret_manager.get_secret_by_name(secret_name)

secrets = secret_manager.get_secret_by_name(secret_name)

def connect_db():
    # connect to existing database
    # TODO: Change the host for ecs
    conn = psycopg2.connect(host="host.docker.internal", user = secrets['s3_posgres_username'], password = secrets['s3_postgres_password'], port="5432")
    return conn

def extract_object_json_data(data):
    print("\nExtracting data from object")
    observer_uuid = data["observer_uuid"]
    plugin_software_version = data["plugin"]["software_version"]
    browser_type = data["browser"]["type"]
    browser_localisation = data["browser"]["localisation"]
    browser_user_agent_type = data["browser"]["user_agent_type"]
    browser_user_agent_raw = data["browser"]["user_agent_raw"]
    observation_query = data["observation"]["query"]
    observation_time_of_retrieval = data["observation"]["time_of_retrieval"]
    observation_platform = data["observation"]["platform"]
    observation_raw_html = data["observation"]["raw_html"]

    return (
        observer_uuid,
        plugin_software_version,
        browser_type,
        browser_localisation,
        browser_user_agent_type,
        browser_user_agent_raw,
        observation_query,
        observation_time_of_retrieval,
        observation_platform,
        observation_raw_html
    )

def copy_data_to_db(data):
    json_values = extract_object_json_data(data)
    print("\nCopying extracted objects to database")
    conn = connect_db()
    cur = conn.cursor()

    query = """
    INSERT INTO object_dump (
    observer_uuid,
    plugin_software_version,
    browser_type,
    browser_localisation,
    browser_user_agent_type,
    browser_user_agent_raw,
    observation_query,
    observation_time_of_retrieval,
    observation_platform,
    observation_raw_html
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING id
    """

    cur.execute (query, json_values)

    conn.commit()
    generated_id = cur.fetchone()[0]
    print("Inserted into database with id:", generated_id)

    cur.close()
    conn.close()
    return generated_id

def populate_audit_log(id):
    print("\nPopulating timestamp")
    conn = connect_db()
    cur = conn.cursor()

    generated_id = id
    cur.execute (
        """
        INSERT INTO object_dump_time_stamp (object_dump_uuid) VALUES (%s)
        RETURNING id
        """,
        (generated_id,))
    conn.commit()
    id = cur.fetchone()[0]
    print("Inserted into database with id:", id)
    cur.close()
    conn.close()