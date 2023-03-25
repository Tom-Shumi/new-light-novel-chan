'use strict';
import * as mysql from 'promise-mysql';

export const handler = async (event) => {
    
    // mysql connection
    const connection = await mysql.createConnection({
        host: process.env["DB_HOST"],
        user: process.env["DB_USER"],
        password: process.env["DB_PASSWORD"],
        database: process.env["DB_NAME"],
        multipleStatements: true
    });
    
    const now = new Date();
    let sbt = 0;
    if (now.getDate() === 2) {
        sbt = 2;
    } else if(now.getDate() === 3) {
        sbt = 3;
    } else if (now.getDate() === 4) {
        sbt = 4;
    }
    
    if (now.getDate() === 2 || now.getDate() === 3 || now.getDate() === 4) {
        const sbtDeleteSql = `DELETE FROM babyGoods WHERE sbt = ${now.getDate()}`
        await connection.query(sbtDeleteSql);
    }

    const newBabyGoodsCount = await connection.query(`SELECT COUNT(*) 'count' FROM babyGoods WHERE sbt = 1`);
    console.log(newBabyGoodsCount);
    if (newBabyGoodsCount[0].count > 300) {
        const deleteBabyGoodsBorder = await connection.query(`SELECT * FROM babyGoods WHERE sbt = 1 ORDER BY id ASC LIMIT 100, 1;`);
        const deleteBorderId = deleteBabyGoodsBorder[0].id;
        const deleteNewVolumeSql = `DELETE FROM babyGoods WHERE id < '${deleteBorderId}'`
        await connection.query(deleteNewVolumeSql);
    }
    connection.end();

    return {
        "statusCode": 200,
        "body": JSON.stringify({"result": "OK"}),
        "isBase64Encoded": false
    }
};
