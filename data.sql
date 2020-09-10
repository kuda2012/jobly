\c jobly

DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS companies;


CREATE TABLE companies (
    handle text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    num_employees INTEGER,
    description text,
    logo_url text
);


CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    salary FLOAT NOT NULL,
    equity FLOAT NOT NULL,
    company_handle text REFERENCES companies(handle) ON DELETE CASCADE,
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     CHECK (equity <=1 AND equity >= 0)
);


INSERT INTO companies (handle, name, num_employees, description, logo_url)
VALUES ('kro', 'kroger',3232982,'Cheap groceries', 'kroger.com');


INSERT INTO jobs (title, salary, equity, company_handle)
VALUES ('bagger', 20000.75,.01,'kro');
