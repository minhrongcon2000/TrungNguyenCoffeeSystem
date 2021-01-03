-- create database
DROP DATABASE IF EXISTS TrungNguyen;
CREATE DATABASE TrungNguyen;
USE TrungNguyen;
-- create tables
CREATE TABLE GeneralManager (
  gm_id VARCHAR(15) NOT NULL,
  gm_name VARCHAR(20) NOT NULL,
  PRIMARY KEY (gm_id)
);
CREATE TABLE LocalManager (
  lm_id VARCHAR(15) NOT NULL,
  lm_name VARCHAR(20) NOT NULL,
  gm_id VARCHAR(15) NOT NULL,
  PRIMARY KEY (lm_id),
  FOREIGN KEY (gm_id) REFERENCES GeneralManager(gm_id)
);
CREATE TABLE GDiscount (
  gd_id VARCHAR(15) NOT NULL,
  percent FLOAT NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  g_name VARCHAR(50) NOT NULL,
  PRIMARY KEY (gd_id)
);
CREATE TABLE Product (
  product_id VARCHAR(15) NOT NULL,
  product_name VARCHAR(50) NOT NULL,
  product_type VARCHAR(15) NOT NULL,
  price FLOAT NOT NULL,
  img_dir VARCHAR(100),
  gd_id VARCHAR(15),
  PRIMARY KEY (product_id),
  FOREIGN KEY (gd_id) REFERENCES GDiscount(gd_id)
);
CREATE TABLE Branch (
  branch_id VARCHAR(15) NOT NULL,
  branch_name VARCHAR(50) NOT NULL,
  address_no VARCHAR(20) NOT NULL,
  street VARCHAR(20) NOT NULL,
  ward VARCHAR(20) NOT NULL,
  district VARCHAR(20) NOT NULL,
  lm_id VARCHAR(15) NOT NULL,
  PRIMARY KEY (branch_id),
  FOREIGN KEY (lm_id) REFERENCES LocalManager(lm_id)
);
CREATE TABLE SalesStaff (
  s_id VARCHAR(15) NOT NULL,
  s_name VARCHAR(20) NOT NULL,
  branch_id VARCHAR(15) NOT NULL,
  PRIMARY KEY (s_id),
  FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
);
CREATE TABLE Orders (
  order_id VARCHAR(15) NOT NULL,
  customer_name VARCHAR(20) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  branch_id VARCHAR(15) NOT NULL,
  s_id VARCHAR(15) NOT NULL,
  PRIMARY KEY (order_id),
  FOREIGN KEY (branch_id) REFERENCES Branch(branch_id),
  FOREIGN KEY (s_id) REFERENCES SalesStaff(s_id)
);
CREATE TABLE LDiscount (
  ld_id VARCHAR(15) NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  percent FLOAT NOT NULL,
  l_name VARCHAR(50) NOT NULL,
  branch_id VARCHAR(15) NOT NULL,
  PRIMARY KEY (ld_id),
  FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
);
CREATE TABLE Sell (
  avail_qty INT NOT NULL,
  avail_status VARCHAR(15) NOT NULL,
  product_id VARCHAR(15) NOT NULL,
  branch_id VARCHAR(15) NOT NULL,
  PRIMARY KEY (product_id, branch_id),
  FOREIGN KEY (product_id) REFERENCES Product(product_id),
  FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
);
CREATE TABLE ApplyLocal (
  ld_id VARCHAR(15) NOT NULL,
  product_id VARCHAR(15) NOT NULL,
  PRIMARY KEY (ld_id, product_id),
  FOREIGN KEY (ld_id) REFERENCES LDiscount(ld_id),
  FOREIGN KEY (product_id) REFERENCES Product(product_id)
);
CREATE TABLE Transact (
  trans_qty INT NOT NULL,
  trans_datetime DATE NOT NULL,
  trans_id VARCHAR(15) NOT NULL,
  product_id VARCHAR(15) NOT NULL,
  order_id VARCHAR(15) NOT NULL,
  PRIMARY KEY (trans_id),
  FOREIGN KEY (product_id) REFERENCES Product(product_id),
  FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);