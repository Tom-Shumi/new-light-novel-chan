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

const grantType = "refresh_token";
const data = {};

async function refreshToken(clientId, country, authorization) {
    const twitterToken = await connection.query(`SELECT * FROM twitterToken WHERE country = "${country}" LIMIT 1`);
    const refreshToken = twitterToken[0].refreshToken;
    const clientIdHeader = {
        'Authorization': `Basic ${authorization}`
    };
    try {
        const res = await axios.post(`https://api.twitter.com/2/oauth2/token?refresh_token=${refreshToken}&grant_type=${grantType}&client_id=${clientId}`
            , data
            , {headers: clientIdHeader}
        );
        await connection.query("UPDATE twitterToken SET accessToken = ?, refreshToken = ? WHERE country = ?", [res.data.access_token, res.data.refresh_token, country]);
    } catch (error) {
        const {
            status,
            statusText
        } = error.response;
        console.log(`Error! HTTP Status: ${status} ${statusText}`);
        console.log(error);
    }
}

export const handler = async (event) => {
    
    // Light Novel
    await refreshToken(process.env["LIGHT_NOVEL_CLIENT_ID"], "us", process.env["LIGHT_NOVEL_AUTHORIZATION"]);
    
    connection.end();

    return {
        "statusCode": 200,
        "body": JSON.stringify({"result": "OK"}),
        "isBase64Encoded": false
    }
};
