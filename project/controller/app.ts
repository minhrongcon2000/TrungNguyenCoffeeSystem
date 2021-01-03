import express from "express";
import cors from "cors";
import mysql from 'mysql';
import config from "./config.json";

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
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
                    price: result.product_price,
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
                    scope: result.promotio.scope
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

app.post("/branch", (req, res) => {
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

app.put('/branch', (req, res) => {
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
        res.status(200).send();
    })
});

app.listen("5000", () => console.log('Listening on port 5000...'));
