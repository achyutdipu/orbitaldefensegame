import {ReactComponent as Player1} from './assets/clean/player1-clean.svg';
import { useNavigate } from 'react-router-dom';

const MultiplayerStartPage = () => {
  const navigate = useNavigate();
  return (
    <div id="Background" style={{background: "black", height: "10vh", width: "10vw", padding: "45vh 52.5vw 45vh 37.5vw"}}>
        <button id='multiplayerlocal' className='multiplayerbutton' onClick={() => navigate('/multiplayerstartlocal')}>Local (Computer only, max of 2 players)</button>
            <br />
            <br />
        <button id='multiplayeronline' className='multiplayerbutton' onClick={() => navigate('/multiplayerstartonline')}>Online (Up to 10 players, any devices)</button> 
    </div>
  );
};

export default MultiplayerStartPage;