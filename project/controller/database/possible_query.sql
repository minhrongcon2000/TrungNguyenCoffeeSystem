-- get information on products
SELECT
  P.product_id,
  P.product_name,
  P.price,
  P.product_type,
  GD.percent as discount_factor,
  GD.g_name as promotion_name,
  GD.valid_from,
  GD.valid_to,
  "global" as scope
FROM
  Product P
  JOIN GDiscount GD ON P.gd_id = GD.gd_id
UNION
SELECT
  t2.product_id,
  t2.product_name,
  t2.price,
  t2.product_type,
  t2.percent as discount_factor,
  t2.l_name as promotion_name,
  t2.valid_from,
  t2.valid_to,
  B.branch_name as scope
FROM
  Branch B
  JOIN (
    SELECT
      P.product_id,
      P.product_name,
      P.price,
      P.product_type,
      t1.percent,
      t1.l_name,
      t1.branch_id,
      t1.valid_from,
      t1.valid_to
    FROM
      Product P
      JOIN (
        SELECT
          LD.*,
          AL.product_id
        FROM
          LDiscount LD
          JOIN ApplyLocal AL ON LD.ld_id = AL.ld_id
        WHERE
          NOT EXISTS (
            SELECT
              *
            FROM
              ApplyLocal AL
              JOIN Product P ON AL.product_id = P.product_id
            WHERE
              P.gd_id IS NOT NULL
          )
      ) t1 ON P.product_id = t1.product_id
  ) t2 ON B.branch_id = t2.branch_id
UNION
SELECT
  P.product_id,
  P.product_name,
  P.price,
  P.product_type,
  0 AS discount_factor,
  NULL AS promotion_name,
  NULL AS valid_from,
  NULL AS valid_to,
  NULL AS scope
FROM
  Product P
WHERE
  P.gd_id is NULL
  AND NOT EXISTS (
    SELECT
      *
    FROM
      ApplyLocal AL
    WHERE
      AL.product_id = P.product_id
  );