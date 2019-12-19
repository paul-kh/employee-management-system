DROP DATABASE IF EXISTS employee_db;

CREATE DATABASE employee_db;

USE employee_db;

CREATE TABLE department (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(30),
    PRIMARY KEY (id)
);

CREATE TABLE role (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(30),
    salary decimal,
    department_id INT,
    FOREIGN KEY (department_id)
        REFERENCES department (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    PRIMARY KEY (id)
);

CREATE TABLE employee (
    id INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(30),
    last_name VARCHAR(30),
    role_id INT,
    manager_id INT,
    FOREIGN KEY (manager_id) 
        REFERENCES employee (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    FOREIGN KEY (role_id) 
        REFERENCES role (id)
		ON DELETE SET NULL
        ON UPDATE CASCADE,
	PRIMARY KEY (id)
);