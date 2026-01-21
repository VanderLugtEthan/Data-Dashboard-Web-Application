/**
 * The OEE Dashboard displays OEE Data about each machine in a given department (Production, Availability, and Total OEE)
 * Each calculation is taken from the SQL/common database, and is currently provided by a report from an excel spreadsheet
 * If any changes are made to the method in which the data is collected, so long as the database entires remain, this dashboard will automatically adjust to these changes
 * 
 * @author Ethan VanderLugt
 * @rev 2025-08-05
 * 
 */

// CSS Imports
import '../style/chartist.min.css';
import '../style/pls_OEEDashboard.css';

// Javascript library imports
import { useEffect, useState } from 'react';
import { PieChart } from 'chartist';
import axios from 'axios';                  //NOTE: API CALLS ARE HARDCODED. CHANGE FOR DEBUG STAGE

// Collect from a range of dates. Parameter is a number that indicates: how many days ago? -1 collects the YTD value
function getDate(daysAgo){
  let today = new Date();
  if (daysAgo < 0)
    today = new Date(today.getFullYear(), 0, 1); 
  else
    today.setDate(today.getDate() - daysAgo);
  
  return today.toISOString().slice(0, 10);
}

// Collects the shift based on the current time. Requires no parameters to run. Used in methods requiring data collection
function getShift(){
  
  // The current time will determine what shift to pull from for the API
  const time = new Date();
  const hour = time.getHours();
  const minute = time.getMinutes();
        
  // Determine what shift we need to pull from based on the current time (3:30 AM to 3:30 PM = Shift 1, otherwise Shift 2)
  if ((hour > 3 && hour < 15) || ((hour === 3 && minute >= 30) && (hour === 15 && minute <= 30)))
      return 'Shift 1';
  else
      return 'Shift 2';
}

// This method generates individual donut graphs, and is dynamically called for each machine in a department
function GenerateChart({ id, labels, series, options, totalOEE }){
   useEffect(() => {
    const donut = new PieChart(`#${id}`, { labels, series }, options);

    // Center the total OEE text in the chart right here
    donut.on('created', function(ctx) {
      const svg = ctx.svg._node;

      // If the OEE is 85 or higher, we have reached their goal
      const color = totalOEE >= 85 ? 'green' : 'gray';

      // Create a text node with the given properties
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

      // Style sheet here. This can't really be done in the normal css file
      text.setAttribute('x', '50%');
      text.setAttribute('y', '50%');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-family', 'Calibri, sans-serif');
      text.setAttribute('font-size', '125%');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('class', 'center-text');

      // First line: "OEE"
      const tspanLabel = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspanLabel.setAttribute('x', '50%');
      tspanLabel.setAttribute('dy', '-0.6em');
      tspanLabel.textContent = 'OEE';

      // Second line: Percentage
      const tspanValue = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspanValue.setAttribute('x', '50%');
      tspanValue.setAttribute('dy', '1.2em');
      tspanValue.textContent = `${totalOEE}%`;

      // Append tspans to the text node
      text.appendChild(tspanLabel);
      text.appendChild(tspanValue);

      // Append the text node to the SVG
      svg.appendChild(text);
  });
  }, [id, labels, series, options]);

  return <div id={id} className="ct-chart-donut"></div>;
}

// Collect the average values for the current day
function AverageValues({ parmDepartment }) {
  const [averages, setAverages] = useState(null);

  // Fetch the latest sunday to pass into the API
  let dateObj = new Date();
  const day  = dateObj.getDay();
  const difference = day === 0 ? 14 : day + 7;
  dateObj.setDate(dateObj.getDate() - difference);
  const parmDate = dateObj.toISOString().slice(0, 10);

  const parmShift = getShift();

  // API call and collection of data here
  useEffect(() => {
    axios.get(`http://s5003013:3000/api/GetAverageOEE/${parmDepartment}/${parmDate}/${parmShift}`)
      .then(res => {
        const data = res.data;
        setAverages(data);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
      });
  }, [parmDepartment, parmDate]);

  // Fallback return call for if the API Call fails to gather data
  if (!averages || averages.length === 0) {
    return (
      <p style={{ fontFamily: 'Calibri', fontSize: '48px', color: '#888' }}>
        No averages found!
      </p>
    );
  }

  // Display the current date, and collect information from averages array
  let today = getDate(0);
  const Performance = parseFloat((averages[0].WOPerformance * 100).toFixed(0));
  const Availability = parseFloat((averages[0].WOAvailability * 100).toFixed(0));
  const OEE = parseFloat((averages[0].WOAvailability * averages[0].WOPerformance* 100).toFixed(0));

  return (
    <div className="dashboardChart">
      <div className="averageValues">
      <p className="averageValueText">
        {parmDepartment} Summary<br/>
        Date: {today}<br/>
        {parmShift}<br/>
        Performance: {Math.trunc(averages[0].WOPerformance * 100, 2)}%<br/>
        Availability: {Math.trunc(averages[0].WOAvailability * 100, 2)}%<br/>
      </p>
        <GenerateChart
          id={`average-graph-${today}`}
          labels={["Performance", "Performance Gap", "Availability", "Availability Gap"]}
          series={[Performance > 100 ? 100 : Performance, Performance < 100 ? 100 - Performance : 0, 
                Availability < 100 ? 100 - Availability : 0, Availability > 100 ? 100 : Availability]}
          options={ {
                donut: true,
                donutWidth: 80,
                startAngle: 270,
                showLabel: false
              }}
          totalOEE={OEE}
        />
        </div>
    </div>
  );
}

// This function will collect the average OEE from long term dates
function LongTermDataGraph({ parmDepartment, parmDate, parmHeader }){
    
  // This time, we will select a finite number of graphs to generate data with
  const [averages, setAverages] = useState(null);

  /*
  const beginningOfYear = new Date(now.getFullYear(), 0, 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastThreeMonths = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  */

  const parmShift = getShift();

  useEffect(() => {
    axios.get(`http://s5003013:3000/api/GetAverageOEE/${parmDepartment}/${parmDate}/${parmShift}`)
    .then(res => {

      // Collect API data
      const data = res.data;
      
      // Compile data into a useable graph configuration. There is only one graph, so no need for a data map
          const Performance = Math.trunc(data[0].WOPerformance * 100, 2);
          const Availability = Math.trunc(data[0].WOAvailability * 100, 2);
          const OEE = Math.trunc(data[0].WOPerformance * data[0].WOAvailability * 100, 2);

      // Configuration for the donut graph
      const chartData = {
        id: `average-graph-${parmDate}`,
        machineName: parmDepartment,
        labels:["Performance", "Performance Gap", "Availability", "Availability Gap"],
        series:[Performance > 100 ? 100 : Performance, Performance < 100 ? 100 - Performance : 0, 
              Availability < 100 ? 100 - Availability : 0, Availability > 100 ? 100 : Availability],
        options: {
          donut: true,
          donutWidth: '30%',
          startAngle: 270,
          showLabel: false
        },
        TotalOEE: OEE, 
        ColorOEE: OEE >= 85 ? 'green' : 'red'
      };      
      
      setAverages(chartData);
    
    })
    .catch(error => {
      console.error("ERROR FETCHING DATA", error);
    });

  }, [parmDepartment, parmDate]);

  // Fallback route
  if (!averages || averages.length === 0){
    return (
      <p style={{ fontFamily: 'Calibri', fontSize: '48px', color: '#888' }}>
        Loading averages...
      </p>
    );
  }

  return (
    <div className="donutGraphLayout"> {/* Use same class as main chart */}
      <h3>{parmHeader}</h3>
      <GenerateChart
        id={averages.id}
        labels={averages.labels}
        series={averages.series}
        options={averages.options}
        totalOEE={averages.TotalOEE}
      />
      <div className="performance">&#9632; Performance: {averages.series[0]}%</div>
      <div className="availability">&#9632; Availability: {averages.series[3]}%</div>
    </div>
  );

}

// Collect data from the production API. The average OEE, Production, and Availability will be displayed
function GetData({ parmDepartment }){
  
  // A method is defined to populate chartData once the processed data is created
  const [chartData, setChartData] = useState(null);
  
  // Fetch the sunday from the previous week for the API call
  let dateObj = new Date();
  const day  = dateObj.getDay();
  const difference = day === 0 ? 14 : day + 7;
  dateObj.setDate(dateObj.getDate() - difference);
  const parmDate = dateObj.toISOString().slice(0, 10);
        
  const parmShift = getShift();

  // API call here
  useEffect(() => {
    axios.get(`http://s5003013:3000/api/GetProductionOEE/${parmDepartment}/${parmDate}/${parmShift}`)
      .then(res => {

        // Collect data from the API response
        const data = res.data;

        // Compile data into a usable format to make into donut graphs
        const compiledData = data.map((entry, i) => {

          // Collect OEE information, then add to the sums
          const Performance = Math.trunc(entry.WOPerformance * 100, 2);
          const Availability = Math.trunc(entry.WOAvailability * 100, 2);
          const OEE = Math.trunc(entry.WOPerformance * entry.WOAvailability * 100, 2);

          // Markup information on a dynamic amount of graphs. This information will be used for gerenation, as well a percentage displays
          return {
            id: `machine-graph-${i}`,
            machineName: entry.Machine,
            labels: ["Performance", "Performance Gap", "Availability", "Availability Gap"],
            series: [Performance > 100 ? 100 : Performance, Performance < 100 ? 100 - Performance : 0, 
              Availability < 100 ? 100 - Availability : 0, Availability > 100 ? 100 : Availability],
            options: {
              donut: true,
              donutWidth: 30,
              startAngle: 270,
              showLabel: false
          },

            // Required for display information under the graph, and inside the middle circle of the graph()
            Performance: Performance,
            Availability: Availability,
            TotalOEE: OEE, 
            // Color of the OEE text
            ColorOEE: OEE >= 85 ? 'green' : 'red'
        };  
      });
      
      // Populate the chartData
        setChartData(compiledData);   // Chart data is defined here with 
      })
      .catch(error => {
        console.error("ERROR FETCHING DATA", error);
      });
    }, [parmDepartment]);

  // Now it's time to process the informaiton that we recieved from the API call
  // Clear and create a new sequence of donut graphs
  if (!chartData) 
    return <center><p>Loading...</p></center>;

  // There are a certain number of graphs per department. Half of them will occupy the top row, and the other half will occupy the bottom
  const halfway = Math.ceil(chartData.length / 2);
  const firstRow = chartData.slice(0, halfway);
  const secondRow = chartData.slice(halfway);

  // To Properly style the page, we need to return a massive HTML section that splits the graphs evenly between two different rows.
  return (
    <div> 
      {/* First Row */}
      <div className="donutGraphOutline">
        {firstRow.map(chart => (
          <div key={chart.id} className="donutGraphLayout">
            <h3>{chart.machineName}</h3>
            <GenerateChart
              id={chart.id}
              labels={[chart.labels[0], chart.labels[1], chart.labels[2], chart.labels[3]]}
              series={[chart.series[0], chart.series[1], chart.series[2], chart.series[3]]}
              options={chart.options}
              totalOEE={chart.TotalOEE}
            />
            <div className="performance"> &#9632; Performance: {chart.Performance}%</div>
            <div className='availability'>&#9632; Availability: {chart.Availability}%</div>
          </div>
        ))}
      </div>
      {/* Second Row */}
      <div className = "donutGraphOutline">
        {secondRow.map(chart => (
          <div key={chart.id} className="donutGraphLayout">
            <h3>{chart.machineName}</h3>
            <GenerateChart
              id={chart.id}
              labels={[chart.labels[0], chart.labels[1], chart.labels[2], chart.labels[3]]}
              series={[chart.series[0], chart.series[1], chart.series[2], chart.series[3]]}
              options={chart.options}
              totalOEE={chart.TotalOEE}
            />
            <div className="performance">&#9632; Performance: {chart.Performance}%</div>
            <div className='availability'>&#9632; Availability: {chart.Availability}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// This is the main HTML code, used on the root of the application
function Dashboard({ parmDepartment }) {
  
  // Set the title of the page by changing this variable
  document.title = `OEE Dashboard: ${parmDepartment}`

  // Return the main building block as HTML code
  return (
    <div className="dashboard">

      <div className="dashboardHeader">
        Department: {parmDepartment}
      </div>

      {/* Main chart area */}
      <div className="dashboardChart mainChart">
        <GetData parmDepartment={parmDepartment} />
      </div>

      {/* Bottom section with two boxes */}
      <div className="dashboardBottom">
        <AverageValues parmDepartment={parmDepartment}/>

        <div className="dashboardChart">
          {/* Requred for centering all elements within the further div */}
          <div className="longTermDataWrapper"> 
            <div className="sectionTitle">Long Term Data</div>
            <div className="longTermGraphs">
              <LongTermDataGraph parmDepartment={parmDepartment} parmDate={getDate(30)} parmHeader = '1 Month'/>
              <LongTermDataGraph parmDepartment={parmDepartment} parmDate={getDate(90)} parmHeader = '3 Months'/>
              <LongTermDataGraph parmDepartment={parmDepartment} parmDate={getDate(-1)} parmHeader = 'YTD'/>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// export {PageTitle, GetData};
export default Dashboard;

