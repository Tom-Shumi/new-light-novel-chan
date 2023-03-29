'use strict';
import * as mysql from 'promise-mysql';

export const handler = async (event) => {
    
    // mysql connection
    const connection = await mysql.createConnection({
        host: 'japanesecomics.cxje17zaejow.ap-northeast-1.rds.amazonaws.com',
        user: 'admin',
        password: 'Tomohide0714',
        database: 'japanesecomics',
        multipleStatements: true
    });
    
    
    // 販売開始した予約可能に登録されていたライトノベルを新刊テーブルに移動させる ----------------------------------------------------------------------------
    
    // 販売開始した予約可能テーブルに登録されているライトノベルを取得
    const releasedNovel = await connection.query("SELECT * FROM reservableVolumeLightNovel WHERE releaseDate <= NOW() ORDER BY id");
    
    for (const novel of releasedNovel) {
        
        const releaseDate = novel.releaseDate.getFullYear() + "-" + (novel.releaseDate.getMonth() + 1) + "-" + novel.releaseDate.getDate();
        
        const deleteNewNobelSql = `DELETE FROM newVolumeLightNovel WHERE asin = '${novel.asin}'`
        await connection.query(deleteNewNobelSql);
        
        const insertNovelSql = `INSERT INTO newVolumeLightNovel (asin, title, volumeNum, url, releaseDate, tweetCount) VALUES ('${novel.asin}', '${novel.title}', ${novel.volumeNum}, '${novel.url}', '${releaseDate}', 0)`;
        await connection.query(insertNovelSql);
        
        const deleteNovelSql = `DELETE FROM reservableVolumeLightNovel WHERE id = ${novel.id}`
        await connection.query(deleteNovelSql);
    }
    
    // 15日前に発売された 且つ 2回ツイートされたライトノベルの削除
    await connection.query('DELETE FROM newVolumeLightNovel WHERE tweetCount = 2 and releaseDate < DATE_SUB(CURDATE(),INTERVAL 15 DAY)');
    
    connection.end();

    return {
        "statusCode": 200,
        "body": JSON.stringify({"result": "OK"}),
        "isBase64Encoded": false
    }
};
