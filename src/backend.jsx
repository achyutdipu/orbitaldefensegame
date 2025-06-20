import emailjs from '@emailjs/browser';
import Cookies from 'js-cookie';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Function to add minutes to a date
export const addMinutes = (date, minutes) => {
    return new Date(date.getTime() + minutes * 60000);
}
emailjs.init("PYJw21kpCiM0M_qgX");
let navigate = null;
export const setNavigate = (navFunction) => {
    navigate = navFunction;
}
export const sendEmail = (email, passcode) => {
    // Create template parameters
    let date = addMinutes(new Date(), 5);
    console.log(date.toLocaleDateString() + " " + date.toLocaleTimeString());
    const templateParams = {
        email: email,
        passcode: passcode,
        time: date.toLocaleDateString() + " " + date.toLocaleTimeString()
    };
    // Send email using EmailJS
    emailjs.send("orbitaldefensegame_email", "template_4ovfhef", templateParams)
        .then((response) => {
            console.log('Email sent successfully:', response);
        })
        .catch((error) => {
            console.error('Email sending failed:', error);
        });
};
export const newSend = () => {
    const passcode = Math.random().toString(36).substring(2, 8);
    sendEmail(Cookies.get('email'), passcode);
    Cookies.set('OTP', passcode, { expires: addMinutes(new Date(), 5) });
}
export const signUp = (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const formJson = Object.fromEntries(formData.entries());
    // console.log(formJson);
    const passcode = Math.random().toString(36).substring(2, 8);
    if (formJson.username == "") {
        document.getElementById("Cname").style.display = "block";
        return;
    } else {
        document.getElementById("Cname").style.display = "none";
    }
    if (formJson.password.length < 8) {
        document.getElementById("Cpass1").style.display = "block";
        return;
    } else {
        document.getElementById("Cpass1").style.display = "none";
    }
    if (!formJson.password.match(/[0-9]/) && !formJson.password.match(/[^a-zA-Z0-9]/)) {
        document.getElementById("Cpass2").style.display = "block";
        return;
    } else {
        document.getElementById("Cpass2").style.display = "none";
    }
    if (formJson.password != formJson.cpassword) {
        document.getElementById("Ccpass").style.display = "block";
        return;
    } else {
        document.getElementById("Ccpass").style.display = "none";
    }
    if (formJson.email == "") {
        document.getElementById("Cemail").style.display = "block";
        return;
    } else {
        document.getElementById("Cemail").style.display = "none";
    }
    if (formJson.email) {
        sendEmail(formJson.email, passcode);
    }
    Cookies.set('tempuser', formJson.username);
    Cookies.set('OTP', passcode, { expires: addMinutes(new Date(), 5) });
    Cookies.set('email', formJson.email, { expires: addMinutes(new Date(), 5) });
    // Navigate to confirmation page after form submission
    navigate('/confirmation');
}
export const handleConfirmation = (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const formJson = Object.fromEntries(formData.entries());
    if (formJson.passcode == "") {
        document.getElementById("Cpass1").style.display = "block";
            return;
    } else {
        document.getElementById("Cpass1").style.display = "none";
    }
    if (formJson.passcode.length != 6) {
        document.getElementById("Cpass2").style.display = "block";
        return;
    } else {
        document.getElementById("Cpass2").style.display = "none";
    }
    if (!Cookies.get('OTP')) {
        document.getElementById("Cpass3").style.display = "block";
        return;
    } else {
        document.getElementById("Cpass3").style.display = "none";
    }
    if (formJson.passcode == Cookies.get('OTP')) {
        Cookies.set('username', Cookies.get('tempuser'));
        navigate('/home');
    } else {
        document.getElementById("Cpass4").style.display = "block";
    }
}