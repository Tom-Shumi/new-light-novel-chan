'use strict';
import * as mysql from 'promise-mysql';
import axios from 'axios';

// mysql connection
const connection = await mysql.createConnection({
    host: process.env["DB_HOST"],
    user: process.env["DB_USER"],
    password: process.env["DB_PASSWORD"],
    database: process.env["DB_NAME"],
    multipleStatements: true
});

// 英語版のマンガを紹介していた時の名残で country = 'us'になってます
const twitterToken = await connection.query("SELECT * FROM twitterToken WHERE country = 'us'");
const accessToken = twitterToken[0].accessToken;

const header = {
    'Authorization': `Bearer ${accessToken}`
};

function sleep(waitSec) {
    return new Promise(function (resolve) {
        setTimeout(function() { resolve() }, waitSec);
    });
}

async function tweet(data) {
    try {
        await axios.post(`https://api.twitter.com/2/tweets`
            , data
            , {headers: header}
        );
    } catch (error) {
        const {
            status,
            statusText
        } = error.response;
        console.log(`Error! HTTP Status: ${status} ${statusText}`);
        console.log(error);
    }
}

function createDecoration(symbol, tweetCount) {
    let decoration = symbol;
    for (let j = 0; j < tweetCount; j++) {
        decoration += decoration;
    }
    return decoration;
}

async function execute(volumeList, headline, symbol, table) {
    if (volumeList.length == 0) {
        return;
    }
    
    for (let i = 0; i < volumeList.length; i++) {
        const volume = volumeList[i];
        const id = volume.id;
        const title = volume.title;
        const url = volume.url;
        const releaseDate = volume.releaseDate;
        const tweetCount = volume.tweetCount;
        let decoration = createDecoration(symbol, tweetCount);
        
        const content = 
`${decoration}${headline}${decoration}
[発売日: ${releaseDate.getFullYear()}/${releaseDate.getMonth() + 1}/${releaseDate.getDate()}]
${title}
${url}`;
            
        const data = {"text": content};
        await tweet(data)
        await connection.query(`UPDATE ${table} SET tweetCount = ${tweetCount + 1} WHERE id = ${id}`);
        await sleep(5000);
    }
}

export const handler = async (event) => {

    // newVolumeLightNovel
    const newVolumeList = await connection.query("SELECT * FROM newVolumeLightNovel WHERE tweetCount < 2 ORDER BY RAND() LIMIT 3");
    await execute(newVolumeList, "新刊が発売したよ！", "☆", "newVolumeLightNovel");

    // reservableVolumeLightNovel
    const reservableVolumeList = await connection.query("SELECT * FROM reservableVolumeLightNovel WHERE tweetCount = 0 ORDER BY RAND() LIMIT 3");
    await execute(reservableVolumeList, "予約が開始してるよ！", "◇", "reservableVolumeLightNovel");
    
    connection.end();

    return {
        "statusCode": 200,
        "body": JSON.stringify({"result": "OK"}),
        "isBase64Encoded": false
    }
};
