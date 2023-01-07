/* 1. expressモジュールをロードし、インスタンス化してappに代入。*/
var express = require("express");
var app = express();

/* 2. listen()メソッドを実行して3000番ポートで待ち受け。*/
var server = app.listen(3000, function(){
    console.log("Node.js is listening to PORT:" + server.address().port);
});

/* 3. 以後、アプリケーション固有の処理 */
const Connection = require('tedious').Connection;
const config = {
    server:'d1ahssjw01kbtcom.database.windows.net',
    options:{
        database:'d1ahssjw01-sd01',
    },
    authentication: {
      type: 'default',
      options: {
        userName: 'DEVELOPER',
      }
    }
};

const Request = require('tedious').Request;
var connection = new Connection(config);
connection.connect(connected);

function execute() {
    // Query Request
    let sql = getQuery( 'K280DBT', '再検補充発注');
    const request = new Request(sql, function(err, rows) {
        if ( err ) {
            console.log('Query request error.(' + err + ')');
            connection.close();
            //process.exit();
        }
         // connection.close();
         // console.log('Connection Closed');
    });
    // exec
    connection.execSql(request);
}

app.get("/api/accesscount", function (req, res, next) {

    console.log('Query Start');
    //connection = new Connection(config);
    if (!connection.connected){
      console.log('recconect');
      connection.connect(connected)
    }else {
      execute();
    }
    //connect(connection).then(execute());

    console.log('Query End');

    res.status(200).send('It Worked');
    res.end();
});

function connect(connection){
    return new Promise((resolve,reject) => {
        resolve(
            connection.connect(connected)
        )
    })
}
function connected(err) {
    if (err) {
        console.log('SQL Serer connect error.(' + err + ')');
            connection.close();
        //process.exit();
    }
    console.log('SQL Server connected.');
    //execute();
};

function getQuery( schema , pageId ) {
    return `
    MERGE INTO `+ schema + `.SQLDB_IF_TBL_KTAUTHAPアクセスカウンタ A
    USING
      (
        SELECT
          '202224' AS アプリケーションID
        , '` + pageId + `' AS ページID
        , FORMAT(GETDATE(),'yyyyMMdd') 集計日
      ) AS B
    ON (
            A.アプリケーションID = B.アプリケーションID
        AND A.ページID = B.ページID
        AND A.集計日 = B.集計日
      )
    WHEN MATCHED THEN
       UPDATE SET カウンタ = カウンタ+1
    WHEN NOT MATCHED THEN
      INSERT(
          アプリケーションID
        , ページID
        , 集計日
        , カウンタ
        , 作成日時
        , 作成者
        , 作成プログラム
        , 更新日時
        , 更新者
        , 更新プログラム
      )
      VALUES
        (
          B.アプリケーションID
        , B.ページID
        , B.集計日
        , 1
        , GETDATE()
        , '230001'
        , '230001'
        , GETDATE()
        , '230001'
        , '230001'
       )
    ;`;
}