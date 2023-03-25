'use strict';
const mysql = require('mysql2/promise');
const ProductAdvertisingAPIv1 = require('./src/index');

function sleep(waitSec) {
    return new Promise(function (resolve) {
        setTimeout(function() { resolve() }, waitSec);
    });
} 

exports.handler = async (event, context) => {
    
    // mysql connection
    const connection = await mysql.createConnection({
        host: process.env["DB_HOST"],
        user: process.env["DB_USER"],
        password: process.env["DB_PASSWORD"],
        database: process.env["DB_NAME"],
        multipleStatements: true
    });
    connection.connect();

    // paapi用のクライアント作成
    var defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;
    defaultClient.accessKey = process.env["PAAPI_ACCESS_KEY"];
    defaultClient.secretKey = process.env["PAAPI_SECRET_KEY"];
    defaultClient.host = process.env["PAAPI_HOST"];
    defaultClient.region = process.env["PAAPI_REGION"];
    
    var api = new ProductAdvertisingAPIv1.DefaultApi();

    // ライトノベルを検索する条件作成
    var searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();
    searchItemsRequest['PartnerTag'] = process.env["PAAPI_PARTNER_TAG"];
    searchItemsRequest['PartnerType'] = 'Associates';
    searchItemsRequest['BrowseNodeId'] = '2410280051';
    searchItemsRequest['SortBy'] = 'NewestArrivals';
    searchItemsRequest['Resources'] = ['ItemInfo.ProductInfo', 'ItemInfo.Title'];

    const now = new Date();

    // 100件取得するために、10回ループ（1回10件 * 10回）
    for (let i = 1; i <= 10; i++) {
        searchItemsRequest['ItemPage'] = i;
        // 実際にラノベを取得
        const data = await api.searchItems(searchItemsRequest);
        const searchItemsResponse = ProductAdvertisingAPIv1.SearchItemsResponse.constructFromObject(data);
    
        if (searchItemsResponse['SearchResult'] !== undefined) {
            // 1件ずつラノベを処理
            for (const item of searchItemsResponse['SearchResult']['Items']) {
                const asin = item['ASIN'];
                const releaseDateStr = item['ItemInfo']['ProductInfo']['ReleaseDate']['DisplayValue'].substr(0, 10);
                const url = item['DetailPageURL'];
                let title = item['ItemInfo']['Title']['DisplayValue'];

                // タイトルが長いとTwitterの文字数制限に引っかかるため50文字以降は削除
                if (title.length > 50) {
                    title = title.substr(0, 50) + "…"
                }
    
                const newVolumeCount = await connection.query(`SELECT COUNT(*) 'count' FROM newVolumeLightNovel WHERE asin = '${asin}'`);
                const reservableVolumeCount = await connection.query(`SELECT COUNT(*) 'count' FROM reservableVolumeLightNovel WHERE asin = '${asin}'`);
            
                // DBに未登録のラノベのみDBに登録（登録済みの場合はスキップ）
                if (newVolumeCount[0][0].count == 0 && reservableVolumeCount[0][0].count == 0) {
                    const releaseDate = new Date(releaseDateStr);
    
                    let insertSql;
                    if (releaseDate > new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
                        insertSql = `INSERT INTO reservableVolumeLightNovel (asin, title, volumeNum, url, releaseDate) VALUES ('${asin}', '${title}', 0, '${url}', '${releaseDateStr}')`;
                    } else {
                        insertSql = `INSERT INTO newVolumeLightNovel (asin, title, volumeNum, url, releaseDate, tweetCount) VALUES ('${asin}', '${title}', 0, '${url}', '${releaseDateStr}', 0)`;
                    }
    
                    await connection.query(insertSql);
                }
            }
        }
        await sleep(5000);
    }
    
    connection.end();

    return {
        "statusCode": 200,
        "body": JSON.stringify({"result": "OK"}),
        "isBase64Encoded": false
    }
};
