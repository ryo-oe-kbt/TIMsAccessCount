const config = require('config');
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;

var express = require("express");
var app = express();
var server = app.listen(3000, function(){
    console.log("Node.js is listening to PORT:" + server.address().port);
});


// Config内に別で使用するためのノイズになるものがあるが、読み飛ばしてくれればヨシとしたい。
var connection = new Connection(config);
// グローバル変数にしてしまうと不味いのが見えているので、仮。
var pageId;

function execute() {
    // Query Request
    let sql = getQuery();
    const request = new Request(sql, function(err, rows) {
        if ( err ) {
            console.log('Query request error.(' + err + ')');
            connection.close();
        }
         // connection.close();
         // console.log('Connection Closed');
    });
    connection.execSql(request);
}

app.get("/api/accesscount/:pageId", function (req, res, next) {

    pageId = req.params.pageId;
    console.log('params.pageId = ' + req.params.pageId);
    if (pageId == null || pageId == '') {
        res.status(200).send('Require pageId');
        res.end();
        return;
    }

    console.log('Query Start');
    connection = new Connection(config);
    connection.connect(connected);
    /*
    if (!connection.connected){
      console.log('recconect');
      connection.connect(connected)
    }else {
      execute();
    }
    //connect(connection).then(execute());*/
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
    execute();
};

function getQuery() {
    return `
    MERGE INTO `+ config.get('schema') + `.SQLDB_IF_TBL_KTAUTHAPアクセスカウンタ A
    USING
      (
        SELECT
          config.get('timsApplicationId') AS アプリケーションID
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