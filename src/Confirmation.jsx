import { useNavigate } from "react-router-dom";
import {handleConfirmation, newSend, setNavigate} from "./backend";
import { useEffect } from "react";

const ConfirmationPage = () => {
    const navigate = useNavigate();
    useEffect(() => {
            setNavigate(navigate);
        }, [navigate]);
    return (
        <div id="Background" className='background'>
            <div id="ConfirmationBox" className='startbox' style={{height: "50vh"}}>
                <form onSubmit={handleConfirmation}>
                <div id="ConfirmationTitle" style={{fontWeight: "bold"}}>
                    <h1>CONFIRMATION</h1>
                </div>
                <div id="ConfirmationText" style={{fontWeight: "500"}}>
                    <p>A confirmation email has been sent to your email address. Please check your email and enter the passcode below.</p>
                </div>
                <div id="ConfirmationPasscode" style={{fontWeight: "500", padding: "0vh 0vw 1vh 0vw"}}>
                    <h2>Passcode</h2>
                    <input type="text" id="passcode" name="passcode" className='textbox' />
                    <p id='Cpass1' style={{fontSize: "0.8em", color: "red", display: "none"}}>Passcode must not be empty.</p>
                    <p id='Cpass2' style={{fontSize: "0.8em", color: "red", display: "none"}}>Passcode must be 6 characters.</p>
                    <p id='Cpass3' style={{fontSize: "0.8em", color: "red", display: "none"}}>Passcode has expired. Click <a style={{color: "blue", textDecoration: "underline", cursor: "pointer"}} onClick={newSend}>here</a> for a new one.</p>
                    <p id='Cpass4' style={{fontSize: "0.8em", color: "red", display: "none"}}>Passcode is incorrect.</p>
                </div>
                <div id="ConfirmationButton" style={{fontWeight: "500", padding: "1vh"}}>
                    <button id="confirm" className='startbutton' >Confirm</button>
                </div>
                </form>
            <p>Didn't receive an email? Click <a style={{color: "blue", textDecoration: "underline", cursor: "pointer"}} onClick={newSend}>here</a> to get a new one.</p>
            <p>Already have an account? Log in <a href='./'>here</a>.</p>
            <p>Don't have an account? Sign up <a href='./signup'>here</a>.</p>
            </div>
        </div>
    );
}
export default ConfirmationPage;