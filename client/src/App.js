
/**
 * Simple routing script intended to provide the user with the proper weblinks
 * 
 * @author Ethan VanderLugt
 * @rev 2025-08-05
 */

// Browser routes provide web links for the react compontents that were created
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {OEEDashboardWrapper, PUAssemblyAllWrapper, PUAssemblyPickingWrapper} from './wrappers/Wrappers.js';

// This function will create routes allowing react to know what to render on a given page
function App() {
  return(
    <Router>
      <Routes>
        <Route path="/pls_OEEDashboard/:department" element={<OEEDashboardWrapper />}></Route>
        <Route path="/pls_PUAssemblyAll/:location" element={<PUAssemblyAllWrapper />}></Route>
        <Route path="/pls_PUAssemblyPicking/:location" element={<PUAssemblyPickingWrapper />}></Route>
      </Routes>
    </Router>
  );
}

export default App;