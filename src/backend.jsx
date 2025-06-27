import { setDoc, doc, getDoc, getFirestore } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import Cookies from 'js-cookie';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { app } from './firebase';
import bcrypt from 'bcryptjs';

const db = getFirestore(app);
// Function to add minutes to a date
export const addMinutes = (date, minutes) => {
    return new Date(date.getTime() + minutes * 60000);
}

export const endSession = () => {
    const allCookiesInfo = document.cookie.split("; ").filter(item => item.substring(0, 3) !== '_ga');
    let allCookiesName = [];
    allCookiesInfo.forEach(item => {
        let i = item.split('='); i.pop();
        allCookiesName.push(i.join('='));
    });
    for (const cookieName of allCookiesName) {
        Cookies.remove(cookieName);
    }
}
// Function to get cookie expiration date

export const rerout = (navigate) => {
    if (Cookies.get('username') === undefined || Cookies.get('username') === null) {
        navigate('/');
    }
}
// Function to hash passwords with bcrypt
export const hashPassword = (password) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

// Function to compare password with hash
export const comparePassword = (password, hash) => {
    return bcrypt.compareSync(password, hash);
}
emailjs.init("PYJw21kpCiM0M_qgX");
let navigate = null;
export const setNavigate = (navFunction) => {
    navigate = navFunction;
}
export const checkCookieExpiration = (cookieName) => {
    // Get the cookie value
    const cookieValue = Cookies.get(cookieName);
    if (!cookieValue) {
        return "Cookie does not exist";
    }
    // Use document.cookie to check for expiration info
    const allCookies = document.cookie;
    const cookieRegex = new RegExp(`${cookieName}=[^;]*(;|$)`);
    const cookieMatch = allCookies.match(cookieRegex);
    if (!cookieMatch) {
        return "Cookie exists but expiration cannot be determined";
    }
    // Check if the cookie has an expires attribute
    const expiresMatch = allCookies.match(new RegExp(`${cookieName}=[^;]*; expires=([^;]*)`));
    if (!expiresMatch) {
        return "Session cookie (expires when browser closes)";
    }
    return `Cookie expires on: ${new Date(expiresMatch[1]).toLocaleString()}`;
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
export async function handleSignUp(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const formJson = Object.fromEntries(formData.entries());
    const passcode = Math.random().toString(36).substring(2, 8);
    if (formJson.username === "") {
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
    if (formJson.password !== formJson.cpassword) {
        document.getElementById("Ccpass").style.display = "block";
        return;
    } else {
        document.getElementById("Ccpass").style.display = "none";
    }
    if (formJson.email === "") {
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
    Cookies.set('email', formJson.email);
    Cookies.set('hpassword', hashPassword(formJson.password));
    // Navigate to confirmation page after form submission
    navigate('/confirmation');
}
export async function handleConfirmation(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const formJson = Object.fromEntries(formData.entries());
    if (formJson.passcode === "") {
        document.getElementById("Cpass1").style.display = "block";
            return;
    } else {
        document.getElementById("Cpass1").style.display = "none";
    }
    if (formJson.passcode.length !== 6) {
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
    if (formJson.passcode === Cookies.get('OTP')) {
        // Set cookie to expire in 7 days
        Cookies.set('username', Cookies.get('tempuser'));
        try {
            // Wait for the database operation to complete with hashed password
            const success = await addtoDatabase(Cookies.get('username'), Cookies.get('hpassword'));
            if (!success) {
                document.getElementById("Cpass4").style.display = "block";
                return;
            }
            navigate('/home');
        } catch (error) {
            console.error("Error during confirmation:", error);
            document.getElementById("Cpass4").style.display = "block";
        }
    } else {
        document.getElementById("Cpass4").style.display = "block";
    }
}
export async function addtoDatabase(a, b) {
    try {
        const docSnap = await getDoc(doc(db, "Users", a));
        if (!docSnap.exists()) {
            // Create user document with timestamp for production security
            await setDoc(doc(db, "Users", a), {
                username: a,
                password: b,
                email: Cookies.get('email'),
                highestlevel: 0,
                spgames: 0,
                onlinempgamesplayed: 0,
                createdAt: new Date().toISOString()
            });
            
            // Create game data documents
            const batch = [];
            
            // Create subcollection documents - need to use proper collection/document pattern
            for (let i = 1; i <= 8; i++) {
                batch.push(setDoc(doc(db, "Users", a, "spgamesdata", i.toString()), {
                    level: NaN,
                    score: NaN,
                    time: NaN
                }));
            }
            
            // For single documents, they need to be in a collection
            batch.push(setDoc(doc(db, "Users", a, "onlinempgamedata", "current"), {
                players: NaN,
                level: NaN,
                score: NaN,
                time: NaN
            }));
            
            batch.push(setDoc(doc(db, "Users", a, "onlinempgamedata", "playersinsession"), {
                "1": NaN,
                "2": NaN,
                "3": NaN,
                "4": NaN
            }));
            
            // Execute all operations in parallel for better performance
            await Promise.all(batch);
            console.log("User successfully added to database");
            return true;
        } else {
            console.log("Username already exists");
            return false;
        }
    } catch (error) {
        console.error("Error adding user to database:", error);
        // Check if it's a permission error (common in production)
        if (error.code === 'permission-denied') {
            console.error("Permission denied. Check Firebase security rules.");
        }
        return false;
    }
}
export async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const formJson = Object.fromEntries(formData.entries());
    
    try {
        const docSnap = await getDoc(doc(db, "Users", formJson.username));
        if (!docSnap.exists()) {
            document.getElementById("Cname").style.display = "block";
            return;
        } else {
            document.getElementById("Cname").style.display = "none";
        }
        
        // Compare the entered password with the stored hash
        if (!comparePassword(formJson.password, docSnap.data()["password"])) {
            document.getElementById("Cpass").style.display = "block";
            return;
        } else {
            document.getElementById("Cpass").style.display = "none";
            // Set cookie to expire in 7 days
            Cookies.set('username', formJson.username);
            navigate('/home');
        }
    } catch (error) {
        console.error("Login error:", error);
        document.getElementById("Cpass").style.display = "block";
    }
}