const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
var jwt = require('jsonwebtoken');
let nodemailer = require('nodemailer');
const fetchuser = require('../middleware/fetchuser');
require('dotenv').config() // In nodejs it is required to access env variables.
const { body, validationResult } = require('express-validator');
let OtpGenerator = require('../OptGenerator');
let VerificationToken = require('../models/verificationToken');
var secretToken = process.env.JWT_TOKEN;
let emailPass = process.env.MAIL_PASS;
let EMAIL = "gagangarg00001@gmail.com"

// Route-1 Endpoint to Create a User: POST /api/auth/createuser -- No login required

// Validations on request body.
router.post('/createuser', [body('name').isLength({ min: 3 }).withMessage('Name must contain atleat 3 letters'),
body('email', 'Enter valid email').isEmail(),
body('password', 'password must contain atleast 5 characters.').isLength({ min: 5 })
], async (req, res) => {
    // Check if Validations just above are satisfied.
    const result = validationResult(req);
    if (result.isEmpty()) {
        try {
            // Find a user with requested email if already exist return status.
            let user = await User.findOne({ email: req.body.email })
            if (user) {
                if (user.verified) {
                    return res.status(400).json({ msg: "User with this email already exists", success: false })
                }
                else {
                    await User.findByIdAndDelete(user._id);
                    await VerificationToken.deleteMany({ user: user._id });
                }
            }
            let Otp = OtpGenerator();
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: EMAIL,
                    pass: emailPass
                }
            });

            transporter.verify(function (error, success) {
                if (error) {
                    return res.status(500).json({ error: 'Error verifying recipient email', success: false });
                } else {
                    var mailOptions = {
                        from: EMAIL,
                        to: req.body.email,
                        subject: 'resuShare - OPT to register',
                        text: `Hii there, ${Otp} is your OTP for registration.\n
                      Copy and paste in web app and thank you for using resuShare.\n
                      with regards\n
                      resuShare team`
                    };

                    // Send the email
                    transporter.sendMail(mailOptions, async function (error, info) {
                        if (error) {
                            return res.status(500).json({ error });
                        } else {
                            let salt = await bcrypt.genSalt(10);
                            let secPass = await bcrypt.hash(req.body.password, salt);
                            let secOtp = await bcrypt.hash(Otp, salt);
                            // Create a new User.
                            user = await User.create({
                                name: req.body.name,
                                password: secPass,
                                email: req.body.email
                            })
                            // Create verificationToken
                            await VerificationToken.create({
                                user: user,
                                token: secOtp
                            })
                            const data = { id: user.id }
                            var authToken = jwt.sign(data, secretToken);
                            return res.json({ success: true, authToken, info });     
                        }
                    });
                }

            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ err: "It's fault on our server's side", success: false })
        }
    }
    else res.send({ errors: result.array(), body: req.body });
})


// Route-2 Endpoint to Login existing User: POST /api/auth/login -- No login required

router.post('/login', [body('email').isEmail().withMessage('Enter a valid email'),
body('password').exists()], async (req, res) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ msg: "Login using correct credentials" });
            }
            const matchPassword = await bcrypt.compare(password, user.password);
            if (!matchPassword) {
                return res.status(400).json({ msg: "Login using correct credentials" });
            }
            const data = {
                id: user.id,
            }
            const authToken = jwt.sign(data, secretToken);

            return res.status(200).json({ success: true, authToken: authToken });

        } catch (error) {
            return res.status(500).json({ err: "It's fault on our server's side", error: error })
        }
    }
    else res.send({ errors: result.array() });
})

// Route-3 Get logged in user details: POST /api/auth/getuser -- Login Required

router.post('/getuser', fetchuser, async (req, res) => {

    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        return res.json({ user, success: true });
    } catch (error) {
        return res.status(500).json({ err: "It's fault on our server's side" })
    }
})


// Route-4 Verify Otp while registering user: POST /api/auth/verify-otp -- No login required

router.post('/verify-otp', fetchuser, async (req, res) => {
    try {
        let userId = req.user.id;
        let otp = req.body.otp;
        // Check in verificationToken if otp is valid
        let validOtp = await VerificationToken.find({ user: userId })
        if (!validOtp) { return res.status(400).json({ success: false, message: "Please try again!" }) }
        let isValid = await bcrypt.compare(otp, validOtp[0].token)
        if (!isValid) { return res.status(400).json({ success: false, message: "Invalid otp" }) }
        await User.findByIdAndUpdate(userId, { verified: true });
        return res.status(200).json({ success: true, message: "otp verified successfully" });
    }
    catch (error) {
        return res.status(500).json({ err: "It's fault on our server's side", message: error })
    }
})


module.exports = router