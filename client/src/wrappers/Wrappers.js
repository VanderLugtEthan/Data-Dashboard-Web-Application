/**
 * Simple wrapper class that provides parameters to web links defined in app.js
 * 
 * @author Ethan VanderLugt
 * @rev 2025-08-05
 */

// useParams colllect parameters from web links
import { useParams } from 'react-router-dom';

// Lazy prevents the webpage from rendering until the web link is provided by the user
import { lazy, Suspense } from 'react';
const OEEDashboard = lazy(() => import('../components/pls_OEEDashboard.jsx'));
const PUAssemblyAll = lazy(() => import('../components/pls_PUAssemblyAll.jsx'));
const PUAssemblyPicking = lazy(() => import('../components/pls_PUAssemblyPicking.jsx'));

// Wrapper methods are used to pass parameters to the page without cluttering the app.js script
const OEEDashboardWrapper = () => {
  const { department } = useParams();
  return(
    <Suspense fallback={<center><div> Loading OEE Dashboard... </div></center>}>
      <OEEDashboard parmDepartment={department} />
    </Suspense>
  );
};

const PUAssemblyAllWrapper = () => {
  const { location } = useParams();
  return(
    <Suspense fallback={<center><div> Loading PUAssemblyAll... </div></center>}>
      <PUAssemblyAll parmLocation={location} />;    
    </Suspense>
  );
};

const PUAssemblyPickingWrapper = () => {
  const { location } = useParams();
  return(
    <Suspense fallback={<center><div> Loading PUAssemblyPicker... </div></center>}>
      <PUAssemblyPicking parmLocation={location}/>;    
    </Suspense>
  );
};

// Method exports allow its use as libraries in other javascript files
export {
  OEEDashboardWrapper,
  PUAssemblyAllWrapper,
  PUAssemblyPickingWrapper
};
