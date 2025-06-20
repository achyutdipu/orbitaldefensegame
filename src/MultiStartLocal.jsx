import {ReactComponent as Player1} from './assets/clean/player1-clean.svg';
import { useNavigate } from 'react-router-dom';

const MultiplayerStartPageLocal = () => {
  const navigate = useNavigate();
  return (
    <div id="Background" style={{background: "black", height: "10vh", width: "10vw", padding: "45vh 45vw 45vh 45vw"}}>
      <div id="MultiplayerboxLocal" className='startbox'>
        
      </div>
    </div>
  );
};

export default MultiplayerStartPageLocal;