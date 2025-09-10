SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;


CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE
);

create table object_dump (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	observer_uuid text not null,
	plugin_software_version TEXT not null,
	browser_type TEXT not null,
	browser_localisation TEXT not null,
	browser_user_agent_type TEXT not null,
	browser_user_agent_raw TEXT not null,
	observation_query TEXT not null ,
	observation_time_of_retrieval BIGINT not null,
	observation_platform TEXT not null,
	observation_raw_html TEXT not null
	);
