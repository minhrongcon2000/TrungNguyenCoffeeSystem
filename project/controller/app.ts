import express from "express";
import cors from "cors";
import mysql from 'mysql';
import config from "./config.json";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    console.log(req.headers);
    res.send('<h1>Hello</h1>');
});

app.get('/products', (req, res) => {
    const connection = mysql.createConnection(config.database);
    connection.connect();
    connection.query("CALL getProductInfo();", (err, results) => {
        if (err) {
            res.status(500).send("Internal server error");
            console.log(err);
        }
        
        interface RawProduct {
            product_id: string;
            product_name: string;
            product_type: ['food', 'drink'];
            price: number;
            promotion_name: string;
            discount: number;
            valid_from: Date;
            valid_to: Date;
            scope: string;
        }

        interface PreprocessResult {
            product_id: string;
            product_name: string;
            price: number;
            product_type: ['food', 'drink'];
            promotion: {
                promotion_name: string;
                discount: number;
                valid_from: Date;
                valid_to: Date;
                scope: string;
            }
        }

        interface Promotion {
            promotion_name: string;
            discount: number;
            valid_from: Date;
            valid_to: Date;
            scope: string;
        }

        interface OutputResult {
            product_id: string;
            product_name: string;
            product_type: ['food', 'drink'];
            promotion: Promotion;
        }

        const preprocess_result: Array<PreprocessResult> = results[0].map((product: RawProduct): PreprocessResult => ({
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

        let output: Array<OutputResult> = [];
        for (const product_id in hash_result) {
            output.push({product_id, ...hash_result[product_id]});
        }

        res.json(output);
    });
    connection.end();
});

app.post('/general_manager/login', (req, res) => {
    interface ReqInfo {
        username: string;
        password: string;
    }

    const req_info: ReqInfo = req.body;
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

app.post("/branch", verifyToken, (req, res) => {
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

app.put('/branch/change_manager', verifyToken, (req, res) => {
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
    const authData: string = req.headers.authorization;
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
