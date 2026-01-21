    import React, { useState } from 'react';

    function MyComponent() {
      const [count, setCount] = useState(0); // Declares 'count' state with initial value 0

      return (
        <div>
          <p>Count: {count}</p>
          <button onClick={() => setCount(count + 1)}>Increment</button>
        </div>
      );
    }

        import React, { useState, useEffect } from 'react';

    function DataFetcher() {
      const [data, setData] = useState(null);

      useEffect(() => {
        // This effect runs after every render (by default)
        // or when dependencies change (if specified in the dependency array)
        fetch('https://api.example.com/data')
          .then(response => response.json())
          .then(result => setData(result));

        // Optional cleanup function (runs when component unmounts or before re-running the effect)
        return () => {
          // Cleanup code here (e.g., unsubscribing from events)
        };
      }, [response]); // If any values in the array changes post run, then the page will rerun the useEffect() method

      return (
        <div>
          {data ? <p>Data: {JSON.stringify(data)}</p> : <p>Loading...</p>}
        </div>
      );
    }