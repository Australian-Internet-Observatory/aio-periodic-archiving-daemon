-- Run the following scripts in order

-- 1. Enable UUID in postgres
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Object dump table
-- create table to dump all the opject values from s3 to postgres
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

-- 3. Create audit log table
-- create table to dump audit log
create table object_dump_time_stamp(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    object_dump_uuid text not null,
    object_dump_time_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );