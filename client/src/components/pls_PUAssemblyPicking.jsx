/**
 * This is a revision of Stephen Grody's PUAssemblyPicking dashboard, rewritten by scratch in React
 * This dashboard displays picking orders, and their statuses on screen in bar chart form
 * 
 * @author Ethan VanderLugt
 * @rev 2025-08-12
 * 
 */

// Needed for site rendering and api calls
import { useEffect, useState } from 'react';
import axios from 'axios'; 

// chartist imports
import { BarChart } from "chartist";

// Stylesheets
import '../style/chartist.min.css';
import '../style/pls_PUAssemblyPicking.css';

// Our main method.
function Dashboard( {parmLocation, parmLines} ){
    
    // Set the title of the webpage
    document.title = 'PU Picking';

    // Return content generatied by other methods
    return (
    <div  className="dashboard">
        <div className="dashboardRow">
            <div className="dashboardChart">
                <br/>
                <div align='center' className="ChartTitle">{parmLocation} PU Material Handler Dashboard By Line in Hours</div>
                <p></p>
                <div id="LinesStocked" className="ct-chart ct-bar"></div>
                <p></p>
                <div align='center'>
                    <div className="passed">Picked</div>
                    <div className="warning">Picking</div>
                    <div className="failed">To Pick</div>
                </div>
                <GetItemsByLine parmLocation={parmLocation} parmLines={parmLines} id="WOsByLine"/>
            </div>
        </div>
    </div>
    );
}

function GetBars( {parmLocation} ){
    // Configure options for the bar graph
  const ctAxisTitle = require('chartist-plugin-axistitle');
    const optionsBar = {
		type: 'bar',
		reverseData: true,
        stackBars: true,
		seriesBarDistance: 40,
		beginAtZero: true,
		chartPadding: 40,
		low: 0,
		high: 50,
		axisY: {
        	onlyInteger: true
        },
		plugins: [
			ctAxisTitle({
				axisY: {
					axisTitle: "Amount",
					axisClass: "ct-axis-title",
					textAnchor: 'middle',
					flipTitle: false,
				},
				axisX: {
					axisTitle: "Lines",
					axisClass: "ct-axis-title",
					textAnchor: 'middle',
					flipTitle: false
				}
			})
		]
	};

    // API call to collect data
    const [pickingData, getPickingData] = useState([]);
    useEffect(res => {
        axios.get(`http://s5003013:3000/api/ScheduledVsPicked/:`)
    })

}

function GetItemsByLine( {parmLocation} ){
    // Depending on the input, the lines pulled for the application depends on the location
    let parmLines = '';
	if (parmLocation === 'BHGR') 
		parmLines = '01,02,03,04,05,06,07,09,10,11,12';
	else if (parmLocation === 'BHEL') 
		parmLines = '30,31';
	else if (parmLocation === 'BHLO')
		parmLines = '20';

    // Collect the data for the picking orders
    const [pickingData, getPickingData] = useState([]);
    useEffect(() => {
        axios.get(`http://localhost:3000/api/WOsPerLine/${parmLocation}/${parmLines}`)
        .then(res => {
            console.log(res.data);
            const data = res.data;
            getPickingData(data);
        })
        .catch(err => {
            console.error("Error fetching data:", err);
        });
    }, [parmLocation]);

    console.log(pickingData);
    // Fallback HTML code for when the program does not properly work
    if (pickingData.length === 0)
        return <h1>ERROR FETCHING DATA. RELOAD, AND IF THE PROBLEM PERSISTS, PLEASE CONTACT IT</h1>

    // Define labels and series here
    let labels = [];
    let series = [];
    pickingData.map(row => {
        labels.push(row.Line);
        series.push([row.RunReadyTime,
            row.PickingNowTime,
            row.UnPickedTime
        ]);
    })

    // Create a table based on the collected data.
    // Style changes based on the contents of the page. Keep it here.
    let elwidth  =  4;//document.getElementById("WOsByLine").getBoundingClientRect().width / (pickingData.length) * .91;

    return (
    <table border="0">
      <tr>
        <td style={{ width: `${elwidth / 2.5}px` }}></td>
        {series.map((item, index) => (
          <td
            key={index}
            style={{
              width: `${elwidth}px`,
              textAlign: 'center',
              verticalAlign: 'top',
            }}
          >
            {item}
          </td>
        ))}
      </tr>
    </table>
  );

} 

export default Dashboard