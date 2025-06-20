import {ReactComponent as Player1} from './assets/clean/player1-clean.svg';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();
    return (
        <div id="Background" style={{background: "black", height: "10vh", width: "10vw", padding: "45vh 45vw 45vh 45vw"}}>
            {/* <Player1 style={{width: "100px", height: "100px"}} /> */}
            <button id='singleplayer' className='startbutton' onClick={() => navigate('/singleplayerstart')}>Single Player</button>
            <br />
            <br />
            <button id='multiplayer' className='startbutton' onClick={() => navigate('/multiplayerstart')}>Multiplayer</button> 
            {/* Multiplayer is not supported yet. */}
        </div>
  );
};

export default HomePage;