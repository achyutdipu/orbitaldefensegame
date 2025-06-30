import {ReactComponent as Player1} from './assets/clean/player1-clean.svg';
import { useNavigate } from 'react-router-dom';
import { rerout } from './backend';
import { useEffect } from 'react';

const HomePage = () => {
    const navigate = useNavigate();
    useEffect(() => {
        rerout(navigate);
    }, [navigate])
    return (
        <div id="Background" style={{background: "black", height: "10vh", width: "10vw", padding: "45vh 45vw 45vh 45vw"}}>
            {/* <Player1 style={{width: "100px", height: "100px"}} /> */}
            <button id='singleplayer' className='startbutton' onClick={() => navigate('/singleplayerstart')}>Single Player</button>
            <br />
            <br />
            {/* <button id='multiplayer' className='tobeadded' onClick={() => navigate('/multiplayerstart')}>Multiplayer</button>  */}
            {/* Multiplayer is not supported yet. */}
            <button id='multiplayer' className='tobeadded'>Multiplayer</button>
        </div>
  );
};

export default HomePage;