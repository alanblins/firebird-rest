var Firebird = require("node-firebird");
var cors = require("cors");
const options = require("./db.config.js");
const serverConfig = require("./server.config.js");

var http = require("http");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(cors());
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
    bodyParser.urlencoded({
        // to support URL-encoded bodies
        extended: true,
    })
);

var server = app.listen(serverConfig.port, serverConfig.host, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log(
        "Firebird server-rest-api listening at http://%s:%s",
        host,
        port
    );
});

app.get("/tables", function (req, res) {
    queryExec(
        Firebird,
        `SELECT a.RDB$RELATION_NAME as tableName
FROM RDB$RELATIONS a
WHERE COALESCE(RDB$SYSTEM_FLAG, 0) = 0 AND RDB$RELATION_TYPE = 0`,
        req,
        res
    );
});

app.get("/tables/:table", function (req, res) {
    const table = req.params.table;
    const fields = req.query.fields || "*";
    const queryString = `select ${fields} from ${table}`;
    queryExec(Firebird, queryString, req, res);
});

function queryExec(Firebird, queryString, req, res) {
    const orderBy = req.query.orderby
        ? `order by ${req.query.orderby.toString()} asc`
        : "";

    const where = req.query.where ? `where ${req.query.where.toString()}` : "";

    const queries = [where, orderBy].filter((a) => !!a);
    Firebird.attach(options, function (err, db) {
        if (err) throw err;

        const finalQueryString = queryString + ` ${queries.join(" ")}`;
        db.query(finalQueryString, function (error, results) {
            if (error) {
                console.error(error);
                res.status(500).end();
                db.detach();
                return;
            }
            //console.log(results);
            res.send(results.map((column) => parseColumn(column)));
            db.detach();
        });
    });
}

function parseColumn(column) {
    return Object.entries(column).reduce((obj, el) => {
        const [key, value] = el;
        obj[key] = parseDataFirebird(value);
        return obj;
    }, {});
}

const convertBufferArray = (data) => {
    return data && data instanceof Uint8Array
        ? String.fromCharCode.apply(null, new Uint8Array(data))
        : data;
};

function parseDataFirebird(data) {
    if (typeof data === "object" && data != null) {
        return convertBufferArray(data);
    } else {
        return data ? convertBufferArray(data) : null;
    }
}
