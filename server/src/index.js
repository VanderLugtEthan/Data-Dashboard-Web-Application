//'use strict';
global.debugMode = false;  // used to print extra stuff to console
// Required modules
const express = require('express');
const cors = require('cors');   // Cors is a way to easily communicate between client and server during DEV PHASE
const path = require('path');
//const exphbs  = require('express-handlebars'); //Change
//const hbs = exphbs.create({ defaultLayout:'main', extname: '.handlebars' }); //Channge
const axios = require('axios');
const exphbs  = require('express-handlebars'); //Change
const hbs = exphbs.create({ defaultLayout:'main', extname: '.handlebars' }); //Channge

// DEFINE the path to your scheduled function(s)
const scheduledFunctions = require('./api/misc.js');

const app = express();
const CronJob = require('node-cron');


//================================Set up engine =====================================
app.engine('handlebars', hbs.engine); // Change
app.set('view engine', 'handlebars'); // Change
app.set('views', path.join(__dirname, '../../client/src/components'));
app.set('trust proxy', true);

//Tells where to find css and js root folder. WILL BE MESSY UNTIL HANDLEBARS IS GONE!
app.use(express.static(path.join(__dirname, '../../client/build'))); 
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors());

require('events').EventEmitter.prototype._maxListeners = 100;
hostname = "Temp"   //TODO: CHANGE
// console.log("Hostname is:- " + hostname);

//====================================================================

require('../../server/src/api/Production.js')(app);  // my API routes

// Handling '/' request with template
app.get('/', (req, res) => {
    console.log("root page requested")
    res.send('<h2>Please specify which dashboard to display in URL</h2>');
});

/*
app.get('/pls_PUAssembly/:ParmLocation/:ParmLine/', (req, res) => {
    const ParmLocation = req.params.ParmLocation;
    const ParmLine = req.params.ParmLine;

    if (debugMode) {
        console.log("pls_PUAssembly page requested for " + ParmLocation + " Line " + ParmLine + ' Computer: ' + hostname);
    }
    res.render('pls_PUAssembly', {title: 'PU Assembly' , ParmLocation: ParmLocation, ParmLine: ParmLine, ParmIP: ''}); //req.ip
});

*/

// Handling '/pls_PUAssemblyPicking' request with template
app.get('/pls_PUAssemblyPicking/:ParmLocation', (req, res) => {
    const ParmLocation = req.params.ParmLocation;
    if (debugMode) {
        console.log("pls_PUAssemblyPicking page requested for " + ParmLocation + ' Computer: ' + hostname);
    }
    res.render('pls_PUAssemblyPicking', {ParmLocation: ParmLocation});
});
/* Handling '/pls_all' request with template
app.get('/pls_PUAssemblyAll/:ParmLocation', (req, res) => {
    const ParmLocation = req.params.ParmLocation;
    if (debugMode) {
        console.log("pls_PUAssemblyAll page requested for " + ParmLocation + ' Computer: ' + hostname);
    }
    res.render('pls_PUAssemblyAll', {ParmLocation: ParmLocation});
});
*/
// Handling '/PLSJD' request with template
app.get('/pls_jd/:ParmLocation/:ParmLine', (req, res) => {
    const ParmLocation = req.params.ParmLocation;
    const ParmLine = req.params.ParmLine;
    if (debugMode) {
        console.log("PLSJD page requested for " + ParmLocation + " Line " + ParmLine + ' Computer: ' + hostname);
    }
    res.render('pls_jd', {ParmLocation: ParmLocation, ParmLine: ParmLine});
});
// Handling '/PLS_PumpTest' request with template
app.get('/pls_PumpTest/:ParmLocation/:ParmLine', (req, res) => {
    const ParmLocation = req.params.ParmLocation;
    const ParmLine = req.params.ParmLine;
    if (debugMode) {
        console.log("PLS_PumpTest page requested for " + ParmLocation + " Line " + ParmLine + ' Computer: ' + hostname);
    }
    res.render('pls_PumpTest', {ParmLocation: ParmLocation, ParmLine: ParmLine});
});
// Handling '/PLS_PumpMachining' request with template
app.get('/pls_PumpMachining/:ParmLocation', (req, res) => {
    const ParmLocation = req.params.ParmLocation;
    if (debugMode) {
        console.log("pls_PumpMachining page requested for " + ParmLocation + ' Computer: ' + hostname);
    }
    res.render('pls_PumpMachining', {ParmLocation: ParmLocation});
});
// Handling '/PLS_Manifold' request with template
app.get('/pls_Manifold/:ParmLocation', (req, res) => {
    const ParmLocation = req.params.ParmLocation;
    if (debugMode) {
        console.log("PLS_Manifold page requested for " + ParmLocation );
    }
    res.render('pls_Manifold', {ParmLocation: ParmLocation});
});
// Handling '/PLS_ManifoldOld' request with template
app.get('/pls_ManifoldOld/:ParmLocation', (req, res) => {
    const ParmLocation = req.params.ParmLocation;
    if (debugMode) {
        console.log("PLS_ManifoldOld page requested for " + ParmLocation + ' Computer: ' + hostname);
    }
    res.render('pls_ManifoldOld', {ParmLocation: ParmLocation});
});

// Handling '/APIPostTester' request
app.get('/APIPostTester', (req, res) => {
    let APIURL = ''; 
    let UID = '';
    let PW = '';
    try {
        APIVerb = req.query.APIVerb;
        APIURL = req.query.APIURL;
    } catch {
        res.send('<h2>Please specify verb and api url</h2>');    }
    try {
        UID = req.query.user.UID;
        PW = req.query.user.PW;
    } catch {
        // not a big deal if credentials not passed.  API will verify if needed
    }
    if(APIURL > ' ' & UID > ' ' & PW > ' ') {
        if (debugMode) {
            console.log('API requested with credentials:' + APIURL + ' ' + UID + ' ' + PW);
        }
        res.render('APIPostTester', {APIVerb: APIVerb, APIURL: APIURL, UID: UID, PW: PW});
    }
    else {
        if(APIURL > ' ') {
            if (debugMode) {
                console.log('API Requested:' + APIURL);
            }
                res.render('APIPostTester', {APIVerb: APIVerb, APIURL: APIURL});
        } else {
            res.render('APIPostTester');
        }
    }
});

/* Not needed for a react app
app.get('/pls_OEEDashboard/:ParmDepartment', (req, res) => {
    const ParmDepartment = req.params.ParmDepartment;

    // Render infromation about the webpage here
    try {
        req.query.ParmDepartment;
        res.sendFile(path.join(__dirname, '../../client/build'));
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Database error!")
    }
});
*/

// Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/build/index.html'));
});

// ADD CALL to execute your function(s)
//scheduledFunctions.initScheduledJobs();

// Server activate
app.listen(3000, () => {
    console.log('Dashboard server listening on port 3000');
});

// Error Handlinga
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send(JSON.stringify('Something broke!  Please contact IT'));
});

