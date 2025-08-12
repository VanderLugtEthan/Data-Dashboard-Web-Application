
const CronJob = require("node-cron");

exports.initScheduledJobs = () => {
    const FiveMinuteTasks = CronJob.schedule("*/1 * * * *", () => {
      console.log("I'm executed on a schedule every 1 minutes!");
      // Update the machine assigned based on production reporting 

      const reqPSUpdate = new XMLHttpRequest();
      console.log("booh");
      reqPSUpdate.addEventListener("load", reqListener);
      reqPSUpdate.open("POST", '../../api/UpdateProdSched/BHNW');
      reqPSUpdate.send();
      
      function reqListener () {
        const result = JSON.parse(this.responseText); 
        console.log("api result:" + result);
      }


    });
  
    FiveMinuteTasks.start();
  }
