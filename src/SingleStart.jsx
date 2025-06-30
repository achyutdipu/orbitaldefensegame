import {ReactComponent as Player1} from './assets/clean/player1-clean.svg';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db, rerout } from './backend';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';

const SingleplayerStartPage = () => {
  const navigate = useNavigate();
  const [numGames, setNumGames] = useState(0);
  
  useEffect(() => {
    rerout(navigate);
    
    // Fetch user data
    const fetchUserData = async () => {
      try {
        if (Cookies.get('username')) {
          const docRef = doc(db, "Users", Cookies.get('username'));
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data().spgames) {
            setNumGames(docSnap.data().spgames);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, [navigate]);
  
  return (
    <div id="Background" className='background'>
      <div id="SingleplayerBox" className='startbox'>
        Saved Games: {numGames}/8
        <Games numGames={numGames} setNumGames={setNumGames} />
      </div>
    </div>
  );
};

function Games({ numGames, setNumGames }) {
  const navigate = useNavigate();
  const gameBoxes = [];
  
  // Existing games
  for (let i = 0; i < numGames; i++) {
    gameBoxes.push(
      <div key={i} className='gamebox' onClick={() => {
        let x = window.confirm("Do you want to load this game?");
        if (x) {
          Cookies.set('game', i.toString());
          navigate('/singleplayer');
        }
      }}>
        Game {i+1}
      </div>
    );
  }
  
  // Empty slots for new games
  for (let i = 0; i < 8-numGames; i++) {
    const gameIndex = numGames + i; // Calculate the actual game index
    gameBoxes.push(
      <div key={`new-${i}`} className='gamebox' onClick={async () => {
        let x = window.confirm("Do you want to create a new game?");
        if (x) {
          try {
            // Update the user's game count
            await setDoc(doc(db, "Users", Cookies.get('username')), {
              "spgames": numGames + 1
            }, { merge: true });
            
            // Update local state
            setNumGames(numGames + 1);
            // Create the game data document with the correct index
            await setDoc(doc(db, "Users", Cookies.get('username'), "spgamesdata", gameIndex.toString()), {
              level: 0,
              score: 0,
              time: 0,
              player: {
                x: 5, // Starting position
                y: 5, // Starting position
                dir: 0,
                speed: 1,
                width: 32,
                height: 64,
                color: "black",
                name: "Player1"
              },
              enemies: [],
              coins: {
                iron: 0,
                titanium: 0,
                gold: 0
              },
              path: [],
              towerdata: [],
              hearts: [],
              goal: {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                color: "dark brown"
              }
            });
            
            // Set this as the current game
            Cookies.set('game', gameIndex.toString());
            
            // Navigate to the game
            navigate('/singleplayer');
          } catch (error) {
            console.error("Error creating new game:", error);
          }
        }
      }}>
        Create New Game
      </div>
    );
  }
  return <>{gameBoxes}</>;
}

export default SingleplayerStartPage;
