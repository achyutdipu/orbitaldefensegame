import {ReactComponent as Player1} from './assets/clean/player1-clean.svg';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();
    function handleSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const formJson = Object.fromEntries(formData.entries());
        console.log(formJson);
        // Navigate to home page after form submission
        navigate('/home');
    }
    return (
        <div id="Background" className='background'>
            <form onSubmit={handleSubmit}>
                <div id="Form" className='startbox' style={{height: "50vh"}}>
                    <div id="FormTitle" style={{fontWeight: "bold"}}>
                        <h1>LOGIN</h1>
                    </div>
                    <div id="FormUsername" style={{fontWeight: "500"}}>
                        <h2>Username</h2>
                        <input type="text" id="username" name="username" className='textbox'/>
                    </div>
                    <div id="FormPassword" style={{fontWeight: "500"}}>
                        <h2>Password</h2>
                        <input type="password" id="password" name="password" className='textbox' />
                    </div>
                    <button id='submitButton' className='startbutton' style={{marginTop: "2vh"}}>Log In</button>
                    <p>Don't have an account? Sign up <a href='./signup'>here</a>.</p>
                </div>
            </form>
        </div>
  );
};

export default LoginPage;