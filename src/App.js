import {ReactComponent as Player1} from './assets/clean/player1-clean.svg';
import './App.css';

function App() {
  return (
    <div id="Background" style={{background: "black", height: "10vh", width: "10vw", padding: "45vh 45vw"}}>
      {/* <Player1 style={{width: "100px", height: "100px"}} /> */}
      <div id='startbox' className='startbox'>
        <button id='singleplayer' className='startbutton'>Single Player</button>
        <br />
        <br />
        <button id='multiplayer' className='startbutton'>Multiplayer</button> 
        /*Multiplayer is not supported yet */
      </div>
    </div>
  );
}

export default App;
