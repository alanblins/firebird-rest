const path = require('path');
module.exports = {
  host: "127.0.0.1",
  port: 3050,
  database: path.resolve("./database.FDB"),
  user: "SYSDBA",
  password: "masterkey",
  lowercase_keys: false, // set to true to lowercase keys
  role: null, // default
  pageSize: 4096,
};
