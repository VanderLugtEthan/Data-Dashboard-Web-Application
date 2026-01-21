var sql = require('mssql');

// This will fix a security vunerability where user credentials were directly presented in the code to git users.
const config = require('./dbcredentials.json');

// define pools
const pool = new sql.ConnectionPool(config.BHBrowser);
const pool1Connect = pool.connect();

const poolt = new sql.ConnectionPool(config.TestData);
const pooltConnect = poolt.connect();


// functions used to interact with databases
async function DBQueryTestRack(sqlquery)  {
    try {
      if (debugMode) {
        console.log('SQL:\n' + sqlquery);
      }
      // get data from pool
      const result =  poolt.request().query(sqlquery) 
      if (debugMode) {
        console.log('TD:');
        console.log((await result).recordset);
      }
      return result; 
    } catch (error) {
        // ... error checks
        console.log('DBErrorTestRack: ' + error.message + '\n Query:' + sqlquery);
        //sqlTestRack.close();
        return
    }
    finally {
      //poolt.release()
    }
};


async function DBQueryBHBrowser(sqlquery)  {
  try {
    if (debugMode) {
      console.log('SQL:\n' + sqlquery);
    }
    // get data from pool
    const result =  pool.request().query(sqlquery)
    if (debugMode) {
      console.log('BHB:' + (await result).recordset);
    }
    //sqlBHBrowser.close();
    return result; 
  } catch (error) {
      console.log('DBErrorBHB: ' + error.message + '\n Query:' + sqlquery);
      //sqlBHBrowser.close();
      return
  }
  finally {
    //pool.release()
  }

};

async function DBQueryJDE(sqlquery)  {
  try {
    if (debugMode) {
      console.log('Oracle SQL:\n' + sqlquery);
    }
    var oracledb = require('oracledb');
    var connectionProperties = {
      user:  "ODBC_BHNA",
      password:  "XAC+O1#mJcvRfs+9ZH!NPkNX+iLHXq",
      connectString: "db92IF.bherp.local:1521/DB92IF"};

    return new Promise((resolve, reject) => { 
      oracledb.getConnection(connectionProperties, function (err, connection) {
        if (err) {
          console.log('Oracle Connect Error: ' + JSON.stringify(err));
          return reject(err);
        } else {
          //console.log('Oracle Connection worked: ' + JSON.stringify(this.connection));
        }
        connection.execute(sqlquery, function (err, result) {
            if (err) {
              console.log('Oracle Execute error: ' + JSON.stringify(err));
              return reject(err);
            }
            return resolve(result);
        })
      })
  })
  } catch (error) {
      console.log('DBErrorJDE: ' + err.message + '\n Query:' + sqlquery);
      doRelease(connection);
      return reject(err);
  }
}

function doRelease(connection) {
  connection.release(function (err) {
    if (err) {
      console.error(err.message);
    } else {
      console.log('closed oracle succefully');
    }
  });
}
module.exports.DBQueryTestRack  = DBQueryTestRack;
module.exports.DBQueryBHBrowser = DBQueryBHBrowser;
module.exports.DBQueryJDE       = DBQueryJDE;
// or below if is package.json type:module, but then require in app.js don't work 
// export default {
//   DBQueryTestData,DBQueryBHBrowser,DBQueryJDE
// };