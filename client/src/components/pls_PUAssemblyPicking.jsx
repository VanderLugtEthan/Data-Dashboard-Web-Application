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
import ctAxisTitle from 'chartist-plugin-axistitle'

// Our main method.
function Dashboard( {parmLocation, parmLines} ){
    
    // Set the title of the webpage
    document.title = 'PU Picking';

    return (
    <div  class="dashboard" style="width: 100%; height:99%;display: inline-block;">
        <div class="dashboardRow" style="width:99%; height: 99%; background-color: rgb(255, 255, 255); display: block; " align='center'>
            <div class="dashboardChart" style="width: 95%; height:99%;  background-color: rgb(255, 255, 255); " align='center'>
                <br/>
                <div align='center' class="ChartTitle">{parmLocation} PU Material Handler Dashboard By Line in Hours</div>
                <p></p>
                <div id="LinesStocked" class="ct-chart ct-bar"  align='center' style="width: 100%; height:50%;"></div>
                <p></p>
                <div align='center'>
                    <div class="passed" style="font: bold 24px Arial;" >Picked</div>
                    <div class="warning" style="font: bold 24px Arial;" >Picking</div>
                    <div class="failed" style="font: bold 24px Arial;" >To Pick</div>
                </div>
                <GetItemsByLine parmLocation={parmLocation} parmLines={parmLines} />
            </div>
        </div>
    </div>
    );
}

function GetBars( {parmLocation} ){

    // Configure options for the bar graph
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
	if (parmLines === 'BHGR') 
		parmLines = '01,02,03,04,05,06,07,09,10,11,12';
	else if (parmLines === 'BHEL') 
		parmLines = '30,31';
	else if (parmLines === 'BHLO')
		parmLines = '20';

    // Collect the data for the picking orders
    const [pickingData, getPickingData] = useState([]);
    useEffect(() => {
        axios.get(`http://s5003013:3000/api/WOsPerLine/${parmLocation}/${parmLines}`)
        .then(res => {
            const data = res.data;
            getPickingData(data);
        })
        .catch(err => {
            console.error("Error fetching data:", err);
        });
    }, [parmLocation]);

    // Fallback HTML code for when the program does not properly work
    if (pickingData.length === 0)
        return <h1>ERROR FETCHING DATA. RELOAD, AND IF THE PROBLEM PERSISTS, PLEASE CONTACT IT</h1>

    // Define labels and series here
    let labels = [];
    let series = [];
    pickingData.forEach(row => {
        labels.push(row.Line);
        series.push([row.RunReadyTime,
            row.PickingNowTime,
            row.UnPickedTime
        ]);
    })

    // Create a table based on the collected data.
    // Style changes based on the contents of the page. Keep it here.
    let elwidth  = document.getElementById("WOsByLine").getBoundingClientRect().width / (pickingData.length) * .91;

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