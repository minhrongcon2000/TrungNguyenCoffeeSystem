--insert product
INSERT INTO
  Product(
    product_id,
    product_name,
    product_type,
    price,
    img_dir
  )
VALUES(
    'COF01',
    'Drip coffee - Americano',
    'drink',
    147000,
    './img/IMG-20200605-WA0003_960x1280.webp'
  );
INSERT INTO
  Product(
    product_id,
    product_name,
    product_type,
    price,
    img_dir
  )
VALUES(
    'COF02',
    'Expresso, Innovator - Arabica, Robusta',
    'drink',
    540000,
    './img/DSC3706_1498x1698.jpeg'
  );
INSERT INTO
  Product(
    product_id,
    product_name,
    product_type,
    price,
    img_dir
  )
VALUES(
    'COF03',
    'G7 - Sugar Free & Colagen - 22 servings',
    'drink',
    135000,
    './img/DSC3990_1152x1312.jpeg'
  );
INSERT INTO
  Product(
    product_id,
    product_name,
    product_type,
    price,
    img_dir
  )
VALUES(
    'COF04',
    'Trung Nguyen Gourmet Blend',
    'drink',
    296700,
    './img/DSC3881_1152x1312.jpeg'
  );
INSERT INTO
  Product(
    product_id,
    product_name,
    product_type,
    price,
    img_dir
  )
VALUES(
    'COF05',
    'Trung Nguyen Legend 3in1 Café SUA DA',
    'drink',
    119700,
    './img/sue_da_side_1792x2031.jpg'
  );
-- insert general manager
INSERT INTO
  GeneralManager(gm_id, gm_name, username, pwd)
VALUES(
    'GM01',
    'John',
    'GM01',
    'a8cfcd74832004951b4408cdb0a5dbcd8c7e52d43f7fe244bf720582e05241da'
  );
-- insert local manager
INSERT INTO
  LocalManager(lm_id, lm_name, username, pwd, gm_id)
VALUES(
    'LM01',
    'Jane',
    'LM01',
    '4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332',
    'GM01'
  );
-- insert branch
INSERT INTO
  Branch
VALUES(
    'TN01',
    'Trung Nguyen Go Vap',
    '124/6',
    'Le Loi',
    '4',
    'Go Vap',
    'LM01'
  );
-- insert global discount
INSERT INTO
  GDiscount(gd_id, percent, valid_from, valid_to, g_name)
VALUES(
    'GD01',
    0.5,
    '2020-02-01',
    '2020-03-01',
    'Demo promotion'
  );
UPDATE
  Product
SET
  gd_id = 'GD01'
WHERE
  product_id = 'COF01';
-- insert local discount
INSERT INTO
  LDiscount
VALUES(
    'LD01',
    '2020-01-02',
    '2020-01-03',
    0.5,
    'Demo local promotion',
    'TN01'
  );
INSERT INTO
  ApplyLocal
VALUES('LD01', 'COF02');