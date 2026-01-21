var sql = require('mssql');

// define pools
const ConfigBHBrowser = {
  user: 'Dashboard', password: 'Br97aSAkif', database: 'BHBrowser', server: 'S5005002\\common',
  pool: {max: 10, min: 0, idleTimeoutMillis: 5000 },
  options: {trustServerCertificate: true  } //for self-signed certs
};
const pool = new sql.ConnectionPool(ConfigBHBrowser);
const pool1Connect = pool.connect();

const ConfigTestData = {
  user: 'Dashboard', password: 'Br97aSAkif', database: 'testrack', server: 'S5005002\\TESTRACK',
  pool: {max: 10, min: 0, idleTimeoutMillis: 5000 },
  options: {trustServerCertificate: true  } //for self-signed certs
};
const poolt = new sql.ConnectionPool(ConfigTestData);
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