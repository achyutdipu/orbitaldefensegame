import { useNavigate } from 'react-router-dom';
import {ReactComponent as Player1} from './assets/clean/player1-clean.svg';
import {setNavigate, handleSignUp} from './backend';
import { useEffect } from 'react';
const SignUpPage = () => {
    const navigate = useNavigate();
    useEffect(() => {
        setNavigate(navigate);
    }, [navigate]);
    return (
        <div id="Background" className='background'>
            <form onSubmit={handleSignUp}>
                <div id="signUpForm" className='startbox' style={{height: "75vh"}}>
                    <div id="FormTitle" style={{fontWeight: "bold"}}>
                        <h1>SIGN UP</h1>
                    </div>
                    <div id="FormUsername" style={{fontWeight: "500"}}>
                        <h2>Username</h2>
                        <input type="text" id="username" name="username" className='textbox'/>
                        <p id='Cname' style={{fontSize: "0.8em", color: "red", display: "none"}}>Username must not be empty.</p>
                    </div>
                    <div id="FormEmail" style={{fontWeight: "500"}}>
                        <h2>Email</h2>
                        <input type="email" id="email" name="email" className='textbox' />
                        <p id='Cemail' style={{fontSize: "0.8em", color: "red", display: "none"}}>Email must not be empty.</p>
                    </div>
                    <div id="FormPassword" style={{fontWeight: "500"}}>
                        <h2>Password</h2>
                        <input type="password" id="password" name="password" className='textbox' />
                        <p id='Cpass1' style={{fontSize: "0.8em", color: "red", display: "none"}}>Password must be at least 8 characters.</p>
                        <p id='Cpass2' style={{fontSize: "0.8em", color: "red", display: "none"}}>Password must have a number or special character.</p>
                    </div>
                    <div id="FormCPassword" style={{fontWeight: "500"}}>
                        <h2>Confirm Password</h2>
                        <input type="password" id="cpassword" name="cpassword" className='textbox' />
                        <p id='Ccpass' style={{fontSize: "0.8em", color: "red", display: "none"}}>Password and password confirmation should match.</p>
                    </div>
                    <button id='submitButton' className='startbutton' style={{marginTop: "2vh"}}>Sign Up</button>
                    <p>Already have an account? Log in <a href='./'>here</a>.</p>
                </div>
            </form>
        </div>
  );
};

export default SignUpPage;