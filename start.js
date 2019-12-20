
const inquirer = require("inquirer");
const dbConnection = require("./config/connection.js");
dbConnection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + dbConnection.threadId + "\n");
    start();

});

const start = () => {
    // prompt user to start app
    inquirer.prompt([{
        type: "list",
        choices: [
            'Add department',
            'Add roles',
            'Add Employee',
            'Update employee roles',
            'View all employees',
            'View all departments',
            'View all roles',
            "Exit"
        ],
        message: "What do you want to do?",
        name: "userOperation"
    }]).then(res => {
        if (res.userOperation === "Add department") {
            addDepartment();
        }
        if (res.userOperation === "Add roles") {
            addRoles();
        }
        if (res.userOperation === "Add Employee") {
            addEmployee();
        }
        if (res.userOperation === "Update employee roles") {
            updateEmployeeRoles();
        }
        if (res.userOperation === "View all employees") {
            viewAllEmployees();
        }
        if (res.userOperation === "View all departments") {
            viewAllDepartments();
        }
        if (res.userOperation === "View all roles") {
            viewAllRoles();
        }
        if (res.userOperation === "Exit") {
            dbConnection.end();
            process.exit;
        }
    });
}
// Add department
const addDepartment = () => {
    inquirer.prompt([{
        type: "input",
        message: "Enter department name:",
        name: "department"

    }]).then(res => {
        // Insert into department table
        dbConnection.query("INSERT INTO department SET ?",
            {
                name: res.department
            },
            (err, res) => {
                if (err) throw err;
                console.log("\n New department is successfully! \n");
                start();
            });
    });
}

// Add roles
const addRoles = () => {
    const departments = []; // For showing list of departments for users to select when adding new role
    const getDepartments = () => {
        dbConnection.query("SELECT * FROM department", (err, res) => {
            if (err) throw err;
            for (dept of res) {
                departments.push(dept.name);
            }
            askToAddRoles();
        });
    }
    getDepartments(); // Execute to get the array departments initialized
    const askToAddRoles = () => {
        inquirer.prompt([
            {
                type: "input",
                message: "Enter title/role:",
                name: "role"
            },
            {
                type: "input",
                message: "What is the salary for this role?",
                name: "salary",
                validate: function (salary) {
                    // return /[1-9]/gi.test(id);
                    const isValid = /[0-9]/g.test(salary);
                    if (isValid) { return isValid }
                    else { return console.log("\n Invalid input! Enter number only."); }
                }
            },
            {
                type: "list",
                message: "Choose department:",
                choices: departments,
                name: "department"
            }]).then(val => {
                // get department id
                let deptID;
                dbConnection.query("SELECT * FROM department WHERE ?", { name: val.department }, (err, res) => {
                    if (err) throw err;
                    deptID = res[0].id;
                    // insert into table 'role'
                    dbConnection.query("INSERT INTO role SET ?",
                        {
                            title: val.role,
                            salary: val.salary,
                            department_id: deptID
                        },
                        (err, res) => {
                            if (err) throw err;
                            console.log("\n New role is added successfully! \n");
                            start();
                        });
                });
            });
    }
}

const addEmployee = () => {
    const managers = ['No manager']; // For showing list of departments for users to select when adding new employee
    const roles = []; // For list of roles for users to select when adding new employee
    const getManagersAndRoles = () => {
        // make list of managers for users to select to be the manager of new employee
        dbConnection.query("SELECT CONCAT(first_name, ' ', last_name) AS manager FROM employee", (err, res) => {
            if (err) throw err;
            for (mgr of res) {
                managers.push(mgr.manager);
            }
        });
        // make list of roles
        dbConnection.query("SELECT title FROM role", (err, res) => {
            if (err) throw err;
            for (role of res) {
                roles.push(role.title);
            }
            askToAddEmployee();
        });
    }

    getManagersAndRoles(); // Execute to get the array managers and array roles initialized
    const askToAddEmployee = () => {
        inquirer.prompt([
            {
                type: "input",
                message: "Enter first name:",
                name: "firstName"
            },
            {
                type: "input",
                message: "Enter last name:",
                name: "lastName"
            },
            {
                type: "list",
                message: "Choose manager:",
                choices: managers,
                name: "manager"
            },
            {
                type: "list",
                message: "Choose employee role:",
                choices: roles,
                name: "role"
            }
        ])
            .then(val => {
                // get role id
                dbConnection.query("SELECT id FROM role WHERE title = ?", [val.role], (error, data) => {
                    let roleId;
                    if (error) throw error;
                    roleId = data[0].id;
                    let managerId;
                    let firstName;
                    let lastName;
                    if (val.manager === 'No manager') {
                        firstName = null;
                        lastName = null;
                        managerId = null;
                        // insert into table 'employee'
                        dbConnection.query("INSERT INTO employee SET ?",
                            {
                                first_name: val.firstName,
                                last_name: val.lastName,
                                role_id: roleId,
                                manager_id: managerId
                            },
                            (err, res) => {
                                if (err) throw err;
                                console.log("\n New employee is added successfully! \n");
                                start();
                            });
                    } else {
                        firstName = val.manager.split(" ")[0];
                        lastName = val.manager.split(" ")[1];
                        // get manager id
                        dbConnection.query("SELECT id FROM employee WHERE first_name = ? AND last_name = ? ", [firstName, lastName], (err, res) => {
                            if (err) throw err;
                            managerId = res[0].id;
                            // insert into table 'employee'
                            dbConnection.query("INSERT INTO employee SET ?",
                                {
                                    first_name: val.firstName,
                                    last_name: val.lastName,
                                    role_id: roleId,
                                    manager_id: managerId
                                },
                                (err, res) => {
                                    if (err) throw err;
                                    console.log("\n New employee is added successfully! \n");
                                    start();
                                });
                        }); // end of get mangerId promise
                    } // end of else

                }); // end of get role ID promise
            }); // enf of inquirer prompt
    }
}

const updateEmployeeRoles = () => {

    // make list of employees for users to select to update the role
    const employees = []; // List of employees for users to select for updating role
    const roles = []; // List of roles for users to select for updating employee's role

    // Function to get employee list and role list
    const getListEmployeesAndRoles = () => {
        // get list of employees
        dbConnection.query("SELECT CONCAT(first_name, ' ', last_name) AS name FROM employee", (err, res) => {
            if (err) throw err;
            for (emp of res) {
                employees.push(emp.name);
            }
            // get list of roles
            dbConnection.query("SELECT title FROM role", (err, res) => {
                if (err) throw err;
                for (role of res) {
                    roles.push(role.title);
                }
                askToUpdateEmployeeRole();
            });
        });
    }
    getListEmployeesAndRoles(); // execute to get the array 'employees' and array 'roles' initialized

    // Function to ask users for their input
    const askToUpdateEmployeeRole = () => {
        inquirer.prompt([
            {
                type: "list",
                message: "Select an employee to update her/his role:",
                choices: employees,
                name: "empName"
            },
            {
                type: "list",
                message: "Select new role of the employee:",
                choices: roles,
                name: "newRole"
            }
        ]).then(function (res) {
            const firstName = res.empName.split(" ")[0];
            const lastName = res.empName.split(" ")[1];
            let newRoleId;
            // get role ID
            dbConnection.query("SELECT id FROM role WHERE title = ?", [res.newRole], function (err, data) {
                if (err) throw err;
                newRoleId = data[0].id;
                // Update table 'employee' with new role
                dbConnection.query("UPDATE employee SET ? WHERE ? AND ?", [{ role_id: newRoleId }, { first_name: firstName }, { last_name: lastName }], function (error, res) {
                    if (error) throw error;
                    console.log("\n New employee's role is updated successfully \n");
                    start();
                });
            });
        });
    }
}

const viewAllDepartments = () => {
    dbConnection.query("SELECT * FROM department", (err, res) => {
        if (err) throw err;
        console.log("\n" + "ID".padEnd(5) + "DEPARTMENT".padEnd(30));
        console.log("".padStart(35, "-"));
        for (let dept of res) {
            console.log(dept.id.toString().padEnd(5) +
                dept.name.padEnd(30));
        }
        console.log("".padStart(35, "=") + "\n");
        start();
    });
}
const viewAllEmployees = () => {
    const queryStr = `SELECT emp.id, emp.first_name, emp.last_name, role.title, CONCAT(mgr.first_name, " ", mgr.last_name) AS manager
            FROM
            (
             (SELECT employee.* FROM employee) AS emp
            LEFT JOIN
            (SELECT employee.* FROM employee) AS mgr 
            ON emp.manager_id = mgr.id
            ) INNER JOIN role
            ON emp.role_id = role.id;`

    dbConnection.query(queryStr, (err, res) => {
        if (err) throw err;
        console.log("\n" + "ID".padEnd(5) + "FIRST NAME".padEnd(15) + "LAST NAME".padEnd(15) + "ROLE".padEnd(20) + "MANAGER");
        console.log("".padStart(70, "-"));
        for (let emp of res) {
            console.log(emp.id.toString().padEnd(5) +
                emp.first_name.padEnd(15) +
                emp.last_name.padEnd(15) +
                emp.title.padEnd(20) +
                emp.manager);
        }
        console.log("".padStart(70, "=") + "\n");
        start();
    });
}
const viewAllRoles = () => {
    dbConnection.query("SELECT role.id, role.title, role.salary, department.name as department FROM role INNER JOIN department ON role.department_id = department.id", (err, res) => {
        if (err) throw err;
        console.log("\n" + "ID".padEnd(5) + "TITLE".padEnd(20) + "SALARY".padEnd(15) + "DEPARTMENT".padEnd(20));
        console.log("".padStart(65, "-"));
        for (let role of res) {
            console.log(role.id.toString().padEnd(5) +
                role.title.padEnd(20) +
                role.salary.toString().padEnd(15) +
                role.department.padEnd(20));
        }
        console.log("".padStart(65, "-"));
        start();
    });
}
