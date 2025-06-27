import {ReactComponent as Player1} from './assets/clean/player1-clean.svg';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { rerout } from './backend';

const SingleplayerStartPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
          rerout(navigate);
      }, [navigate])
  const [numGames, setNumGames] = useState(0);
  
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
  for (let i = 0; i < numGames; i++) {
    gameBoxes.push(
      <div key={i} className='gamebox' onClick={() => {
        let x = window.confirm("Do you want to load this game?");
        if (x) {
          navigate('/singleplayer');
        }
        }}>
        Game {i+1}
      </div>
    );
  }
  for (let i = 0; i < 8-numGames; i++) {
    gameBoxes.push(
      <div key={i} className='gamebox' onClick={() => {
        let x = window.confirm("Do you want to create a new game?");
        if (x) {
          setNumGames(numGames+1);
        }
        }}>
        Create New Game
      </div>
    );
  }
  return <>{gameBoxes}</>;
}

export default SingleplayerStartPage;
