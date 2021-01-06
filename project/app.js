const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('./config.json');

const app = express();

app.use(express.json());

// customer route
app.get('/products', (req, res) => {
    const connection = mysql.createConnection(config.database);
    connection.connect();
    connection.query("CALL getProductInfo();", (err, results) => {
        if (err) {
            res.status(500).send("Internal server error");
            console.log(err);
        }

        const preprocess_result = results[0].map((product) => ({
            product_id: product.product_id,
            product_name: product.product_name,
            price: product.price,
            product_type: product.product_type,
            promotion: {
                promotion_name: product.promotion_name,
                discount: product.discount,
                valid_from: product.valid_from,
                valid_to: product.valid_to,
                scope: product.scope
            }
        }));
        let hash_result = {};
        for (const result of preprocess_result) {
            if(!hash_result[result.product_id]) {
                hash_result[result.product_id] = {
                    product_name: result.product_name,
                    price: result.price,
                    product_type: result.product_type
                }
                hash_result[result.product_id].promotions = result.promotion.promotion_name ? [{
                    promotion_name: result.promotion.promotion_name, 
                    discount: result.promotion.discount,
                    valid_from: result.promotion.valid_from,
                    valid_to: result.promotion.valid_to,
                    scope: result.promotion.scope
                }]: []; 
            }
            else {
                hash_result[result.product_id].promotions.push({
                    promotion_name: result.promotion.promotion_name, 
                    discount: result.promotion.discount,
                    valid_from: result.promotion.valid_from,
                    valid_to: result.promotion.valid_to,
                    scope: result.promotion.scope
                })
            }
        }

        let output = [];
        for (const product_id in hash_result) {
            output.push({product_id, ...hash_result[product_id]});
        }

        res.json(output);
    });
    connection.end();
});

// sales staff route
app.post('/sales_staff/login', (req, res) => {
    const extractBranchID = (username) => username.slice(0, username.search(/STAFF*/));

    const req_info = req.body;
    if(!Object.keys(req_info).includes("username") || !Object.keys(req_info).includes("password")) res.status(400).send('<h1>Bad requests</h1>');
    const hash = crypto.createHmac('sha256', config.secret_key).update(req_info.password).digest('hex');

    const connection = mysql.createConnection(config.database);
    connection.connect();
    const sql_query = `SELECT username, pwd, branch_id FROM SalesStaff WHERE username='${req_info.username}' AND pwd='${hash}' AND branch_id='${extractBranchID(req_info.username)}';`
    connection.query(sql_query, (err, results) => {
        if(err) res.status(500).send("<h1>Internal server error</h1>");
        if(results.length === 0) {
            res.status(401).send('<h1>Wrong username or password</h1>');
        }
        else {
            jwt.sign(req_info, config.secret_key, (err, token) => res.json({token}));
        }
    })
});

app.post('/sales_staff/payment', verifyToken, (req, res) => {
    const extractBranchID = (username) => username.slice(0, username.search(/STAFF*/));
    
    const getCurrentDateTime = () => new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    const decoded = Object(jwt.verify(req.body.token, config.secret_key));
    const order_data = {
        staff_id: decoded.username, 
        branch_id: extractBranchID(decoded.username), 
        ...req.body
    };
    
    const connection = mysql.createConnection({multipleStatements: true, ...config.database});
    let sql_query = `INSERT INTO Orders VALUES('${order_data.order_id}', '${order_data.customer_name}', '${order_data.customer_phone}', '${order_data.branch_id}', '${order_data.staff_id}');`
    for(const transaction of order_data.transactions) {
        sql_query += `INSERT INTO Transact VALUES(${transaction.trans_qty}, '${getCurrentDateTime()}', '${transaction.trans_id}', '${transaction.product_id}', '${order_data.order_id}');`
    }

    connection.connect();
    connection.query(sql_query, (err, results) => {
        if (err) {
            res.status(500).send('<h1>Internal server error</h1>');
            throw err;
        }
        else res.send(results);
    });    
})

// local manager route
app.post('/local_manager/login', (req, res) => {
    const req_info = req.body;
    if(!Object.keys(req_info).includes("username") || !Object.keys(req_info).includes("password")) res.status(400).send('<h1>Bad requests</h1>');
    const hash = crypto.createHmac('sha256', config.secret_key).update(req_info.password).digest('hex');

    const getBranchID = (username) => 'TN' + username.slice(username.search(/[0-9]/), username.length);

    const connection = mysql.createConnection(config.database);
    connection.connect();
    const sql_query = `SELECT L.username, L.pwd, B.branch_id FROM LocalManager L JOIN Branch B ON L.lm_id = B.lm_id WHERE username='${req_info.username}' AND pwd='${hash}' AND branch_id='${getBranchID(req_info.username)}';`
    connection.query(sql_query, (err, results) => {
        if(err) {
            res.status(500).send("<h1>Internal server error</h1>");
            throw err;
        }
        if(results.length === 0) {
            res.status(401).send('<h1>Wrong username or password</h1>');
        }
        else {
            jwt.sign({branch_id: getBranchID(req_info.username), ...req_info}, config.secret_key, (err, token) => res.json({token}));
        }
    })
})

app.post('/local_manager/local_discount', verifyToken, (req, res) => {
    const {branch_id} = Object(jwt.verify(req.body.token, config.secret_key));
    
    const local_discount_req =  {branch_id, ...req.body}

    const sql_query = 'SELECT product_id FROM Product WHERE gd_id IS NOT NULL';
    const connection = mysql.createConnection(config.database);

    connection.connect();
    connection.query(sql_query, (err, results) => {
        if(err) {
            res.status(500).send('<h1>Internal server error</h1>');
            throw err;
        }
        const cannotDiscountID = results.map((product) => product.product_id);
        let response = [];
        for(const product of local_discount_req.products) {
            if(cannotDiscountID.includes(product)) response.push(product);
        }
        if(response.length !== 0) res.status(403).send(response.join(', ') + 'has global discount, so cannot add')
        else {
            let sql_query = `INSERT INTO LDiscount VALUES('${local_discount_req.id}', '${local_discount_req.valid_from}', '${local_discount_req.valid_to}', '${local_discount_req.percent}', '${local_discount_req.promotion_name}', '${local_discount_req.branch_id}');`;
            for(const product of local_discount_req.products) {
                sql_query += `INSERT INTO ApplyLocal VALUES('${local_discount_req.id}', '${product}');`
            }
        
            const connection = mysql.createConnection({multipleStatements: true, ...config.database});
        
            connection.connect();
            connection.query(sql_query, (err, results) => {
                if(err) {
                    res.status(500).send('<h1>Internal server error</h1>');
                    throw err;
                }
        
                res.send('<h1>Updated successfully</h1>');
            })
        }
    })

})

// general manager route
app.post('/general_manager/login', (req, res) => {
    const req_info = req.body;
    if(!Object.keys(req_info).includes("username") || !Object.keys(req_info).includes("password")) res.status(400).send('<h1>Bad requests</h1>');
    const hash = crypto.createHmac('sha256', config.secret_key).update(req_info.password).digest('hex');

    const connection = mysql.createConnection(config.database);
    connection.connect();
    const sql_query = `SELECT username, pwd FROM GeneralManager WHERE username='${req_info.username}' AND pwd='${hash}';`
    connection.query(sql_query, (err, results) => {
        if(err) res.status(500).send("<h1>Internal server error</h1>");
        if(results.length === 0) {
            res.status(401).send('<h1>Wrong username or password</h1>');
        }
        else {
            jwt.sign(req_info, config.secret_key, (err, token) => res.json({token}));
        }
    })
});

app.post('/general_manager/global_discount', verifyToken, (req, res) => {
    const g_discount = req.body;
    let sql_query = `INSERT INTO GDiscount VALUES('${g_discount.id}', '${g_discount.percent}', '${g_discount.valid_from}', '${g_discount.valid_to}', '${g_discount.promotion_name}');`;
    for(const product of g_discount.products) {
        sql_query += `UPDATE Product SET gd_id='${g_discount.id}' WHERE product_id='${product}'; DELETE FROM ApplyLocal WHERE product_id='${product}';`;
    }
    const connection = mysql.createConnection({multipleStatements: true, ...config.database});
    connection.connect();
    connection.query(sql_query, (err, results) => {
        if(err) {
            res.status(500).send('<h1>Internal server error!</h1>');
            throw err;
        }
        res.send('<h1>Updated successfully</h1>');
    })
})

app.post("/general_manager/branch", verifyToken, (req, res) => {
    jwt.verify(req.body.token, config.secret_key, (err, authData) => {
        if(err) res.status(403).send('<h1>Forbidden access</h1>');
    })
    const req_data = req.body;
    const connection = mysql.createConnection(config.database);
    const sql_query = `INSERT INTO Branch 
                   VALUES(
                        '${req_data.branch_id}', 
                        '${req_data.branch_name}', 
                        '${req_data.address.address_no}', 
                        '${req_data.address.street}',
                        '${req_data.address.ward}', 
                        '${req_data.address.district}', 
                        '${req_data.lm_id}'
                   )`;
    connection.connect();
    connection.query(sql_query, (err, results) => {
        if (err) {
            res.status(500).send("Internal server error");
            console.log(err);
        }
        console.log(`Add branch, ${results.affectedRows} row(s) affected`);
        res.json(req_data);
    })
});

app.put('/general_manager/branch/change_manager', verifyToken, (req, res) => {
    jwt.verify(req.body.token, config.secret_key, (err, authData) => {
        if(err) res.status(403).send('<h1>Forbidden access</h1>');
    })
    const sql_query = `UPDATE Branch
                   SET lm_id='${req.body.lm_id}'
                   WHERE branch_id=${req.query.branch_id}`;
    const connection = mysql.createConnection(config.database);
    connection.connect();
    connection.query(sql_query, (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('internal server error');
        }
        console.log(`UPDATE Branch, ${results.changedRows} row(s) changed`);
        res.status(200).send('<h1>Update successfully</h1>');
    })
});

function verifyToken(req, res, next) {
    const authData = req.headers.authorization;
    if (authData) {
        if(authData.search(/Bearer */)===-1) res.status(400).send('<h1>Bad header</h1>')
        else {
            req.body.token = authData.split(' ')[1];
        }
    } else {
        res.status(403).send('Forbidden access!')
    }
    next();
}

app.listen("5000", () => console.log('Listening on port 5000...'));
