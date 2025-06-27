import {ReactComponent as Player1} from './assets/clean/player1-clean.svg';
import { useNavigate } from 'react-router-dom';
import { setNavigate, handleLogin } from './backend';
import { useEffect } from 'react';

const LoginPage = () => {
    const navigate = useNavigate();
    useEffect(() => {
        setNavigate(navigate);
    }, [navigate]);
    return (
        <div id="Background" className='background'>
            <form onSubmit={handleLogin}>
                <div id="Form" className='startbox' style={{height: "50vh"}}>
                    <div id="FormTitle" style={{fontWeight: "bold"}}>
                        <h1>LOGIN</h1>
                    </div>
                    <div id="FormUsername" style={{fontWeight: "500"}}>
                        <h2>Username</h2>
                        <input type="text" id="username" name="username" className='textbox'/>
                        <p id='Cname' style={{fontSize: "0.8em", color: "red", display: "none"}}>That username does not exist. Please sign up <a href='./signup'>here</a>.</p>
                    </div>
                    <div id="FormPassword" style={{fontWeight: "500"}}>
                        <h2>Password</h2>
                        <input type="password" id="password" name="password" className='textbox' />
                        <p id='Cpass' style={{fontSize: "0.8em", color: "red", display: "none"}}>Password is incorrect.</p>
                    </div>
                    <button id='submitButton' className='startbutton' style={{marginTop: "2vh"}}>Log In</button>
                    <p>Don't have an account? Sign up <a href='./signup'>here</a>.</p>
                </div>
            </form>
        </div>
  );
};

export default LoginPage;