\c jobly

DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS jobs;


CREATE TABLE companies (
    handle text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    num_employees INTEGER,
    description text,
    logo_url text
);


INSERT INTO companies (handle, name, num_employees, description, logo_url)
VALUES ('kro', 'kroger',3232982,'Cheap groceries', 'kroger.com');
