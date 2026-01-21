const express = require('express');
const app = express();

module.exports = function(app){
    const db = require('./db');
    app.get('/api/test/:ParmLocation/:ParmLine', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        console.log('API test called' + ParmLocation + ParmLine );
        res.send('API test parms: ' + ParmLocation + ParmLine );
    })
    app.get('/api/ProductionSchedule/:ParmLocation/:ParmLine', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        //const dateTime = new Date();
        if (debugMode == true) {
            console.log('/api/ProductionSchedule called for ' + ParmLocation + ParmLine + ' @ ' + Date());
        }
        {
        var query =  `SELECT top (SELECT isnull((SELECT JobsMax FROM LineOptions WHERE Location = '${ParmLocation}' AND line = '${ParmLine}' AND DepartmentID = 22 ),12) AS JobsMax) ` + ' ' + 
                `JOBE.Seq, JOBE.Priority, RTRIM(Job.JDEItm) As JDEItem, JOB.FlashMsg As FlashMessage,
                JOB.QtyOrd As QtyOrdered,JOB.QtyOpen As QtyOpen, JOB.PickPct, CONVERT(Char(10),JOB.ReqDte,126) As RequestDate,
                ISNULL(JobE.HourRate,0) As HourRate, JOB.PackCount, JOB.JDEWO As WO, CONVERT(Char(15),JOB.JDESO) As SO,
                CASE LO.ExcludeCustomersFromDashboard
                  When 1 Then ''
                  ELSE LEFT(Job.SOLDTo,15)
                End  As SoldTo,
                ISNULL(C.AssyComments,'') As AssemblyComment, JOB.WOSts as WOStatus,
                JobE.Exception, ISNULL(JobE.Priority,''), JobE.Released,
                STUFF ((SELECT CONCAT(ISNULL(ExceptionType,''),':',ISNULL(MissingPart,''),'/Qty:',
                        ISNULL(MissingQty,0), '/',ISNULL(Comments,''),CHAR(13),CHAR(10))
                FROM [BHBrowser].[dbo].[ProdJobStsExceptDtl] as ED
                WHERE ED.JDEWO =  JOB.JDEWO   And ED.JDESO = Job.JDESO AND ED.ClearDteTme IS NULL
                ORDER BY  ED.ID
                FOR XML PATH(''),TYPE).value('.','VARCHAR(MAX)'
                ), 1, 0, '') As EDComments
                From [BHBrowser].[dbo].[ProdJobSts` + ParmLocation.slice(-2) + `] AS JOB
                LEFT JOIN [BHBrowser].[dbo].[ProdJobSts` +  ParmLocation.slice(-2) + `Extra] JobE ON JobE.JDEWO = Job.JDEWO And JobE.JDESO = Job.JDESO --And JobE.LneNbr = Job.LneNbr
                LEFT JOIN [BHBrowser].[dbo].[ProdJobSts` +  ParmLocation.slice(-2) +
                `Comm3] C      ON C.JDEWO =  JOB.JDEWO   And C.JDESO = Job.JDESO    
                LEFT JOIN [BHBrowser].[dbo].[LineOptions] LO ON LO.FloorArea = 'PU' AND LO.Line = '${ParmLine}'  
                where JobE.line = '${ParmLine}'
                ORDER BY SEQ`
        }
        //EL has two sets of seperate tables.  use those with a PU
        if ( ParmLocation.slice(-2) == "EL") {
            query = query.replace(/ProdJobStsEL/gi, "ProdJobStsELPU");
        }
        // console.log(query); // Testing
        var PromiseBHBrowserJobs = db.DBQueryBHBrowser(query);
        PromiseBHBrowserJobs.then(function(result) {
            const dateTime = new Date();
            if (debugMode == true) {
                console.log('/api/ProductionSchedule completed @ ' + Date());
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log(`Promise Rejected for api/ProductionSchedule ${ParmLocation} ${ParmLine} ` + Date());
        });
    })
    app.post('/api/ProductionScheduleFilter/:ParmLocation/:ParmLine', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        if (debugMode == true) {
            console.log('/api/24ProductionScheduleFilter called for ' + ParmLocation + ParmLine + ' @ ' + Date());
        }
        {
        var query = `UPDATE  [BHBrowser].[dbo].[LineOptions]  SET ExcludeCustomersFromDashboard = ExcludeCustomersFromDashboard ^ 1 WHERE Location = '${ParmLocation}' --and Line = '${ParmLine}'`
        }
        
        var PromiseBHBrowserJobs = db.DBQueryBHBrowser(query);
        PromiseBHBrowserJobs.then(function(result) {
            const dateTime = new Date();
            if (debugMode == true) {
                console.log('/api/24ProductionScheduleFilter completed @ ' + Date());
            }
            res.send(result);
        }).catch(function () {
            console.log("Promise Rejected for api/ProductionScheduleFilter");
        });
    })
    app.get('/api/LineInfo/:ParmLocation/:ParmArea/:ParmLine', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmArea = req.params.ParmArea;
        var ParmLine = req.params.ParmLine;
        if (debugMode == true) {
            console.log('/api/LineInfo called for ' + ParmLocation + ParmLine + ' @ ' + Date());
        }
        {
        var query = `SELECT  * FROM [BHBrowser].[dbo].[LineOptions]  WHERE Location = '${ParmLocation}' and Line = '${ParmLine}' AND FloorArea = '${ParmArea}'`
        }
        
        var PromiseBHBrowserPickingAlert = db.DBQueryBHBrowser(query);
        PromiseBHBrowserPickingAlert.then(function(result) {
            if (debugMode == true) {
                console.log('/api/LineInfo completed @ ' + Date());
            }
            res.send(result);
        }).catch(function () {
            console.log("Promise Rejected for api/LineInfo");
        });
    })
    app.get('/api/WOsPerLine/:ParmLocation/:ParmLines', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLines = req.params.ParmLines;
        //const dateTime = new Date();
        if (debugMode == true) {
            console.log('/api/ProductionSchedule called for ' + ParmLocation + ParmLines + ' @ ' + Date());
        }
        {
        var query = ` 
        SELECT value As Line INTO #ParmLines${ParmLocation} FROM STRING_SPLIT('${ParmLines}', ',');
        WITH T1 AS (SELECT JobE.line AS Line,SEQ, '<DIV class="' +
            case
                when ISNULL(PickPct,0) = 100 THEN 'picked' 
                when ISNULL(PickPct,0) BETWEEN 1 AND 99 THEN 'picking'
                else 'pick'
            end + '" style="width: 100%;">' + TRIM(JOB.JDEWO) As WO, 
        Picked, PickedBy, ISNULL(PickPct,0) as PickPercent
        FROM #ParmLines${ParmLocation} PL
        LEFT JOIN [BHBrowser].[dbo].[ProdJobSts${ParmLocation.slice(-2)}Extra] JobE ON JobE.Line = PL.Line
        JOIN [BHBrowser].[dbo].[ProdJobSts${ParmLocation.slice(-2)}] AS JOB ON Job.JDEWO = JobE.JDEWO AND Job.JDESO = JobE.JDESO
        where  (Job.QtyOrd - PackCount > 0 AND JobE.Exception <> 'Y')
        )
        SELECT DISTINCT T1.Line,   CONCAT('<b>',T1.Line,'</b>','<br>',(SELECT
          STUFF(
            (
            SELECT T2.WO + ',' + trim(STR(PickPercent)) + '</DIV>'
            FROM T1 as T2
            WHERE T2.Line = T1.Line
            ORDER BY  T2.Line, T2.SEQ 
            FOR XML PATH(''),TYPE).value('.','VARCHAR(MAX)'
            ), 1, 0, '') As concatenated_string)) as HTML
        FROM T1 
        ORDER BY T1.line;
        DROP TABLE #ParmLines${ParmLocation};`
        }
        //EL has two sets of seperate tables.  use those with a PU
        if ( ParmLocation.slice(-2) == "EL") {
            query = query.replace(/ProdJobStsEL/gi, "ProdJobStsELPU");
        }
        
        console.log(ParmLocation); // Testing
        
        var PromiseBHBrowserJobs = db.DBQueryBHBrowser(query);
        PromiseBHBrowserJobs.then(function(result) {
            const dateTime = new Date();
            if (debugMode == true) {
                console.log('/api/ProductionSchedule completed @ ' + Date());
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log(`Promise Rejected for api/ProductionSchedule ${ParmLocation} ${ParmLines} ` + Date());
        });
    })
    app.get('/api/ScheduledVsPicked/:ParmLocation/:ParmLines', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLines = req.params.ParmLines;
        //const dateTime = new Date();
        if (debugMode == true) {
            console.log('/api/ScheduledVsPicked called for ' + ParmLocation + ParmLines + ' @ ' + Date());
        }
        {
        var query = `
        SELECT value As Line INTO #ParmLines${ParmLocation} FROM STRING_SPLIT('${ParmLines}', ',');
        SELECT Line,
        (SELECT  SUM(CAST((JS.QtyOrd - PackCount) / cast(HourRate as decimal(5,2)) AS decimal(5,2)))  AS RunReadyTime
        from ProdJobSts JS
        JOIN ProdJobStsExtra E ON E.JDEWO = JS.JDEWO
        where E.Line = PL.Line AND ISNULL(PickPct,0) = 100 AND E.Exception <> 'Y'
        GROUP BY Line) AS RunReadyTime,
        ISNULL((SELECT  SUM(CAST((JS.QtyOrd - PackCount) / cast(HourRate as decimal(5,2)) AS decimal(5,2)))  AS PickingNowTime
        from ProdJobSts JS
        JOIN ProdJobStsExtra E ON E.JDEWO = JS.JDEWO
        where E.Line = PL.Line AND ISNULL(PickPct,0) BETWEEN 1 and 99 --and ISNULL(PickedBy,'') <> ''
        GROUP BY Line) ,0) AS PickingNowTime,
        (SELECT   SUM(CAST((JS.QtyOrd - PackCount) / cast(HourRate as decimal(5,2)) AS decimal(5,2)))  AS UnPickedTime
        from ProdJobSts JS
        JOIN ProdJobStsExtra E ON E.JDEWO = JS.JDEWO
        where E.Line = PL.Line AND ISNULL(PickPct,0) = 0 and ISNULL(PickedBy,'') = ''
        GROUP BY Line) AS UnPickedTime
		INTO #data${ParmLocation}
        FROM #ParmLines${ParmLocation} PL
        ORDER BY LINE
		
        SELECT * from #data${ParmLocation} --where ISNULL(RunReadyTime,0) + ISNULL(PickingNowTime,0) > 0
        ORDER BY LINE DESC

        DROP TABLE #data${ParmLocation}
        DROP TABLE #ParmLines${ParmLocation}`
        }
        //Put location as part of table name  (arg!!)
        query = query.replace(/ProdJobSts/gi, `ProdJobSts${ParmLocation.slice(-2)}`);
        //EL has two sets of seperate tables.  use those with a PU
        if ( ParmLocation.slice(-2) == "EL") {
            query = query.replace(/ProdJobStsEL/gi, "ProdJobStsELPU");
        }
        //console.log(query);
        
        var PromiseBHBrowserPicks = db.DBQueryBHBrowser(query);
        PromiseBHBrowserPicks.then(function(result) {
            const dateTime = new Date();
            if (debugMode == true) {
                console.log('/api/ScheduledVsPicked completed @ ' + Date());
            }
            //console.log(result.recordset);
            res.send(result.recordset);
        }).catch(function () {
            console.log(`Promise Rejected for api/ScheduledVsPicked ${ParmLocation} ${ParmLines} ` + Date());
        });
    })
    app.get('/api/ProductionScheduleJDSVC/:ParmLocation/:ParmLine', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        //const dateTime = new Date();
        if (debugMode == true) {
            console.log('/api/24ProductionScheduleJDSCV called for ' + ParmLocation + ParmLine + ' @ ' + Date());
        }
        {
        var query = `select CustItem, JDEItm, Desc1, Qty, COUNT(TD.ID) as QtyTested, Notes
        from      ProdJobSchedSCV Sched
        left join [S5005002\\TESTRACK].TestRack.[dbo].[JD5000SCVTestData] TD
        on right(RTRIM(AssyID),7) = CustItem and TestResult = 'Pass' 
        and TD.TimeStamp between DATEADD(wk, DATEDIFF(wk, 0,GETDATE()),0) and DATEADD(wk, DATEDIFF(wk, 0,GETDATE()),0) + 6
            where WeekStarting =  DATEADD(wk, DATEDIFF(wk, 0,GETDATE()),0)
            group by CustItem, JDEItm, Desc1, Qty, Notes, Sched.ID
            order by Sched.ID;`
        }
        
        var PromiseBHBrowserJobs = db.DBQueryBHBrowser(query);
        PromiseBHBrowserJobs.then(function(result) {
            const dateTime = new Date();
            if (debugMode == true) {
                console.log('/api/24ProductionScheduleJDSCV completed @ ' + Date());
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log(`Promise Rejected for api/ProductionScheduleJDSCV ${ParmLocation} ${ParmLine} ` + Date());
        });
    })
    app.get('/api/ProductionSchedulePump/:ParmLocation/:ParmLine', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        //const dateTime = new Date();
        if (debugMode == true) {
            console.log('/api/ProductionSchedulePump called for ' + ParmLocation + ParmLine + ' @ ' + Date());
        }
        {
        var query = `SELECT ProdJobStsNWExtra.Seq, --StdHours,
        substring(CONVERT(VARCHAR(10),StrDte),3,7) AS StrDte, substring(CONVERT(VARCHAR(10),ReqDte),3,7) AS ReqDte,  
        ProdJobStsNW.JDEWO, 
        QtyOrd, QtyOpen,
        SUBSTRING(SoldTo,0,5) AS SoldTo, WOSts, JDEItm,
        REPLACE(Desc1,'P ASSY,','') AS Desc1, --Desc2,   
        --CrossRef, CustPart, 
        MissingParts, 
        --PackCount, TimeWorkFlag, MissingPartsHist, ProdJobStsNWExtra.Priority,
        --ISNULL(ProdJobStsNWComm.Comments,'') as ProdComments, ISNULL(AssyComments,'') AS AssyComments,
        --JDEWorkCtr,  Picked, 
        FlashMsg AS F, ProdJobStsNWExtra.Exception AS E
        FROM ProdJobStsNW
        LEFT OUTER JOIN ProdJobStsNWComm ON ProdJobStsNW.JDEWO = ProdJobStsNWComm.JDEWO
        AND ProdJobStsNW.JDESO = ProdJobStsNWComm.JDESO
        LEFT OUTER JOIN ProdJobStsNWComm3 ON ProdJobStsNW.JDEWO = ProdJobStsNWComm3.JDEWO
        AND ProdJobStsNW.JDESO = ProdJobStsNWComm3.JDESO
        LEFT OUTER JOIN ProdJobStsNWMissParts ON ProdJobStsNW.JDEWO = ProdJobStsNWMissParts.JDEWO
        AND ProdJobStsNW.LneNbr = ProdJobStsNWMissParts.LneNbr
        LEFT OUTER JOIN ProdJobStsNWExtra ON ProdJobStsNW.JDEWO = ProdJobStsNWExtra.JDEWO
        AND ProdJobStsNW.JDESO = ProdJobStsNWExtra.JDESO
        WHERE WOSts < '90' 
        --AND (SoldTo IS NULL OR SoldTo LIKE '%%') 
        and Department LIKE CASE
                            WHEN   '${ParmLine}' = 'Modular' THEN 'Modular Pump'
                            WHEN   '${ParmLine}' = 'IPump' THEN 'I-Pump'
                            WHEN   '${ParmLine}' = 'AP100' THEN 'AP100' -- LIKE 'AP%' THEN '%AP%Pump'
                            WHEN   '${ParmLine}' = 'AP212' THEN 'AP212 Pump'
                            ELSE 'Invalid Line'
                        END
        and Machine > ''
        ORDER BY Seq, ReqDte`
        }
        //console.log(query) // Testing
        var PromiseBHBrowserJobs = db.DBQueryBHBrowser(query);
        PromiseBHBrowserJobs.then(function(result) {
            const dateTime = new Date();
            if (debugMode == true) {
                console.log('/api/ProductionSchedulePump completed @ ' + Date());
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log("Promise Rejected for api/ProductionSchedulePump");
        });
    })
    app.get('/api/ProductionHistoryPump/:ParmLocation/:ParmLine', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        //const dateTime = new Date();
        if (debugMode == true) {
            console.log('/api/ProductionHistoryPump called for ' + ParmLocation + ParmLine + ' @ ' + Date());
        }
        {
        var query = `select CustItem, JDEItm, Desc1, Qty, COUNT(TD.ID) as QtyTested, Notes
        from      ProdJobSchedSCV Sched
        left join [S5005002\\TESTRACK].TestRack.[dbo].[JD5000SCVTestData] TD
        on right(RTRIM(AssyID),7) = CustItem and TestResult = 'Pass' 
        and TD.TimeStamp between DATEADD(wk, DATEDIFF(wk, 0,GETDATE()),0) and DATEADD(wk, DATEDIFF(wk, 0,GETDATE()),0) + 6
            where WeekStarting =  DATEADD(wk, DATEDIFF(wk, 0,GETDATE()),0)
            group by CustItem, JDEItm, Desc1, Qty, Notes, Sched.ID
            order by Sched.ID;`
        }
        
        var PromiseBHBrowserJobs = db.DBQueryBHBrowser(query);
        PromiseBHBrowserJobs.then(function(result) {
            const dateTime = new Date();
            if (debugMode == true) {
                console.log('/api/ProductionHistoryPump completed @ ' + Date());
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log("Promise Rejected for api/ProductionHistoryPump");
        });
    })
    app.get('/api/24HourTrend/:ParmLocation/:ParmLine', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        if (debugMode == true) {
            console.log('/api/24HourTrend called for ' + ParmLocation + ParmLine + ' @ ' + Date());
        }
        //console.log('API parms: ' + ParmLocation + ParmLine );
        const dateTime = new Date();
        const StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1));
        const EndOfPeriod= new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 2));
        //console.log('24hours: ' + StartOfPeriod + '-' + EndOfPeriod)

        // ' Show last 24 hours, but exclude all leading 0 test hours
        // ' Add in the 0 tests in the middle of shifts from temp table
        // ' Add HourRate from ... as a goal line based on first order item worked on that hour
        {
        var query = "SET NOCOUNT ON  \n" +
            "DECLARE @MachID INT  = " + ParmLine + "\n" +
            "-- Get first test time hour that happened after 24 hours ago. \n" +
            "DECLARE @hour INT = (SELECT TOP 1 DATEPART(hour, T1.TIME) As StartDateTime FROM [testrack].[dbo].TestData As T1 WHERE MACHID =  @MachID And  T1.TIME > GetDate() - 1 )  \n" +
            "CREATE TABLE dbo.#DateHours ( DateHour varchar(11) ) ; \n" +
            "Declare @hourcount int = 0; \n" +
            "WHILE @hourcount < 24 \n" +
            "BEGIN  \n" +
            "	INSERT INTO #DateHours (DateHour) VALUES ( \n" +
            "		Case  \n" +
                        "When @hour > DATEPART(hour, getdate()) Then Case \n" +
                            "WHEN @HOUR > 9 THEN CONCAT(DATEPART(month,getdate() - 1), '-', DATEPART(day,getdate() - 1 ) , ' ', @hour) \n" +
                            "Else      CONCAT(DATEPART(month,getdate() - 1), '-', DATEPART(day,getdate() - 1 ) , ' 0', @hour)\n" +
                            "End\n" +
        "Else Case \n" +
                            "WHEN @HOUR > 9 THEN CONCAT(DATEPART(month,getdate()), '-', DATEPART(day,getdate()) , ' ', @hour) \n" +
                            "Else CONCAT(DATEPART(month,getdate()), '-', DATEPART(day,getdate()) , ' 0', @hour) \n" +
                            "End\n" +
"End) \n" +
            "   SET @hour = @hour + 1; \n" +
            "   if @hour = 24 SET @hour = 0; \n" +
            "   SET @hourcount = @hourcount + 1; \n" +
            "END;\n"
        // 2022-04 SLG Removed below from query per Mike not needed.
        // "count(DatePart(Hour, T1.[TIME])) As Tests, \n" +
        query += "select top 24    \n" +
            "CASE  \n" +
            "WHEN RIGHT(DH.DateHour,2) > 11 THEN CONCAT(SUBSTRING(DH.DateHour,1, LEN(DH.DateHour) - 2),  (Right(DH.DateHour,2) - 12),  'PM') \n" +
            "Else CONCAT(DH.DateHour, 'AM') \n" +
            "End As [DateHour], \n" + 
            "ISNULL(T1.HourRate,15)  AS Target, \n" +
            "count(DATEPART(hour,TFails.[TIME])) AS Fails,    \n" +
            "count(DATEPART(hour,TPasses.[TIME])) AS Passes \n" +
            "FROM #DateHours DH \n" +
            "Left Join [testrack].[dbo].TestData As T1 On DATEPART(hour, T1.[Time]) = right(DH.DateHour,2) \n"
        if (ParmLocation = "BHEL" ) {
            query += "AND DATEADD(HH,-1, T1.TIME) "
        } else {
            query += "AND T1.TIME "
        }
        query += "BETWEEN '" + StartOfPeriod + "' and '" + EndOfPeriod + "' \n" +
                                "AND T1.MACHID = @MachID AND (T1.Warranty = 0 OR T1.Warranty IS NULL) AND T1.MODELDISP NOT LIKE 'Q%' \n" +
                                "AND ((T1.TESTRESULT LIKE '%PASS%') or \n" +
                                "     (T1.TestResult NOT LIKE '%PASS%' AND RTRIM(T1.TESTRESULT) <> 'OFFLINE')) \n" +

            "LEFT JOIN [testrack].[dbo].TestData As TPasses On TPasses.[Time] = T1.[Time] \n" +
            "     And TPasses.MACHID = @MachID And (TPasses.Warranty = 0 Or TPasses.Warranty Is NULL) And TPasses.MODELDISP Not Like 'Q%' \n" +
            "     AND TPasses.TESTRESULT LIKE '%PASS%' \n" +

            "LEFT JOIN [testrack].[dbo].TestData AS TFails ON TFails.[Time] = T1.[Time] \n" +
            "     AND TFails.MACHID  = @MachID AND (TFails.Warranty  = 0 OR TFails.Warranty  IS NULL) AND TFails.MODELDISP NOT LIKE 'Q%' \n" +
            "     AND TFails.TestResult NOT LIKE '%PASS%' AND RTRIM(TFails.TESTRESULT) <> 'OFFLINE' AND TFails.RETESTDISP <> 'Override'\n" +
            
            "WHERE T1.[Time] >  DATEADD(HOUR, 1, DATEADD(day, -1, GETDATE())) \n" +
                                "GROUP BY [DH].[DateHour], [T1].[HourRate]\n" +
            "ORDER BY Left(DateHour,CHARINDEX(' ',DateHour)), RIGHT([DateHour],2), substring([DateHour],CHARINDEX(' ',DateHour)+1,2);\n"
        query += "DROP TABLE dbo.#DateHours;  "
        }
        
        //console.log(query); // Testing

        var TestRackPromise = db.DBQueryTestRack(query);
        TestRackPromise.then(function(result) {
            if (debugMode == true) {
                console.log('/api/24HourTrend' + ParmLine + '  completed @ ' + Date());
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log("Promise Rejected for api/24hourTrend");
        });
    })
    app.get('/api/24HourTrendBranch/:ParmLocation/:ParmLine', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        if (debugMode == true) {
            console.log('/api/24HourTrend called for ' + ParmLocation + ' @ ' + Date());
        }
        //console.log('API parms: ' + ParmLocation + ParmLine );
        const dateTime = new Date();
        const StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1));
        const EndOfPeriod= new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 2));
        //console.log('24hours: ' + StartOfPeriod + '-' + EndOfPeriod)

        // ' Show last 24 hours, but exclude all leading 0 test hours
        // ' Add in the 0 tests in the middle of shifts from temp table
        // ' Add HourRate from ... as a goal line based on first order item worked on that hour
        {
        var query = "SET NOCOUNT ON  \n" +
            "DECLARE @MachID INT  = " + ParmLine + "\n" +
            "-- Get first test time hour that happened after 24 hours ago. \n" +
            "DECLARE @hour INT = (SELECT TOP 1 DATEPART(hour, T1.TIME) As StartDateTime FROM [testrack].[dbo].TestData As T1 WHERE MACHID =  @MachID And  T1.TIME > GetDate() - 1 )  \n" +
            "CREATE TABLE dbo.#DateHours ( DateHour varchar(11) ) ; \n" +
            "Declare @hourcount int = 0; \n" +
            "WHILE @hourcount < 24 \n" +
            "BEGIN  \n" +
            "	INSERT INTO #DateHours (DateHour) VALUES ( \n" +
            "		Case  \n" +
                        "When @hour > DATEPART(hour, getdate()) Then Case \n" +
                                                                    "WHEN @HOUR > 9 THEN CONCAT(DATEPART(month,getdate() - 1), '-', DATEPART(day,getdate() - 1 ) , ' ', @hour) \n" +
                                                                    "Else      CONCAT(DATEPART(month,getdate() - 1), '-', DATEPART(day,getdate() - 1 ) , ' 0', @hour)\n" +
                                                                    "End\n" +
        "Else Case \n" +
                                                                    "WHEN @HOUR > 9 THEN CONCAT(DATEPART(month,getdate()), '-', DATEPART(day,getdate()) , ' ', @hour) \n" +
                                                                    "Else CONCAT(DATEPART(month,getdate()), '-', DATEPART(day,getdate()) , ' 0', @hour) \n" +
                                                                    "End\n" +
        "End) \n" +
            "   SET @hour = @hour + 1; \n" +
            "   if @hour = 24 SET @hour = 0; \n" +
            "   SET @hourcount = @hourcount + 1; \n" +
            "END;\n"
        // 2022-04 SLG Removed below from query per Mike not needed.
        // "count(DatePart(Hour, T1.[TIME])) As Tests, \n" +
        query += "select top 24    \n" +
            "CASE  \n" +
            "WHEN RIGHT(DH.DateHour,2) > 11 THEN CONCAT(SUBSTRING(DH.DateHour,1, LEN(DH.DateHour) - 2), (Right(DH.DateHour,2) - 12),  'PM') \n" +
            "Else CONCAT(DH.DateHour , 'AM') \n" +
            "End As [DateHour], \n" + 
            "ISNULL(T1.HourRate,15)  AS Target, \n" +
            "count(DATEPART(hour,TFails.[TIME])) AS Fails,    \n" +
            "count(DATEPART(hour,TPasses.[TIME])) AS Passes \n" +
            "FROM #DateHours DH \n" +
            "Left Join [testrack].[dbo].TestData As T1 On DATEPART(hour, T1.[Time]) = right(DH.DateHour,2) \n"
        if (ParmLocation = "BHEL" ) {
            query += "AND DATEADD(HH,-1, T1.TIME) "
        } else {
            query += "AND T1.TIME "
        }
        query += "BETWEEN '" + StartOfPeriod + "' and '" + EndOfPeriod + "' \n" +
                                "AND T1.MACHID = @MachID AND (T1.Warranty = 0 OR T1.Warranty IS NULL) AND T1.MODELDISP NOT LIKE 'Q%' \n" +
                                "AND ((T1.TESTRESULT LIKE '%PASS%') or \n" +
                                "     (T1.TestResult NOT LIKE '%PASS%' AND RTRIM(T1.TESTRESULT) <> 'OFFLINE')) \n" +

            "LEFT JOIN [testrack].[dbo].TestData As TPasses On TPasses.[Time] = T1.[Time] \n" +
            "     And TPasses.MACHID = @MachID And (TPasses.Warranty = 0 Or TPasses.Warranty Is NULL) And TPasses.MODELDISP Not Like 'Q%' \n" +
            "     AND TPasses.TESTRESULT LIKE '%PASS%' \n" +

            "LEFT JOIN [testrack].[dbo].TestData AS TFails ON TFails.[Time] = T1.[Time] \n" +
            "     AND TFails.MACHID  = @MachID AND (TFails.Warranty  = 0 OR TFails.Warranty  IS NULL) AND TFails.MODELDISP NOT LIKE 'Q%' \n" +
            "     AND TFails.TestResult NOT LIKE '%PASS%' AND RTRIM(TFails.TESTRESULT) <> 'OFFLINE' AND TFails.RETESTDISP <> 'Override'\n" +
            
            "WHERE T1.[Time] >  DATEADD(HOUR, 1, DATEADD(day, -1, GETDATE())) \n" +
                                "GROUP BY [DH].[DateHour], [T1].[HourRate]\n" +
            "ORDER BY Left(DateHour,CHARINDEX(' ',DateHour)), RIGHT([DateHour],2), substring([DateHour],CHARINDEX(' ',DateHour)+1,2);\n"
        query += "DROP TABLE dbo.#DateHours;  "
        }
        
        //console.log(query); // Testing

        var TestRackPromise = db.DBQueryTestRack(query);
        TestRackPromise.then(function(result) {
            if (debugMode == true) {
                console.log('/api/24HourTrend' + ParmLine + '  completed @ ' + Date());
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log("Promise Rejected for api/24hourTrend");
        });
    })
    app.get('/api/24HourTrendJDSVC/:ParmLocation/:ParmLine', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        if (debugMode == true) {
            console.log('/api/24HourTrendJDSVC called for ' + ParmLocation + ParmLine + ' @ ' + Date());
        }
        // const dateTime = new Date();
        // const StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1));
        // const EndOfPeriod= new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 2));
        //console.log('24hours: ' + StartOfPeriod + '-' + EndOfPeriod)

        var query = `SET NOCOUNT ON 
        DECLARE @AssyID VARCHAR(25) = '009072SJ24784';
        DECLARE @GroupName VARCHAR(25) = '${ParmLine}'
        DECLARE @days INT = 1
        DECLARE @date date = DATEADD(day,-@days,getdate())
        -- Get first test time hour that happened after 24 hours ago.
        DECLARE @hour int = DATEPART(hour,DATEADD(HOUR, 1,GetDate()))
        DECLARE @BackDate DATETIME = DATEADD(HOUR, 1, DATEADD(day, -@days, GETDATE()))

        CREATE TABLE dbo.#DateHours ( DateHour varchar(11) ) ;
        
        WHILE  @date  < GETDATE() 
          --or (@date   = GETDATE() and @hour < datepart(hour,getdate()) )
        BEGIN 
            --SELECT CONVERT(DATETIME, CONVERT(CHAR(8), @date, 112) 
         -- + ' ' + CONVERT(CHAR(8), GETDATE(), 108))
            INSERT INTO #DateHours (DateHour) VALUES (
                     CONCAT(DATEPART(month,@date), '-', DATEPART(day,@date) , ' ',FORMAT( @hour,'0#')))
            SET @hour = @hour + 1;
            if @hour = 24 begin
                SET @hour = 0;
                SET @date = DATEADD(day,1,@date);
                END;
            if  @date  = CAST(GETDATE() as date)  and @hour > DATEPART(hour,GETDATE())
                  SET @date = DATEADD(day,1,@date);
        END

        select  CASE 
            WHEN RIGHT(DH.DateHour,2) > 11 THEN CONCAT(SUBSTRING(DH.DateHour,1, LEN(DH.DateHour) - 2), (Right(DH.DateHour,2) - 12),  'PM')
            Else CONCAT(DH.DateHour , 'AM')
        End As [DateHour], 
        CASE @GroupName
            WHEN 'JD50002stack'  THEN 72 / 10 -- shift rate / hours
            WHEN 'JD50003stack'  THEN 66 / 10 
        END AS Target,
        (SELECT count(1) FROM [testrack].[dbo].[JD5000SCVTestData] AS TD  
            WHERE TD.[TimeStamp] BETWEEN  @BackDate AND GETDATE()
            AND (('${ParmLine}' = 'JD50003stack' and  TD.StationNbr IN (1,2)) 
            OR ('${ParmLine}' = 'JD50002stack' and  TD.StationNbr IN (3,4)))
            AND TRIM(TD.[TestResult]) NOT IN ('Test Stopped', 'Offline') 
            AND DATEPART(hour, TD.[TimeStamp]) = right(DH.DateHour,2)) AS Tests, 
        (SELECT count(1) FROM [testrack].[dbo].[JD5000SCVTestData] AS TD  
            WHERE TD.[TimeStamp] BETWEEN  @BackDate AND GETDATE()
            AND (('${ParmLine}' = 'JD50003stack' and  TD.StationNbr IN (1,2)) 
            OR ('${ParmLine}' = 'JD50002stack' and  TD.StationNbr IN (3,4)))
                AND TRIM(TD.[TestResult]) NOT IN ('Test Stopped', 'Offline', 'Pass') 
            AND DATEPART(hour, TD.[TimeStamp]) = right(DH.DateHour,2)) AS Fails,
        (SELECT count(1) FROM [testrack].[dbo].[JD5000SCVTestData] AS TD  
            WHERE TD.[TimeStamp] BETWEEN  @BackDate AND GETDATE()
            AND (('${ParmLine}' = 'JD50003stack' and  TD.StationNbr IN (1,2)) 
            OR ('${ParmLine}' = 'JD50002stack' and  TD.StationNbr IN (3,4)))
                AND TRIM(TD.[TestResult]) = 'Pass' 
            AND DATEPART(hour, TD.[TimeStamp]) = right(DH.DateHour,2)) AS Passes 
        FROM #DateHours DH
                
        DROP TABLE dbo.#DateHours;
        `

        var TestRackPromise = db.DBQueryTestRack(query);
        TestRackPromise.then(function(result) {
            if (debugMode == true) {
                console.log('/api/24HourTrendJDSVC' + ParmLine + '  completed @ ' + Date());
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log("Promise Rejected for api/24HourTrendJDSVC");
        });
    })
    app.get('/api/24HourTrendPump/:ParmLocation/:ParmLine', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        if (debugMode == true) {
            console.log('/api/24HourTrendPump called for ' + ParmLocation + ParmLine + ' @ ' + Date());
        }
        // const dateTime = new Date();
        // const StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1));
        // const EndOfPeriod= new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 2));
        //console.log('24hours: ' + StartOfPeriod + '-' + EndOfPeriod)

        if (ParmLine == 'AP212') {
            var TestDataTable = '[AP212]'; 
            var TestConvTable = '[test_result_ap212_conv]'; 
            var TestIDField = 'STATION'; 
        } else {
            var TestDataTable = '[roborack]'; 
            var TestConvTable = '[test_result_conv]'; 
            var TestIDField = 'MACHID'; 
        } 

        var query = `SET NOCOUNT ON 
        -- Get first test time hour that happened after 24 hours ago. 
        DECLARE @hour INT = (SELECT TOP 1 DATEPART(hour, T1.TIME) As STartDateTime FROM testrack.dbo.${TestDataTable} As T1 
        WHERE 'Found' =  
            CASE
                WHEN '${ParmLine}' = 'Modular' and ${TestIDField} IN (1,2) THEN 'Found'
                WHEN '${ParmLine}' = 'AP212' and ${TestIDField} IN (1,2) THEN 'Found'
                WHEN '${ParmLine}' = 'IPump'   and ${TestIDField} IN (3,4) THEN 'Found'
                WHEN '${ParmLine}' = 'AP100'   and ${TestIDField} IN (5,6) THEN 'Found'
                ELSE 'No Tests'
            END 
        And  T1.TIME > GetDate() - 1 )  
        CREATE TABLE dbo.#DateHours ( DateHour varchar(11) ) ; 
        Declare @hourcount int = 0; 
        WHILE @hourcount < 24 
        BEGIN  
            INSERT INTO #DateHours (DateHour) VALUES ( 
                Case  
        When @hour > DATEPART(hour, getdate()) Then Case 
        WHEN @HOUR > 9 THEN CONCAT(DATEPART(month,getdate() - 1), '-', DATEPART(day,getdate() - 1 ) , ' ', @hour) 
        Else      CONCAT(DATEPART(month,getdate() - 1), '-', DATEPART(day,getdate() - 1 ) , ' 0', @hour)
        End
        Else Case 
        WHEN @HOUR > 9 THEN CONCAT(DATEPART(month,getdate()), '-', DATEPART(day,getdate()) , ' ', @hour) 
        Else CONCAT(DATEPART(month,getdate()), '-', DATEPART(day,getdate()) , ' 0', @hour) 
        End
        End) 
           SET @hour = @hour + 1; 
           if @hour = 24 SET @hour = 0; 
           SET @hourcount = @hourcount + 1; 
        END;
        select top 24    
        CASE  
           WHEN RIGHT(DH.DateHour,2) > 11 THEN CONCAT(SUBSTRING(DH.DateHour,1, LEN(DH.DateHour) - 2), (Right(DH.DateHour,2) - 12),  'PM') 
           Else CONCAT(DH.DateHour , 'AM') 
        End As [DateHour], 
        50 AS Target,
        count(DATEPART(hour,TRDPasses.[Value])) AS Passes, 
        count(DATEPART(hour,TRDFails.[Value])) AS Fails    
        
        FROM #DateHours DH 
        
        Left Join testrack.dbo.${TestDataTable} As Tests On DATEPART(hour, Tests.[Time]) = right(DH.DateHour,2) 
        AND Tests.[Time] >  DATEADD(HOUR, 1, DATEADD(day, -3, GETDATE()))
        AND Tests.TIME between DATEADD(d,-1,GETDATE()) AND GETDATE()`
        if (ParmLine == 'AP212') {
            query += ` AND '${ParmLine}' = CASE
            WHEN  Tests.${TestIDField} IN (1,2) THEN '${ParmLine}'
            ELSE 'Invalid Line'
            END \n`
        } else {
            query += ` AND '${ParmLine}' = CASE
                WHEN  Tests.${TestIDField} IN (1,2) THEN 'Modular'
                WHEN  Tests.${TestIDField} IN (3,4) THEN 'IPump'
                WHEN  Tests.${TestIDField} IN (5,6) THEN 'AP100'
                ELSE 'Invalid Line'
            END \n`
        }  
        query +=  
        `   JOIN ${TestConvTable} TRD ON TRD.value = Tests.TestResult  
        AND ((TRD.DISPLAY NOT LIKE 'INVALID RESULT' AND RTRIM(TRD.DISPLAY) <> 'SET-UP')) 
        
        Left JOIN ${TestConvTable} TRDPasses ON TRDPasses.value = Tests.TestResult
        AND ((TRDPasses.DISPLAY LIKE '%PASS')) 
        
        LEFT JOIN ${TestConvTable} TRDFails ON TRDFails.value = Tests.TestResult
        AND (TRDFails.DISPLAY NOT LIKE 'INVALID RESULT' AND TRDFails.DISPLAY <> 'SET-UP'  AND TRDFails.DISPLAY NOT LIKE '%PASS') 
        
        GROUP BY [DateHour]
        ORDER BY Left(DateHour,CHARINDEX(' ',DateHour)), RIGHT([DateHour],2), substring([DateHour],CHARINDEX(' ',DateHour)+1,2);
        DROP TABLE dbo.#DateHours;`

        //console.log(query); // testing

        var TestRackPromise = db.DBQueryTestRack(query);
        TestRackPromise.then(function(result) {
            if (debugMode == true) {
                console.log('/api/24HourTrendJDSVC' + ParmLine + '  completed @ ' + Date());
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log("Promise Rejected for api/24HourTrendJDSVC");
        });
    })
    app.get('/api/GetClientHostname', (req, res) => {
	    //var ip = require('ip');
        var dns = require('dns');
        console.log(req.ip);
        var ip = req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        null;
        console.log(`req IP is : ${ip}`);
        //dns.reverse(ip.address(), function (err, hostnames) {
        dns.reverse(req.ip, function (err, hostnames) {
                if (err) {
                console.log(err.stack);
            }
            console.log(`ip: ${req.ip} host ${JSON.stringify(hostnames)}`);
            //console.log('reverse for ' + ip.address() + ': ' + clienthost);
            res.send(clienthost);
        });
    })
    app.get('/api/TestResults/:ParmLocation/:ParmLine/:ParmPeriod', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        var ParmPeriod = req.params.ParmPeriod;
        if (debugMode == true) {
            console.log('/api/TestResults called for ' + ParmLocation + ParmLine + ' ' + ParmPeriod + ' @ ' + Date());
        }
        
        {
        // execute a database query - get shift times for shift 1 and 2
  
        var PromiseShifts = db.DBQueryBHBrowser("Select s1.ShiftStr2 as ShiftStr1, s1.ShiftEnd2 AS ShiftEnd1, s2.ShiftStr2 as ShiftStr2, s2.ShiftEnd2 AS ShiftEnd2  \n"
        + "From ShiftParms s1 \n"
        + "LEFT JOIN ShiftParms s2 ON s2.Locatn = '" + ParmLocation + "' and s2.ShiftNbr=2  AND S2.Department='Default'\n"
        + "Where s1.Locatn = '" + ParmLocation + "' and s1.ShiftNbr=1 AND S1.Department='Default'");
        }
    
        PromiseShifts.then(function(result) {
            let resultsData = Object.values(Object.values(result.recordset)[0]);
            let StartOfShift1Time = resultsData[0];
            let EndOfShift1Time = resultsData[1];
            let StartOfShift2Time = resultsData[2];
            let EndOfShift2Time = resultsData[3];
            const dateTime = new Date();
            const dateTime2 = new Date();
            let dateToday = new Intl.DateTimeFormat('en-US').format(dateTime);
            if (dateTime.getHours() < 6) {
                dateToday = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1));
            }
            if (ParmPeriod == 'Shift1') { 
                // Shift 1 date and times are always today with given times
                StartOfPeriod = dateToday +  " " +  StartOfShift1Time;
                EndOfPeriod   = dateToday +  " " +  EndOfShift1Time;  
            }
            if (ParmPeriod == 'Shift2') {
                const nowTime = ("0" + dateTime.getHours().toString()).slice(-2) + ":" + ("0" + dateTime.getMinutes().toString()).slice(-2) + ":" + dateTime.getSeconds().toString();

                //console.log(nowTime + ' ' +  StartOfShift1Time + ' ' + EndOfShift1Time);
                if (nowTime >  StartOfShift1Time & nowTime < EndOfShift1Time) { // in S1 so look back thru yesterday after shift 1  thru start of shift 1 today 
                    StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1)) +  " " +  EndOfShift1Time;
                    EndOfPeriod   = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 1)) +  " " +  StartOfShift1Time;
                } else {   
                    if (nowTime > EndOfShift1Time) {
                        //set s2 to today shift2 start thru tomorrow shift 1 start
                        StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 0)) +  " " +  StartOfShift2Time;
                        EndOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 1)) + " " +  StartOfShift1Time;
                    } else {
                        // am in morning before shift 1 starts
                        // set to yesterday S2 start thru today S1 start
                        StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1)) +  " " +  StartOfShift2Time;
                        EndOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 0)) + " " +  StartOfShift1Time;
                    }
                }
                //console.log("Debug S2 datetimes. Now: " + nowTime +" Range:" + StartOfShift + " " + EndOfShift);
            } 
            if (ParmPeriod == 'History') { // hardcoded to 30 days
                dateToday = Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 30));
                StartOfPeriod = dateToday +  " " +  StartOfShift1Time;
                let dateToday2 = Intl.DateTimeFormat('en-US').format(dateTime2.setDate(dateTime.getDate() - 0));
                EndOfPeriod   = dateToday2 +  " " +  EndOfShift2Time;
            } 
                // Sql to get # of period PASSES and FAILS:
            {
                var query = "--================================== SQL to get period test data =========\n"; 
                query += "SELECT 'Passed' as whatcount, (SELECT count(distinct time) as thecount FROM TestData  \n"
                query += "WHERE MACHID = '" + ParmLine + "' AND "
                if (ParmLocation == "BHEL") {
                    query += "DATEADD(HH,-1, TIME) "
                } else {
                    query += "TIME "
                }
                query += "BETWEEN '" + StartOfPeriod + "' and '" + EndOfPeriod + "'"
                query += "AND (Warranty = 0 OR Warranty IS NULL) AND MODELDISP NOT LIKE 'Q%' AND TESTRESULT LIKE '%PASS%') AS thecount \n"

                // Sql to get # of FAILS:
                query += "UNION  \n"
                query += "SELECT 'Failed' as whatcount, (SELECT count(distinct time) as thecount FROM TestData  \n"
                query += "WHERE MACHID = '" + ParmLine + "' AND RETESTDISP <> 'Override' AND "
                if (ParmLocation == "BHEL") {
                    query += "DATEADD(HH,-1, TIME) "
                } else {
                    query += "TIME "
                }
                query += "BETWEEN '" + StartOfPeriod + "' and '" + EndOfPeriod + "'"
                query += "AND (Warranty = 0 OR Warranty IS NULL) AND MODELDISP NOT LIKE 'Q%' AND TestResult NOT LIKE '%PASS%' AND TESTRESULT <> 'OFFLINE') AS thecount "
            }
            //console.log(query);
            
            var PromiseTR = db.DBQueryTestRack(query);

            PromiseTR.then(function(result) {
                let labels = [];
                let series = [];
                result.recordset.forEach(function(row){
                    labels.push(Object.values(Object.values(row))[0]);
                    series.push(Object.values(Object.values(row))[1]);
                });
                const chartdata = { labels: labels,  series: series };
                if (debugMode == true) {
                    console.log('/api/TestResults completed @ ' + Date());
                    console.log('Data: ' + JSON.stringify(chartdata))
                }
                res.send(JSON.stringify(chartdata));
            }).catch(function () {
                console.log("Promise Rejected for /api/TestResults in test data");
            });
            // console.log("i got here" + JSON.stringify(ReturnData));
            // res.send(ReturnData);
        }).catch(function () {
            console.log("Promise Rejected for /api/TestResults in shift data");
        });
    })
    app.get('/api/TestResultsBranch/:ParmLocation/:ParmLine/:ParmPeriod', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmPeriod = req.params.ParmPeriod;
        if (debugMode == true) {
            console.log('/api/TestResultsBranch called for ' + ParmLocation +  ' ' + ParmPeriod + ' @ ' + Date());
        }
        {
        // execute a database query - get shift times for shift 1 and 2
  
        var PromiseShifts = db.DBQueryBHBrowser("Select s1.ShiftStr2 as ShiftStr1, s1.ShiftEnd2 AS ShiftEnd1, s2.ShiftStr2 as ShiftStr2, s2.ShiftEnd2 AS ShiftEnd2  \n"
        + "From ShiftParms s1 \n"
        + "JOIN ShiftParms s2 ON s2.Locatn = '" + ParmLocation + "' and s2.ShiftNbr=2  AND S2.Department='Default'\n"
        + "Where s1.Locatn = '" + ParmLocation + "' and s1.ShiftNbr=1 AND S1.Department='Default'");
        }
    
        PromiseShifts.then(function(result) {
            let resultsData = Object.values(Object.values(result.recordset)[0]);
            let StartOfShift1Time = resultsData[0];
            let EndOfShift1Time = resultsData[1];
            let StartOfShift2Time = resultsData[2];
            let EndOfShift2Time = resultsData[3];
            const dateTime = new Date();
            const dateTime2 = new Date();
            let dateToday = new Intl.DateTimeFormat('en-US').format(dateTime);
            if (dateTime.getHours() < 6) {
                dateToday = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1));
            }
            if (ParmPeriod == 'Shift1') { 
                // Shift 1 date and times are always today with given times
                StartOfPeriod = dateToday +  " " +  StartOfShift1Time;
                EndOfPeriod   = dateToday +  " " +  EndOfShift1Time;  
            }
            if (ParmPeriod == 'Shift2') {
                const nowTime = ("0" + dateTime.getHours().toString()).slice(-2) + ":" + ("0" + dateTime.getMinutes().toString()).slice(-2) + ":" + dateTime.getSeconds().toString();

                //console.log(nowTime + ' ' +  StartOfShift1Time + ' ' + EndOfShift1Time);
                if (nowTime >  StartOfShift1Time & nowTime < EndOfShift1Time) { // in S1 so look back thru yesterday after shift 1  thru start of shift 1 today 
                    StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1)) +  " " +  EndOfShift1Time;
                    EndOfPeriod   = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 1)) +  " " +  StartOfShift1Time;
                } else {   
                    if (nowTime > EndOfShift1Time) {
                        //set s2 to today shift2 start thru tomorrow shift 1 start
                        StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 0)) +  " " +  StartOfShift2Time;
                        EndOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 1)) + " " +  StartOfShift1Time;
                    } else {
                        // am in morning before shift 1 starts
                        // set to yesterday S2 start thru today S1 start
                        StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1)) +  " " +  StartOfShift2Time;
                        EndOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 0)) + " " +  StartOfShift1Time;
                    }
                }
                //console.log("Debug S2 datetimes. Now: " + nowTime +" Range:" + StartOfShift + " " + EndOfShift);
            } 
            if (ParmPeriod == 'History') { // hardcoded to 30 days
                dateToday = Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 30));
                StartOfPeriod = dateToday +  " " +  StartOfShift1Time;
                let dateToday2 = Intl.DateTimeFormat('en-US').format(dateTime2.setDate(dateTime.getDate() - 0));
                EndOfPeriod   = dateToday2 +  " " +  EndOfShift2Time;
            } 
                // Sql to get # of period PASSES and FAILS:
            {
                var query = "--================================== SQL to get period test data =========\n"; 
                query += "SELECT 'Passed' as whatcount, (SELECT count(distinct time) as thecount FROM TestData  \n"
                query += "WHERE MACHID = '" + ParmLine + "' AND "
                if (ParmLocation == "BHEL") {
                    query += "DATEADD(HH,-1, TIME) "
                } else {
                    query += "TIME "
                }
                query += "BETWEEN '" + StartOfPeriod + "' and '" + EndOfPeriod + "'"
                query += "AND (Warranty = 0 OR Warranty IS NULL) AND MODELDISP NOT LIKE 'Q%' AND TESTRESULT LIKE '%PASS%') AS thecount \n"

                // Sql to get # of FAILS:
                query += "UNION  \n"
                query += "SELECT 'Failed' as whatcount, (SELECT count(distinct time) as thecount FROM TestData  \n"
                query += "WHERE RETESTDISP <> 'Override' AND "
                if (ParmLocation == "BHEL") {
                    query += "DATEADD(HH,-1, TIME) "
                } else {
                    query += "TIME "
                }
                query += "BETWEEN '" + StartOfPeriod + "' and '" + EndOfPeriod + "'"
                query += "AND (Warranty = 0 OR Warranty IS NULL) AND MODELDISP NOT LIKE 'Q%' AND TestResult NOT LIKE '%PASS%' AND TESTRESULT <> 'OFFLINE') AS thecount "
            }
            //console.log(query);
            
            var PromiseTR = db.DBQueryTestRack(query);

            PromiseTR.then(function(result) {
                let labels = [];
                let series = [];
                result.recordset.forEach(function(row){
                    labels.push(Object.values(Object.values(row))[0]);
                    series.push(Object.values(Object.values(row))[1]);
                });
                const chartdata = { labels: labels,  series: series };
                if (debugMode == true) {
                    console.log('/api/TestResultsBranch completed @ ' + Date());
                    console.log('Data: ' + JSON.stringify(chartdata))
                }
                res.send(JSON.stringify(chartdata));
            }).catch(function () {
                console.log("Promise Rejected for /api/TestResultsBranch in test data");
            });
            // console.log("i got here" + JSON.stringify(ReturnData));
            // res.send(ReturnData);
        }).catch(function () {
            console.log("Promise Rejected for /api/TestResultsBranch in shift data");
        });
    })
    app.get('/api/TestResultsPUAll/:ParmLocation/', (req, res) => {
        const location = req.params.ParmLocation;
        //var ParmLineType = req.params.ParmLineType;
        if (debugMode == true) {
            console.log('/api/TestResultsPUAll called for ' + location + ' @ ' + Date());
        }
        {
        // execute a database query - get shift times for shift 1 and 2
        // Sql to get # of period PASSES and FAILS:
        
        const query = `EXECUTE [dbo].[sp_PU_AssemblyTestResults] '${location}', '%Power Units%'`
        
        //console.log(query);
        
        const PromiseTRA = db.DBQueryTestRack(query);

        PromiseTRA.then(function(result) {
            if (debugMode == true) {
                console.log('/api/TestResultsPUAll completed @ ' + Date());
                console.log('Data: ' + JSON.stringify(result.recordset))
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log("Promise Rejected for /api/TestResultsPUAll in test data");
        });
        }
    });
    app.get('/api/TestResultsJDSVC/:ParmLocation/:ParmLine/:ParmPeriod/', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        var ParmPeriod = req.params.ParmPeriod;
        if (debugMode == true) {
            console.log('/api/TestResults called for ' + ParmLocation + ParmLine + ' ' + ParmPeriod + ' @ ' + Date());
        }
        {
        // execute a database query - get shift times for shift 1 and 2
  
        var PromiseShifts = db.DBQueryBHBrowser("Select s1.ShiftStr2 as ShiftStr1, s1.ShiftEnd2 AS ShiftEnd1, s2.ShiftStr2 as ShiftStr2, s2.ShiftEnd2 AS ShiftEnd2  \n"
        + "From ShiftParms s1 \n"
        + "JOIN ShiftParms s2 ON s2.Locatn = '" + ParmLocation + "' and s2.ShiftNbr=2  AND S2.Department='Default'\n"
        + "Where s1.Locatn = '" + ParmLocation + "' and s1.ShiftNbr=1 AND S1.Department='Default'");
        }
    
        PromiseShifts.then(function(result) {
            let resultsData = Object.values(Object.values(result.recordset)[0]);
            let StartOfShift1Time = resultsData[0];
            let EndOfShift1Time = resultsData[1];
            let StartOfShift2Time = resultsData[2];
            let EndOfShift2Time = resultsData[3];
            const dateTime = new Date();
            const dateTime2 = new Date();
            let dateToday = new Intl.DateTimeFormat('en-US').format(dateTime);
            if (dateTime.getHours() < 6) {
                dateToday = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1));
            }
            if (ParmPeriod == 'Shift1') { 
                // Shift 1 date and times are always today with given times
                StartOfPeriod = dateToday +  " " +  StartOfShift1Time;
                EndOfPeriod   = dateToday +  " " +  EndOfShift1Time;  
            }
            if (ParmPeriod == 'Shift2') {
                const nowTime = ("0" + dateTime.getHours().toString()).slice(-2) + ":" + ("0" + dateTime.getMinutes().toString()).slice(-2) + ":" + dateTime.getSeconds().toString();

                //console.log(nowTime + ' ' +  StartOfShift1Time + ' ' + EndOfShift1Time);
                if (nowTime >  StartOfShift1Time & nowTime < EndOfShift1Time) { // in S1 so look back thru yesterday after shift 1  thru start of shift 1 today 
                    StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1)) +  " " +  EndOfShift1Time;
                    EndOfPeriod   = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 1)) +  " " +  StartOfShift1Time;
                } else {   
                    if (nowTime > EndOfShift1Time) {
                        //set s2 to today shift2 start thru tomorrow shift 1 start
                        StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 0)) +  " " +  StartOfShift2Time;
                        EndOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 1)) + " " +  StartOfShift1Time;
                    } else {
                        // am in morning before shift 1 starts
                        // set to yesterday S2 start thru today S1 start
                        StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1)) +  " " +  StartOfShift2Time;
                        EndOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 0)) + " " +  StartOfShift1Time;
                    }
                }
                //console.log("Debug S2 datetimes. Now: " + nowTime +" Range:" + StartOfShift + " " + EndOfShift);
            } 
            if (ParmPeriod == 'History') { // hardcoded to 30 days
                dateToday = Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 30));
                StartOfPeriod = dateToday +  " " +  StartOfShift1Time;
                let dateToday2 = Intl.DateTimeFormat('en-US').format(dateTime2.setDate(dateTime.getDate() - 0));
                EndOfPeriod   = dateToday2 +  " " +  EndOfShift2Time;
            } 
            Date.prototype.GetFirstDayOfWeek = function() {
                return (new Date(this.setDate(this.getDate() - this.getDay())));
            }
            
            Date.prototype.GetLastDayOfWeek = function() {
                return (new Date(this.setDate(this.getDate() - this.getDay() +6)));
            }
            if ((ParmPeriod == 'Week') || (ParmPeriod == 'WeekByShift')) { 
                // from Monday at 06:00 to now
                var today = new Date();
                dateToday = Intl.DateTimeFormat('en-US').format(today.GetFirstDayOfWeek());
                StartOfPeriod = dateToday +  " " +  StartOfShift1Time;
                let dateToday2 = Intl.DateTimeFormat('en-US').format(dateTime2.setDate(dateTime.getDate()));
                EndOfPeriod   = dateToday2 +  " " +  "23:59:59";
            } 
                // Sql to get # of period PASSES and FAILS:
            {
                if (ParmPeriod == 'WeekByShift') {
                var query = `
                    SELECT CASE 
                        WHEN CONVERT(VARCHAR(8),TD.[TimeStamp],108) between '${StartOfShift1Time}' and '${EndOfShift1Time}' THEN '1'
                            ELSE '2'
                           END + 'Passed' AS Shift, 
                           count(1) as [thecount]
                    FROM [testrack].[dbo].[JD5000SCVTestData] AS TD
                    WHERE TD.TimeStamp BETWEEN '${StartOfPeriod}' and '${EndOfPeriod}' 
                    AND trim(TD.[TestResult]) = 'PASS'
                    AND (('${ParmLine}' = 'JD50003stack' and  TD.StationNbr IN (1,2)) 
                    OR ('${ParmLine}' = 'JD50002stack' and  TD.StationNbr IN (3,4)))
                    Group BY CASE
                    WHEN CONVERT(VARCHAR(8),TD.[TimeStamp],108) between '${StartOfShift1Time}' and '${EndOfShift1Time}' THEN '1'
                    ELSE '2'
                    END + 'Passed'
                    UNION ALL 
                    SELECT CASE 
                    WHEN CONVERT(VARCHAR(8),TD.[TimeStamp],108) between '${StartOfShift1Time}' and '${EndOfShift1Time}' THEN '1'
                            ELSE '2'
                    END + 'Failed' AS Shift, 
                    count(1) as [thecount]
                    FROM [testrack].[dbo].[JD5000SCVTestData] AS TD
                    WHERE TD.TimeStamp BETWEEN '${StartOfPeriod}' and '${EndOfPeriod}' 
                    AND trim(TD.[TestResult]) NOT IN ('Test Stopped', 'Offline', 'PASS') 
                    AND (('${ParmLine}' = 'JD50003stack' and  TD.StationNbr IN (1,2)) 
                    OR ('${ParmLine}' = 'JD50002stack' and  TD.StationNbr IN (3,4)))
                    Group BY CASE WHEN CONVERT(VARCHAR(8),TD.[TimeStamp],108) between '${StartOfShift1Time}' and '${EndOfShift1Time}'   THEN '1' 
                    ELSE '2'
                    END + 'Failed'
                    ORDER BY Shift;`
                  } else {
                    var query = `
                    SELECT 'Passed' As whatcount, count(1) as [thecount]
                    FROM [testrack].[dbo].[JD5000SCVTestData] AS TD
                    WHERE TD.TimeStamp BETWEEN '${StartOfPeriod}' and '${EndOfPeriod}' 
                    AND trim(TD.[TestResult]) = 'PASS'
                    AND (('${ParmLine}' = 'JD50003stack' and  TD.StationNbr IN (1,2)) 
                     OR ('${ParmLine}' = 'JD50002stack' and  TD.StationNbr IN (3,4)))
                    UNION ALL 
                    SELECT 'Failed' As whatcount, count(1) as [thecount] 
                    FROM [testrack].[dbo].[JD5000SCVTestData] AS TD
                    WHERE TD.TimeStamp BETWEEN '${StartOfPeriod}' and '${EndOfPeriod}' 
                    AND TRIM(TD.[TestResult]) NOT IN ('Test Stopped', 'Offline', 'PASS') 
                    AND (('${ParmLine}' = 'JD50003stack' and  TD.StationNbr IN (1,2)) 
                     OR ('${ParmLine}' = 'JD50002stack' and  TD.StationNbr IN (3,4)))`
                }
            }
            //console.log(query);
            var PromiseTR = db.DBQueryTestRack(query);

            PromiseTR.then(function(result) {
                let labels = [];
                let series = [];
                result.recordset.forEach(function(row){
                    labels.push(Object.values(Object.values(row))[0]);
                    series.push(Object.values(Object.values(row))[1]);
                });
                const chartdata = { labels: labels,  series: series };
                if (debugMode == true) {
                    console.log('/api/TestResultsJDSVC completed @ ' + Date());
                    console.log('Data: ' + JSON.stringify(chartdata))
                }
                res.send(JSON.stringify(chartdata));
            }).catch(function () {
                console.log("Promise Rejected for /api/TestResultsJDSVC in test data");
            });
            // console.log("i got here" + JSON.stringify(ReturnData));
            // res.send(ReturnData);
        }).catch(function () {
            console.log("Promise Rejected for /api/TestResultsJDSVC in shift data");
        });
    })
    app.get('/api/TestResultsPump/:ParmLocation/:ParmLine/:ParmPeriod/', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        var ParmPeriod = req.params.ParmPeriod;
        if (debugMode == true) {
            console.log('/api/TestResults called for ' + ParmLocation + ParmLine + ' ' + ParmPeriod + ' @ ' + Date());
        }
        
        // execute a database query - get shift times for shift 1 and 2
        var query = `Select s1.ShiftStr2 as ShiftStr1, s1.ShiftEnd2 AS ShiftEnd1, s2.ShiftStr2 as ShiftStr2, s2.ShiftEnd2 AS ShiftEnd2  
        From ShiftParms s1 
        left JOIN ShiftParms s2 ON s2.Locatn = '${ParmLocation}' and s2.ShiftNbr=2  AND S2.Department='${ParmLine}' 
        Where s1.Locatn = '${ParmLocation}' and s1.ShiftNbr=1 AND S1.Department='${ParmLine}';`;
        
        //console.log(query);  // Testing

        var PromiseShifts = db.DBQueryBHBrowser(query);
        
        PromiseShifts.then(function(result) {
            let resultsData = Object.values(Object.values(result.recordset)[0]);
            let StartOfShift1Time = resultsData[0];
            let EndOfShift1Time = resultsData[1];
            let StartOfShift2Time = resultsData[2];
            let EndOfShift2Time = resultsData[3];
            const dateTime = new Date();
            const dateTime2 = new Date();
            let dateToday = new Intl.DateTimeFormat('en-US').format(dateTime);
            if (dateTime.getHours() < 6) {
                dateToday = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1));
            }
            if (ParmPeriod == 'Shift1') { 
                // Shift 1 date and times are always today with given times
                StartOfPeriod = dateToday +  " " +  StartOfShift1Time;
                EndOfPeriod   = dateToday +  " " +  EndOfShift1Time;  
            }
            if (ParmPeriod == 'Shift2') {
                const nowTime = ("0" + dateTime.getHours().toString()).slice(-2) + ":" + ("0" + dateTime.getMinutes().toString()).slice(-2) + ":" + dateTime.getSeconds().toString();

                //console.log('Debug S1 ' + nowTime + ' ' +  StartOfShift1Time + ' ' + EndOfShift1Time);
                if (nowTime >  StartOfShift1Time & nowTime < EndOfShift1Time) { // in S1 so look back thru yesterday after shift 1  thru start of shift 1 today 
                    StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1)) +  " " +  EndOfShift1Time;
                    EndOfPeriod   = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 1)) +  " " +  StartOfShift1Time;
                } else {   
                    if (nowTime > EndOfShift1Time) {
                        //set s2 to today shift2 start thru tomorrow shift 1 start
                        StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 0)) +  " " +  StartOfShift2Time;
                        EndOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 1)) + " " +  StartOfShift1Time;
                    } else {
                        // am in morning before shift 1 starts
                        // set to yesterday S2 start thru today S1 start
                        StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1)) +  " " +  StartOfShift2Time;
                        EndOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 0)) + " " +  StartOfShift1Time;
                    }
                }
                //console.log("Debug S2 datetimes. Now: " + nowTime +" Range:" + StartOfPeriod + " " + EndOfPeriod);
            } 
            if (ParmPeriod == 'History') { // hardcoded to 30 days
                dateToday = Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 30));
                StartOfPeriod = dateToday +  " " +  StartOfShift1Time;
                let dateToday2 = Intl.DateTimeFormat('en-US').format(dateTime2.setDate(dateTime.getDate() - 0));
                EndOfPeriod   = dateToday2 +  " " +  EndOfShift2Time;
            } 
                // Sql to get # of period PASSES and FAILS:
            {
                if (ParmLine == 'AP212') {
                    var TestDataTable = '[AP212]'; 
                    var TestConvTable = '[test_result_ap212_conv]'; 
                } else {
                    var TestDataTable = '[roborack]'; 
                    var TestConvTable = '[test_result_conv]'; 
                } 
                var query = `SELECT 'Passed' As whatcount, count(1) as [thecount]
                FROM     ${TestDataTable} AS TD
                    JOIN ${TestConvTable} TRD ON TRD.value = TD.TestResult AND ((TRD.DISPLAY like '%PASS')) 
                WHERE TD.[Time] BETWEEN '${StartOfPeriod}' and '${EndOfPeriod}' `;
                if (ParmLine !== 'AP212') {
                    query += `AND '${ParmLine}' = CASE
                    WHEN  TD.MACHID IN (1,2) THEN 'Modular'
                    WHEN  TD.MACHID IN (3,4) THEN 'IPump'
                    WHEN  TD.MACHID IN (5,6) THEN 'AP100'
                    ELSE 'Invalid Line'
                END \n`; 
                }    
                query += `UNION ALL 
                SELECT 'Failed' As whatcount, count(1) as [thecount] 
                FROM  testrack.dbo.${TestDataTable} AS TD
                JOIN ${TestConvTable} TRD ON TRD.value = TD.TestResult
                AND (TRD.DISPLAY NOT LIKE 'INVALID RESULT' AND TRD.DISPLAY <> 'SET-UP'  AND TRD.DISPLAY NOT LIKE '%PASS') 
                WHERE TD.[Time] BETWEEN '${StartOfPeriod}' and '${EndOfPeriod}' `;
                if (ParmLine !== 'AP212') {
                    query += `AND '${ParmLine}' = CASE
                    WHEN  TD.MACHID IN (1,2) THEN 'Modular'
                    WHEN  TD.MACHID IN (3,4) THEN 'IPump'
                    WHEN  TD.MACHID IN (5,6) THEN 'AP100'
                    ELSE 'Invalid Line'
                    END`;
                }
            }
            //console.log(query); // Testing

            var PromiseTR = db.DBQueryTestRack(query);

            PromiseTR.then(function(result) {
                let labels = [];
                let series = [];
                result.recordset.forEach(function(row){
                    labels.push(Object.values(Object.values(row))[0]);
                    series.push(Object.values(Object.values(row))[1]);
                });
                const chartdata = { labels: labels,  series: series };
                if (debugMode == true) {
                    console.log('/api/TestResultsPump completed @ ' + Date());
                    console.log('Data: ' + JSON.stringify(chartdata))
                }
                res.send(JSON.stringify(chartdata));
            }).catch(function () {
                console.log(`Promise Rejected for /api/TestResultsPUMP/${ParmLine} in test data`);
            });
        }).catch(function () {
            console.log(`Promise Rejected for /api/TestResultsPUMP/${ParmLine} in shift data`);
        });
    })
    app.get('/api/TestResultsJDSVC_Failures/:ParmLocation/:ParmLine/:ParmPeriod/', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        var ParmPeriod = req.params.ParmPeriod;
        if (debugMode == true) {
            console.log('/api/TestResultsJDSVC_Failures called for ' + ParmLocation + ParmLine + ' ' + ParmPeriod + ' @ ' + Date());
        }
        // Sql to get TOP 3 FAILS:
        {
            var query = `  SELECT TOP 3 TRIM(TD.[TestResult]) AS Failure, count(1) as [Count]
            FROM  [testrack].[dbo].[JD5000SCVTestData] AS TD 
            WHERE TD.TimeStamp between DATEADD(day,-1,GETDATE()) and GETDATE()
            AND (('${ParmLine}' = 'JD50003stack' and  TD.StationNbr IN (1,2)) 
             OR ('${ParmLine}' = 'JD50002stack' and  TD.StationNbr IN (3,4)))
            AND TRIM(TD.[TestResult]) NOT IN ('Test Stopped', 'Offline', 'PASS')
            GROUP BY TRIM(TD.[TestResult])
            ORDER BY [Count] DESC`
        }
        var PromiseTR = db.DBQueryTestRack(query);

        PromiseTR.then(function(result) {
            let labels = [];
            let series = [];
            result.recordset.forEach(function(row){
                labels.push(Object.values(Object.values(row))[0]);
                series.push(Object.values(Object.values(row))[1]);
            });
            const chartdata = { labels: labels,  series: [series] };
            if (debugMode == true) {
                console.log('/api/TestResultsJDSVC_Failures completed @ ' + Date());
                console.log('Fails Data: ' + JSON.stringify(chartdata))
            }
            res.send(JSON.stringify(chartdata));
        }).catch(function () {
            console.log("Promise Rejected for /api/TestResultsJDSVC_Failures in test data");
        });
        // console.log("i got here" + JSON.stringify(ReturnData));
        // res.send(ReturnData);
    });
    app.get('/api/TestResultsPump_Failures/:ParmLocation/:ParmLine/', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        if (debugMode == true) {
            console.log('/api/TestResultsJDSVC_Failures called for ' + ParmLocation + ParmLine + ' ' + Date());
        }
        // Sql to get TOP 3 FAILS:
        {
            var query = `SELECT TOP 3 TRIM(TRD.[Display]) AS Failure, count(1) as [Count]
            FROM  testrack.dbo.[roborack] AS TD
            JOIN test_result_conv TRD ON TRD.value = TD.TestResult
            AND (TRD.DISPLAY NOT LIKE 'INVALID RESULT' AND TRD.DISPLAY <> 'SET-UP'  AND TRD.DISPLAY <> 'PUMP PASS') 
            WHERE TD.[Time] BETWEEN DATEADD(day,-1,GETDATE()) and GETDATE() `;
            if (ParmLine !== 'AP212') {
                query += `AND '${ParmLine}' = CASE
                WHEN  TD.MACHID IN (1,2) THEN 'Modular'
                WHEN  TD.MACHID IN (3,4) THEN 'IPump'
                WHEN  TD.MACHID IN (5,6) THEN 'AP100'
                ELSE 'Invalid Line'
                END `;
            }
            query += `GROUP BY TRIM(TRD.[DISPLAY])
			ORDER BY [Count] DESC`
        }
        var PromiseTR = db.DBQueryTestRack(query);

        PromiseTR.then(function(result) {
            let labels = [];
            let series = [];
            result.recordset.forEach(function(row){
                labels.push(Object.values(Object.values(row))[0]);
                series.push(Object.values(Object.values(row))[1]);
            });
            const chartdata = { labels: labels,  series: [series] };
            if (debugMode == true) {
                console.log('/api/TestResultsPump_Failures completed @ ' + Date());
                console.log('Fails Data: ' + JSON.stringify(chartdata))
            }
            res.send(JSON.stringify(chartdata));
        }).catch(function () {
            console.log("Promise Rejected for /api/TestResultsPump_Failures in test data");
        });
    });
    app.get('/api/TestResultsJDSVC_Goal/:ParmLocation/:ParmLine/', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmLine = req.params.ParmLine;
        //var ParmPeriod = req.params.ParmPeriod; // goal is same for all shifts
        if (debugMode == true) {
            console.log('/api/TestResultsJDSVC_Goal called for ' + ParmLocation + ' ' +ParmLine + ' @ ' + Date());
        }
        // execute a database query - get shift times for shift 1 and 2
        var query = `Select s1.ShiftStr2 as ShiftStr1, s1.ShiftEnd2 AS ShiftEnd1, 
                             s2.ShiftStr2 as ShiftStr2, s2.ShiftEnd2 AS ShiftEnd2  
        From ShiftParms s1 
        JOIN ShiftParms s2 
           ON s2.Locatn = '${ParmLocation}' and s2.ShiftNbr=2 AND S2.Department='Default'
        Where s1.Locatn = '${ParmLocation}' and s1.ShiftNbr=1 AND S1.Department='Default'`
        var PromiseShiftsG = db.DBQueryBHBrowser(query);
        
        PromiseShiftsG.then(function(result) {
            let resultsData = Object.values(Object.values(result.recordset)[0]);
            let StartOfShift1Time = resultsData[0];
            let EndOfShift1Time = resultsData[1];
            let StartOfShift2Time = resultsData[2];
            let EndOfShift2Time = resultsData[3];
            const dateTime = new Date();
            const timeHour = dateTime.getHours();
            let dateToday = new Intl.DateTimeFormat('en-US').format(dateTime);
            if (timeHour < 6) {
                dateToday = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1));
            }
            if (timeHour => StartOfShift1Time.slice(0,2) && dateTime < EndOfShift1Time.slice(0,2)) {
                // Shift 1 date and times are always today with given times
                StartOfPeriod = dateToday +  " " +  StartOfShift1Time;
                EndOfPeriod   = dateToday +  " " +  EndOfShift1Time;  
            } else {
                const nowTime = ("0" + dateTime.getHours().toString()).slice(-2) + ":" + ("0" + dateTime.getMinutes().toString()).slice(-2) + ":" + dateTime.getSeconds().toString();

                //console.log(nowTime + ' ' +  StartOfShift1Time + ' ' + EndOfShift1Time);
                if (nowTime >  StartOfShift1Time & nowTime < EndOfShift1Time) { // in S1 so look back thru yesterday after shift 1  thru start of shift 1 today 
                    StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1)) +  " " +  EndOfShift1Time;
                    EndOfPeriod   = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 1)) +  " " +  StartOfShift1Time;
                } else {   
                    if (nowTime > EndOfShift1Time) {
                        //set s2 to today shift2 start thru tomorrow shift 1 start
                        StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 0)) +  " " +  StartOfShift2Time;
                        EndOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 1)) + " " +  StartOfShift1Time;
                    } else {
                        // am in morning before shift 1 starts
                        // set to yesterday S2 start thru today S1 start
                        StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1)) +  " " +  StartOfShift2Time;
                        EndOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 0)) + " " +  StartOfShift1Time;
                    }
                }

            } 

            // Sql to get shift output vs goal:
            {
                var query = `
                SELECT CASE '${ParmLine}' 
                    WHEN 'JD50002stack'  THEN 72  
                    WHEN 'JD50003stack'  THEN 66 
                END AS Goal, count(1) as [Output]
                FROM [testrack].[dbo].[JD5000SCVTestData] AS TD 
                WHERE TD.TimeStamp between '${StartOfPeriod}' and '${EndOfPeriod}' 
                AND (('${ParmLine}' = 'JD50003stack' and  TD.StationNbr IN (1,2)) 
                 OR ('${ParmLine}' = 'JD50002stack' and  TD.StationNbr IN (3,4))) 	
                AND TRIM(TD.[TestResult]) = 'PASS'`
            }
            //console.log(`GQuery:${query}`)
            var PromiseG2 = db.DBQueryTestRack(query);

            PromiseG2.then(function(result) {
                //console.log('Goal Data in promise ')
                let labels = [];
                let series = [];
                result.recordset.forEach(function(row){
                    labels.push('Goal','Passed');
                    series.push(Object.values(Object.values(row))[0],
                    Object.values(Object.values(row))[1]);
                });
                const chartdata = { labels: labels,  series: [series] };
                if (debugMode == true) {
                    console.log('/api/TestResultsJDSVC_Goal completed @ ' + Date());
                    console.log('Goal Data: ' + JSON.stringify(chartdata))
                }
                res.send(JSON.stringify(chartdata));
            }).catch(function () {
                console.log("Promise Rejected for /api/TestResultsJDSVC_Goal in test data");
            });
         }).catch(function () {
            console.log("Promise Rejected for /api/TestResultsJDSVC_Goal in shift data");
            console.log("Datetimes. Range:" + StartOfPeriod + " " + EndOfPeriod);
            console.log("Query:" + query);
        });
    });
   /*
    app.get('/api/PackingTotals/:ParmLocation/:ParmArea/:ParmLine/:ParmPeriod', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
    var ParmArea = req.params.ParmArea;
    var ParmLine = req.params.ParmLine;
    var ParmPeriod = req.params.ParmPeriod;
    if (debugMode == true) {
        console.log('/api/PackingTotals called for ' + ParmLocation + ParmLine + ' ' + ParmPeriod + ' @ ' + Date());
    }
 
    {
    // get shift times for shift 1 and 2
    var PromiseShifts = db.DBQueryBHBrowser(`SELECT * FROM [dbo].[f_GetWorkShifts] (
   ${ParmLocation},'Default','',GETDATE(), GETDATE())`
        
        
        
        
        
        Select s1.ShiftStr2 as ShiftStr1, s1.ShiftEnd2 AS ShiftEnd1, s2.ShiftStr2 as ShiftStr2, s2.ShiftEnd2 AS ShiftEnd2  \n"
    + "From ShiftParms s1 \n"
    + "JOIN ShiftParms s2 ON s2.Locatn = '" + ParmLocation + "' and s2.ShiftNbr=2  AND S2.Department='Default'\n"
    + "Where s1.Locatn = '" + ParmLocation + "' and s1.ShiftNbr=1 AND S1.Department='Default'");
    }
    

    PromiseShifts.then(function(result) {
        let resultsData = Object.values(Object.values(result.recordset)[0]);
        let StartOfShift1Time = resultsData[0];
        let EndOfShift1Time = resultsData[1];
        let StartOfShift2Time = resultsData[2];
        let EndOfShift2Time = resultsData[3];
        const dateTime = new Date();
        const dateTime2 = new Date();
        let dateToday = new Intl.DateTimeFormat('en-US').format(dateTime);
        if (dateTime.getHours() < 6) {
            dateToday = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1));
        }
        if (ParmPeriod == 'Shift1') { 
            // Shift 1 date and times are always today with given times
            StartOfPeriod = dateToday +  " " +  StartOfShift1Time;
            EndOfPeriod   = dateToday +  " " +  EndOfShift1Time;  
        }
        if (ParmPeriod == 'Shift2') {
            const nowTime = ("0" + dateTime.getHours().toString()).slice(-2) + ":" + ("0" + dateTime.getMinutes().toString()).slice(-2) + ":" + dateTime.getSeconds().toString();

            //console.log(nowTime + ' ' +  StartOfShift1Time + ' ' + EndOfShift1Time);
            if (nowTime >  StartOfShift1Time & nowTime < EndOfShift1Time) { // in S1 so look back thru yesterday after shift 1  thru start of shift 1 today 
                StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1)) +  " " +  EndOfShift1Time;
                EndOfPeriod   = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 1)) +  " " +  StartOfShift1Time;
            } else {   
                if (nowTime > EndOfShift1Time) {
                    //set s2 to today shift2 start thru tomorrow shift 1 start
                    StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 0)) +  " " +  StartOfShift2Time;
                    EndOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 1)) + " " +  StartOfShift1Time;
                } else {
                    // am in morning before shift 1 starts
                    // set to yesterday S2 start thru today S1 start
                    StartOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 1)) +  " " +  StartOfShift2Time;
                    EndOfPeriod = new Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() + 0)) + " " +  StartOfShift1Time;
                }
            }
            //console.log("Debug S2 datetimes. Now: " + nowTime +" Range:" + StartOfShift + " " + EndOfShift);
        } 
        if (ParmPeriod == 'History') { // hardcoded to 30 days
            dateToday = Intl.DateTimeFormat('en-US').format(dateTime.setDate(dateTime.getDate() - 30));
            StartOfPeriod = dateToday +  " " +  StartOfShift1Time;
            let dateToday2 = Intl.DateTimeFormat('en-US').format(dateTime2.setDate(dateTime.getDate() - 0));
            EndOfPeriod   = dateToday2 +  " " +  EndOfShift2Time;
        } 
            // Sql to get # of period PASSES and FAILS:
        {
            var query = "--================================== SQL to get period test data =========\n"; 
            query += "SELECT 'Passed' as whatcount, (SELECT count(distinct time) as thecount FROM TestData  \n"
            query += "WHERE MACHID = '" + ParmLine + "' AND "
            if (ParmLocation == "BHEL") {
                query += "DATEADD(HH,-1, TIME) "
            } else {
                query += "TIME "
            }
            query += "BETWEEN '" + StartOfPeriod + "' and '" + EndOfPeriod + "'"
            query += "AND (Warranty = 0 OR Warranty IS NULL) AND MODELDISP NOT LIKE 'Q%' AND TESTRESULT LIKE '%PASS%') AS thecount \n"

            // Sql to get # of FAILS:
            query += "UNION  \n"
            query += "SELECT 'Failed' as whatcount, (SELECT count(distinct time) as thecount FROM TestData  \n"
            query += "WHERE MACHID = '" + ParmLine + "' AND RETESTDISP <> 'Override' AND "
            if (ParmLocation == "BHEL") {
                query += "DATEADD(HH,-1, TIME) "
            } else {
                query += "TIME "
            }
            query += "BETWEEN '" + StartOfPeriod + "' and '" + EndOfPeriod + "'"
            query += "AND (Warranty = 0 OR Warranty IS NULL) AND MODELDISP NOT LIKE 'Q%' AND TestResult NOT LIKE '%PASS%' AND TESTRESULT <> 'OFFLINE') AS thecount "
        }
        //console.log(query);
        
        var PromiseTR = db.DBQueryTestRack(query);

        PromiseTR.then(function(result) {
            let labels = [];
            let series = [];
            result.recordset.forEach(function(row){
                labels.push(Object.values(Object.values(row))[0]);
                series.push(Object.values(Object.values(row))[1]);
            });
            const chartdata = { labels: labels,  series: series };
            if (debugMode == true) {
                console.log('/api/TestResults completed @ ' + Date());
                console.log('Data: ' + JSON.stringify(chartdata))
            }
            res.send(JSON.stringify(chartdata));
        }).catch(function () {
            console.log("Promise Rejected for /api/TestResults in test data");
        });
        // console.log("i got here" + JSON.stringify(ReturnData));
        // res.send(ReturnData);
    }).catch(function () {
        console.log("Promise Rejected for /api/TestResults in shift data");
    });
    }

    */

    app.get('/api/Lines/:ParmLocation/:ParmName', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmName = req.params.ParmName;
        if (debugMode == true) {
            console.log('/api/Lines called for ' + ParmLocation + ' ' + ParmName + ' @ ' + Date());
        }


        
        // execute a database query to get lines for a Location
        var SQL = `SELECT * FROM LineOptions
        WHERE  Location = '${ParmLocation}' and LineName like '%${ParmName}%` 
        var PromiseLines = db.DBQueryCommon(SQL);
    
        PromiseLines.then(function(result) {

                let Line = [];
                result.recordset.forEach(function(row){
                    Line.push(Object.values(Object.values(row))[2]);
                });
                if (debugMode == true) {
                    console.log('/api/Lines completed @ ' + Date());
                    console.log('Data: ' + JSON.stringify({ Line: Line }))
                }
                res.send(JSON.stringify({ Line: Line}));
            }).catch(function () {
                console.log("Promise Rejected for /api/Lines in test data");
            });
    })
    app.get('/api/MachinedToday/:ParmLocation/:ParmDepartment', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        //var ParmDepartment = req.params.ParmDepartment;
        if (debugMode == true) {
            console.log('/api/ManifoldToday called for ' + ParmLocation + ' @ ' + Date());
        }
        var query = `SET NOCOUNT ON;
        DECLARE @Start DATETIME = dateadd(hour,6,dateadd(day, datediff(day, 0, dateadd(day, -0, getdate())),0)) -- 06:00 of some date back
        --DECLARE @End datetime = dateadd(day,1,@Start)
        DECLARE @End datetime = dateadd(hour,1,dateadd(day, datediff(day, 0, dateadd(day, +1, getdate())),0)) -- 01:00 tomorrow
		--SELECT @Start, @End
        DECLARE @Department VARCHAR(15) = '${req.params.ParmDepartment}';
        DECLARE @AnalyseDateStart DATETIME = @Start;

        -- create an empty table with layout needed
        SELECT top 0 * into #TempTable from f_ProductionOutputData(@AnalyseDateStart,DATEADD(hour,19,@AnalyseDateStart),@Department);

        WHILE CONVERT(date, @AnalyseDateStart) < CONVERT(date, @End) BEGIN
            --@AnalyseDateEnd =
            INSERT INTO #TempTable SELECT * FROM f_ProductionOutputData(@AnalyseDateStart,DATEADD(hour,19,@AnalyseDateStart),@Department) ORDER BY Machine;
            SELECT @AnalyseDateStart = DATEADD(day,+1,@AnalyseDateStart);
        END
        SELECT Machine, SUM(Produced) AS Produced, Sum(T.GoalPieces) AS Goal, SUM(T.Produced) / ISNULL(Sum(T.GoalPieces),.0001) * 100 AS Utilization
            FROM #TempTable AS t
            GROUP BY Machine
            ORDER BY Machine;
        DROP TABLE #TempTable;`

        //console.log(query);

        var PromiseMachinedToday = db.DBQueryBHBrowser(query);
        PromiseMachinedToday.then(function(result) {
            if (debugMode == true) {
                console.log(`/api/MachinedToday${ParmLocation}  completed @ ${Date()}`);
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log("Promise Rejected for api/MachinedToday " + ParmLocation + " Dept:" + req.params.ParmDepartment);
        });
    })
    app.get('/api/MachinedWeek/:ParmLocation/:ParmDepartment', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        if (debugMode == true) {
            console.log('/api/ManifoldWeek called for ' + ParmLocation + ' @ ' + Date());
        }

        var query = `SET NOCOUNT ON;
        DECLARE @Start DATETIME = dateadd(hour,6,dateadd(day, datediff(day, 0, dateadd(day, -7, getdate())),0)) -- 06:00 of some date back
        DECLARE @End datetime = dateadd(hour,1,dateadd(day, datediff(day, 0, dateadd(day, +1, getdate())),0)) -- 01:00 tomorrow
        DECLARE @Department VARCHAR(15) = '${req.params.ParmDepartment}';
        DECLARE @AnalyseDateStart DATETIME = @Start;

        -- create an empty table with layout needed
        SELECT top 0 * into #TempTable from f_ProductionOutputData(@AnalyseDateStart,DATEADD(hour,19,@AnalyseDateStart),@Department);

        WHILE CONVERT(date, @AnalyseDateStart) < CONVERT(date, @End) BEGIN
            --@AnalyseDateEnd =
            INSERT INTO #TempTable SELECT * FROM f_ProductionOutputData(@AnalyseDateStart,DATEADD(hour,19,@AnalyseDateStart),@Department) ORDER BY Machine;
            SELECT @AnalyseDateStart = DATEADD(day,+1,@AnalyseDateStart);
        END
        SELECT Machine, SUM(Produced) AS Produced, Sum(T.GoalPieces) AS Goal, SUM(T.Produced) / ISNULL(Sum(T.GoalPieces),.0001) * 100 AS Utilization
            FROM #TempTable AS t 
            GROUP BY Machine;
        DROP TABLE #TempTable;`

        var PromiseMachinedW = db.DBQueryBHBrowser(query);
        PromiseMachinedW.then(function(result) {
            if (debugMode == true) {
                console.log(`/api/MachinedWeek${ParmLocation}  completed @ ${Date()}`);
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log("Promise Rejected for api/MachinedWeek"  + ParmLocation + " Dept:" + req.params.ParmDepartment);
        });
    })
    app.get('/api/PlannersForDepartment/:ParmLocation/:ParmDepartment', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmDepartment = req.params.ParmDepartment;
        if (debugMode == true) {
            console.log('/api/PlannersForDepartment called for ' + ParmLocation + ' Department ' + ParmDepartment + ' @ ' + Date());
        }
        // First get planners for this department
        var query = `SELECT Planners FROM DeptPlanners where Department = '${ParmDepartment}'`
        var PromisePlanners = db.DBQueryBHBrowser(query);
        var Planners = '';
        PromisePlanners.then(function(result) {
            result.recordset.forEach(function(row){
                Planners = Object.values(Object.values(row))[0];
            });
            if (debugMode == true) {
                console.log('/api/Planners completed @ ' + Date());
                console.log('Planners: ' + Planners);
            }
            res.send(Planners);
        }).catch(function () {
            console.log("Promise Rejected for /api/Planners");
        });
    })
	app.get('/api/ScrapByPlanners/:ParmLocation/:ParmPlanners', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        var ParmPlanners = req.params.ParmPlanners;
        if (debugMode == true) {
            console.log('/api/ScrapByPlanners called for ' + ParmLocation + ' Planners ' + ParmPlanners + ' @ ' + Date());
        }
        var query = ` SELECT * from (SELECT TO_CHAR(SYSDATE,'yyyyww') - TO_CHAR(TO_DATE(to_char(1900000 + ILTRDJ), 'YYYYDDD'),'yyyyww') AS Week,
        SUM(ILTRQT / 1000 * -1) AS TOTQTY, SUM(ILPAID / 100 * -1) AS TOTAMT
        FROM PRODDTA.F4111
        JOIN PRODDTA.F4102 ON ILITM = IBITM AND IBMCU = ILMCU AND IBANPL NOT IN (50030002,50030039)
        JOIN PRODDTA.F4101 ON IMLITM = ILLITM
        JOIN PRODCTL.F5500001 On ILTRDJ = DCGRDT
        LEFT JOIN PRODCTL.F0005 ON ILRCD= LTRIM(F0005.Drky)
        And DRSY='42' AND DRRT='RC'
        WHERE ILMCU = '       50010' AND ILDCT IN('ID', 'IS')
        AND  TO_DATE(to_char(1900000 + ILTRDJ), 'YYYYDDD')  >  SYSDATE - 35 
        AND IBANPL IN (${ParmPlanners})
        AND ILRCD NOT IN('517','509') AND ILUSER <> 'HIPPK'
        GROUP BY TO_CHAR(SYSDATE,'yyyyww') - TO_CHAR(TO_DATE(to_char(1900000 + ILTRDJ), 'YYYYDDD'),'yyyyww') 
        ORDER BY Week ASC) WHERE ROWNUM < 6 `
        
        //console.log(query); // testing

        var PromiseScrap = db.DBQueryJDE(query);
        PromiseScrap.then(function(result) {
            //console.log ('PROD ' + JSON.stringify(result));
            if (debugMode == true) {
                 console.log(`/api/ScrapByPlanners ${ParmLocation} ${ParmPlanners}  completed @ ${Date()}`);
            }
            res.send(result);
        }).catch(function () {
            console.log("Promise Rejected for api/ScrapByPlanners");
        });
    })

    app.get('/api/WOBOM/:ParmWO', (req, res) => {
        var ParmWO = req.params.ParmWO;
        if (debugMode == true) {
            console.log('/api/WOBOM called for ' + ParmWO + ' @ ' + Date());
        }
        var query = `SELECT WALITM AS KItem, P.IMDSC1 as KDesc1, P.IMDSC2 As KDesc2, WAUORG / 1000 as WOQTY, WMCPNB / 100 AS Sequence, WMCPIT as ItemShort, WMCPIL AS ItemLong, B.IMDSC1, B.IMDSC2, WMUORG / 1000 AS Quantity, SUM(LIPQOH/1000) AS OH, BUY55AIS09
            FROM PRODDTA.F3111 
            JOIN PRODDTA.F4801 WO ON WO.WADOCO = WMDOCO and WADCTO = 'WO' 
            JOIN PRODDTA.F4101 P ON P.IMLITM = WALITM 
            JOIN PRODDTA.F4101 B ON B.IMITM = WMCPIT 
            JOIN PRODDTA.F41021 ON LIITM = B.IMITM AND LIMCU = WAMCU 
            JOIN PRODDTA.F5541001 ON BUITM = WMCPIT
                    WHERE  WMDOCO = ${ParmWO}  
            GROUP BY WALITM, P.IMDSC1, P.IMDSC2, WAUORG, WMCPNB, WMCPIT, WMCPIL, B.IMDSC1, B.IMDSC2, WMUORG, BUY55AIS09
            ORDER BY WMCPNB`

        
        console.log(query); // testing

        var PromiseWOBOM = db.DBQueryJDE(query);
        PromiseWOBOM.then(function(result) {
            //console.log ('PROD ' + JSON.stringify(result));
            if (debugMode == true) {
                 console.log(`/api/WOBOM ${ParmWO}  completed @ ${Date()}`);
            }
            res.send(result);
        }).catch(function () {
            console.log("Promise Rejected for api/WOBOM");
        });
    });

    app.get('/api/MachineSchedule/:ParmLocation/:ParmDepartment', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        if (debugMode == true) {
            console.log('/api/ManifestSchedule called for ' + ParmLocation + ' @ ' + Date());
        }
        var query = `SET NOCOUNT ON ;
        SELECT DISTINCT E.Machine AS Machine, JS.JDEWO, CONVERT(Char(10),ReqDte,126) As ReqDte, js.JDEItm, WOSts, ISNULL(ABALPH,'') As Customer, FlashMsg, js.Desc1, JS.Desc2, 
        HourRate AS JDEPcsHr,  ISNULL(TotalProd,0) as Produced, JS.QtyOrd - ISNULL(TotalProd,0)  AS Remaining
        from ProdJobStsNW JS
        JOIN ProdJobStsNWExtra E ON E.JDEWO = JS.JDEWO
        left JOIN ProdRptDtl RD ON RD.JDEWO = JS.JDEWO
        left JOIN  ProdRptHdr RH ON RH.JDEWO = RD.JDEWO 
        left JOIN  F0101Address a ON a.ABAN8 = JS.JDECus 
        where JS.Department = '${req.params.ParmDepartment}' AND E.Machine > 'A'
        --AND ReqDte BETWEEN GetDate() and DateAdd(day,7,GetDate())
        ORDER by Machine, ReqDte;`

        //console.log(query);

        var PromiseCommon = db.DBQueryBHBrowser(query);
        PromiseCommon.then(function wait (result) {
            if (debugMode == true) {
                console.log('/api/MachineSchedule' + ParmLocation + '  completed @ ' + Date());
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log("Promise Rejected for api/ManifestSchedule");
        });
    })

    app.get('/api/MachineScheduleGraph/:ParmLocation/:ParmDepartment', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        if (debugMode == true) {
            console.log('/api/ManifestScheduleGraph called for ' + ParmLocation + ' @ ' + Date());
        }
        var query = `		SET NOCOUNT ON ;
        SELECT MAX(E.Machine) AS Machine, JS.JDEWO, MAX(HourRate) AS JDEPcsHr,  ISNULL(SUM(TotalProd),0) as Produced, MAX(JS.QtyOrd) - ISNULL(SUM(TotalProd),0)  AS Remaining
        INTO #Temp   
        from ProdJobStsNW JS
        JOIN ProdJobStsNWExtra E ON E.JDEWO = JS.JDEWO
        left JOIN ProdRptDtl RD ON RD.JDEWO = JS.JDEWO
        left JOIN  ProdRptHdr RH ON RH.JDEWO = RD.JDEWO 
        where JS.Department = '${req.params.ParmDepartment}' AND E.Machine > 'A'
        GROUP BY  E.Machine, JS.JDEWO
		UNION ALL
		SELECT MachineCde as Machine, 0 AS JDEWO, 0 AS JDEPcHr, 0 AS Produced, 0 AS Remaining 
		from MachineParms WHERE Department = '${req.params.ParmDepartment}' AND MachineCde NOT IN (SELECT E.Machine AS Machine
			from ProdJobStsNW JS
			JOIN ProdJobStsNWExtra E ON E.JDEWO = JS.JDEWO
	        left JOIN ProdRptDtl RD ON RD.JDEWO = JS.JDEWO
	        left JOIN  ProdRptHdr RH ON RH.JDEWO = RD.JDEWO 
			where JS.Department = '${req.params.ParmDepartment}' AND E.Machine > 'A')
			AND  MachineCde <> 'TEST' 
        ORDER BY Machine, JDEWO;

        SELECT DISTINCT t1.Machine, A.*
        FROM #Temp t1
        CROSS APPLY
        (SELECT                   CAST(JDEWO  AS NVARCHAR)
        + CAST('-' AS NVARCHAR) + CAST(JDEPcsHr AS NVARCHAR) 
        + CAST('-' AS NVARCHAR) + CAST(Produced AS NVARCHAR) 
        + CAST('-' AS NVARCHAR) + CAST(Remaining AS NVARCHAR) AS WO   from #Temp t2 WHERE t2.Machine = t1.Machine    FOR XML PATH('')   
        ) a (DataString)
        WHERE DataString <> '<WO>0-0-0-0</WO>'

        DROP table #Temp`

        //console.log(query);

        var PromiseCommon = db.DBQueryBHBrowser(query);
        PromiseCommon.then(function wait (result) {
            if (debugMode == true) {
                console.log('/api/MachineScheduleGraph' + ParmLocation + '  completed @ ' + Date());
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log("Promise Rejected for api/ManifestScheduleGraph");
        });
    })
    app.post('/api/UpdateProdSched/:ParmLocation', (req, res) => {
        var ParmLocation = req.params.ParmLocation;
        //if (debugMode == true) {
            console.log('/api/UpdateProdSched called for ' + ParmLocation + ' @ ' + Date());
        //}
        var query = `SELECT 'Hello' as Message;`

        var PromiseCommon = db.DBQueryBHBrowser(query);
        PromiseCommon.then(function(result) {
            if (debugMode == true) {
                console.log('/api/UpdateProdSched' + ParmLocation + '  completed @ ' + Date());
            }
            res.send(result.recordset);
        }).catch(function () {
            console.log("Promise Rejected for api/UpdateProdSched");
        });
    })
    app.post('/api/SendEmail/:Program/:To/:Subject/:Body', (req, res) => {
        //var ParmLocation = req.params.ParmLocation;
		var nodemailer = require('nodemailer'); 
		var transporter = nodemailer.createTransport({
		debug: true,
		host: 'SMTP.BucherHydraulics.com',
		secureConnection: false, 
		port: 25,
		//tls: {cipher:'SSLv3'}
		//,
		//auth: {
		//      user: 'ourdomain\\noreply',
		//      pass: 'the password'
        tls: {
            rejectUnauthorized: false  // because we don't have a valid cert
        } 
		})

		var mailOptions = {
		from: 'PROG.GR@BucherHydraulics.com',
		to: req.params.To,
		subject: req.params.Subject,
		text: req.params.Body
		};

		transporter.sendMail(mailOptions, function(error, info){
			if (error) {
				console.log(error);
                res.send(error);
			} else {
				//console.log('Email sent: ' + info.response);
                res.send('Mail Sent');
			}
		}
		);
    })

    // New code for gathering OEE Production Data for the Newaygo dashboards
    app.get('/api/GetProductionOEE/:ParmDepartment/:ParmDate/:ParmShift', (req, res) => {
        if (debugMode) 
            console.log('/api/GetProductionOEE called for ' + req.params.ParmDepartment + ' @ ' + Date());

        // Fetch the paramaters from the API request
        const department = req.params.ParmDepartment;
        const date = req.params.ParmDate;
        const shift = req.params.ParmShift;

        // Call the search query, then respond to the dashboard with that data
        const query = 
        `SELECT Department, Machine, AVG(WOPerformance) as WOPerformance, AVG(WOAvailability) as WOAvailability
        FROM ProductionOEEData 
        WHERE Department = '${department}' AND Date >= '${date}' AND Shift = '${shift}'
        GROUP BY Department, Machine
        ORDER BY Department, Machine`;

        const results = db.DBQueryBHBrowser(query);
        results.then(function(result) {
            res.send(result.recordset);
        }).catch(function(){
            console.log("OEE production data could not be loaded!");
        })

    });

    app.get('/api/GetAverageOEE/:ParmDepartment/:ParmDate/:ParmShift', (req, res) => {
        if (debugMode)
            console.log('/api/GetAverageOEE called for ' + req.params.ParmDepartment + ' @ ' + Date());

        const department = req.params.ParmDepartment;
        const date = req.params.ParmDate;
        const shift = req.params.ParmShift;
        
        // Search query here
        const query = `
        SELECT AVG(WOPerformance) as WOPerformance, AVG(WOAvailability) as WOAvailability
        FROM ProductionOEEData
        WHERE Department = '${department}' AND Date >= '${date}' AND Shift = '${shift}'`;

        const results = db.DBQueryBHBrowser(query);
        results.then(function(result) {
            res.send(result.recordset);
        }).catch(function() {
            console.log("OEE production data could not be loaded!");
        })
    });

}
