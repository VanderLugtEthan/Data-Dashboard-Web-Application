import '../style/chartist.min.css';
import '../style/pls_PUAssembly.css';

/**
 * This method can be named whatever you want. This method returns the main HTML Framework for the page.
 * It is later exported 
 */
function Dashboard( { ParmLocation, ParmLine } ) {
    
    // Change the title of the webpage here, then return the main HTML code
    document.title = 'PU Assembly'
    return (
        <div className="dashboard">
            {/* React JSX files have slightly different syntax for HTML code. many properties like class use camelCase instead */}
            
            <div className="dashboardRow graphRow">
                {/* First Shift Testing */}
                <div className="dashboardChart">
                    <br/>
                    <div className="align ChartTitle">Test result totals for 1st Shift</div>
                    <br/>
                    <div className="alignItems">
                        <div id="FirstShift" className="ct-chart"></div>
                    </div>
                    <br/>
                    <div className="alignItems">
                        Percent Failures&nbsp;
                        <div id="Shift1FailedPercent" className="failed">??</div>
                        <div className="align center">Percent Passes </div>&nbsp;
                        <div id="Shift1PassedPercent" className="passed">??</div>
                    </div>
                    <br/>
                    <div className="alignItems">
                        Total Failures&nbsp;
                        <div id="Shift1FailedTotal" className="failed" style={{display: 'inline-block'}}>?</div>
                        <div className="align" style={{display: 'inline-block'}}>Total Passes </div>&nbsp;
                        <div id="Shift1PassedTotal" className="passed" style={{display: 'inline-block'}}>?</div>
                    </div>
                    {/* <div align='center'>
                        Packed&nbsp;
                        <div id="Shift1Packed" className="passed" style={{display: 'inline-block'}}>?</div>
                    </div> */}
                </div>
                <div className="dashboardChart" style={{width: '47%', height: '100%', display: 'inline-block', backgroundColor: 'rgb(255, 255, 255)'}}>
                    <br/>
                    <div align='center' className="ChartTitle">Location:{ ParmLocation } 
                        Line:{ ParmLine } Power Unit Hourly Tests</div>
                    <div id="TargetRate" className="ct-chart" style={{width: '99%', height: '84%'}}></div>
                    <div align='center'>  
                        <div className="passed">&nbsp;PASSED&nbsp;</div>
                        <div className="target">&nbsp;TARGET&nbsp;</div>
                        <div className="failed">&nbsp;FAILED&nbsp;</div>
                    </div>
                </div>
                <div className="dashboardChart" style={{width: '25%', height: '100%', display: 'inline-block', backgroundColor: 'rgb(255, 255, 255)'}}>
                    <br/>
                    <div align='center' className="ChartTitle">Test result totals for 2nd Shift</div>
                    <br/>
                    <div align='center'>
                        <div id="SecondShift" className="ct-chart" style={{width: '90%', height: '70%'}}></div>
                    </div>
                    <br/>
                    <div align='center' >
                        Percent Failures&nbsp;
                        <div id="Shift2FailedPercent" className="failed" style={{display: 'inline-block'}}>??</div>
                        <div align='center' style={{display: 'inline-block'}}>Percent Passes </div>&nbsp;
                        <div id="Shift2PassedPercent" className="passed" style={{display: 'inline-block'}}>??</div>
                    </div>
                    <br/>
                    <div align='center'>
                        Total Failures&nbsp;
                        <div id="Shift2FailedTotal" className="failed" style={{display: 'inline-block'}}>?</div>
                        <div align='center' style={{display: 'inline-block'}}>Total Passes </div>&nbsp;
                        <div id="Shift2PassedTotal" className="passed" style={{display: 'inline-block'}}>?</div>
                    </div>
                    {/* <div align='center'>
                        Packed&nbsp;
                        <div id="Shift2Packed" className="passed" style="display: inline-block">?</div>
                    </div> */}
                </div>
            </div>
            <div className="dashboardRow" style={{width: '100%', height: '10%', backgroundColor: 'rgb(255, 255, 255)'}}>
                <div className="dashboardChart" align='center' style={{width: '98.75%', height: '100%', display: 'inline-block', backgroundColor: 'rgb(255, 255, 255)'}}>
                    {/*<div id= className="ct-chart" style="width: 90%; height:66%; " visible="true"> </div> NOT POSSIBLE IN JSX
                    visible attribute for these three elements here*/}
                        <div align='center' className="ChartTitle">Line Alerts</div>
                        <div id="AlertPick" className="AlertPick" style={{width: '24%', display: 'inline-block'}}><span className="text">Picking Alert</span></div>
                        <div id="AlertHelp" className="AlertHelp" style={{width: '24%', display: 'inline-block'}}><span className="text">Help Alert</span></div>
                        <div id="AlertDown" className="AlertDown" style={{width: '24%', display: 'inline-block'}}><span className="text">Line Down</span></div>
                    </div>
                    <div id="PickedChart" className="ct-chart ct-bar"  align='center' style={{width: '100%', height:'10%'}}></div>
                </div>
            <div className="dashboardRow" style={{width:'100%', height: '43%', backgroundColor: 'rgb(255, 255, 255)'}}>
                <div className="dashboardChart" style={{width: '98.75%', height:'99%', display: 'inline-block', backgroundColor: 'rgb(255, 255, 255)'}}>
                    <div align='center' className="ChartTitle">Power Unit Production Schedule</div>
                    <div align='center'>
                        <div id="JobSchedule" style={{width: '99%', height: '100%'}}>Waiting</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function testResults( { parmDepartment, parmLine, parmShift } ){

}


// Export the default 
export default Dashboard;