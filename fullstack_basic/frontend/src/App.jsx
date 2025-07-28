import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios';
import { useEffect } from 'react';

function App() {
  const [jokes,setJokes] = useState([])

  useEffect(() => {
    axios.get('/api/jokes')
      .then((response) => {
        setJokes(response.data);    
        console.log(response.data);
      })
      .catch((error) => {
        console.error('Error fetching jokes:', error);
      }); 
  });

  return (
    <>
      <div>
        <h1>Hey</h1>
        <p>Jokes:{jokes.length}</p>
        {
          jokes.map((joke) => (
            <div key={joke.id}>
              <h2>{joke.title}</h2>
              <p>{joke.joke}</p>
            </div>
          ))
        }
      </div>
    </>
  )
}

export default App
