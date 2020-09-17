\c jobly

DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS users;


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

CREATE TABLE users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    photo_url text,
    is_admin BOOLEAN  NOT NULL DEFAULT FALSE
);


INSERT INTO companies (handle, name, num_employees, description, logo_url)
VALUES ('kro', 'kroger',3232982,'Cheap groceries', 'kroger.com');


INSERT INTO jobs (title, salary, equity, company_handle)
VALUES ('bagger', 20000.75,.01,'kro');

INSERT INTO users (username, password, first_name, last_name, email, photo_url)
VALUES('kudaman', 'password1', 'Kuda', 'Mwakutuya', 'kuda2012@gmail.com', 'http://kuda.com');