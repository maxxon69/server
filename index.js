require('dotenv').config()
const express = require('express')
const {json} = require("express");
const axios = require("axios");
const crypto = require('crypto')
const cors = require('cors')
const path = require('path');
require('dotenv').config()

const cookieSession = require('cookie-session');
const passport = require('passport');
const User = require('./models/User.module');
const {Error} = require("mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TelegramStrategy = require('passport-telegram').Strategy;
const app = express()
app.use(json())
app.use(cors({
    credentials: true,
    origin: ['https://reader-by-m4xx1k.netlify.app', 'https://reader1337.netlify.app', 'https://reader-frontend.onrender.com', 'https://reader-by-m4xx1k.netlify.app']
}))
app.set("trust proxy", 1);

app.use(
    cookieSession({
        secret: "secretcode",
        resave: true,
        saveUninitialized: true,
        cookie: {
            sameSite: "none",
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 7 // One Week
        }
    }))
// app.use(function(request, response, next) {
//     if (request.session && !request.session.regenerate) {
//         request.session.regenerate = (cb) => {
//             cb()
//         }
//     }
//     if (request.session && !request.session.save) {
//         request.session.save = (cb) => {
//             cb()
//         }
//     }
//     next()
// })

app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser((user, done) => {
    return done(null, user._id);
});

passport.deserializeUser(async (id, done) => {

    const user = await User.findOne({_id: id})
    return done(user)
})
app.use('/getBook', function (req, res, next) {

    let options = {
        root: path.join(__dirname)
    };

    let fileName = 'it.pdf';
    res.sendFile(fileName, options, function (err) {
        if (err) {
            next(err);
        } else {
            console.log('Sent:', fileName);
            next();
        }
    });
});
app.get('/getBook', function (req, res) {
    console.log("File Sent")
    res.send();
});
app.post('/buy', async (req, res) => {
    const fondyPassword = 'test'
    const {email, password} = req.body
    const orderBody = {
        order_id: `${email} ${new Date()}`,
        merchant_id: '1396424',
        order_desc: 'desc',
        amount: '100',
        currency: 'UAH',
        server_callback_url: 'https://reader-backend-hqg2.onrender.com/res'
    }
    const orderedKeys = Object.keys(orderBody).sort((a, b) => {
        if (a < b) return -1
        if (a > b) return 1
        return 0
    })
    const signatureRaw = orderedKeys.map(v => orderBody[v]).join('|')
    const signature = crypto.createHash('sha1')
    signature.update(`${fondyPassword}|${signatureRaw}`)
    const reqData = {request: {...orderBody, signature: signature.digest('hex')}}
    const {data} = await axios.post('https://pay.fondy.eu/api/checkout/url/', reqData)

    res.send(data)
})
app.post('/res', async (req, res) => {

    console.log(req)

})


passport.use(new GoogleStrategy({
        clientID: `792335753245-bavssdfvcth064erd4uch85iughc1q9d.apps.googleusercontent.com`,
        clientSecret: `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`,
        callbackURL: "/auth/google/callback"
    },
    async (_, __, profile, cb)=> {
        console.log('google profile',profile)
        try{
            const user = await User.findOne({googleId: profile.id})
            if(!!user) return cb(null, user);
            else{
                const newUser = await User.create({
                    googleId: profile.id,
                    username: profile.name.givenName,
                    img: profile.photos[0].value
                })
                return cb(null, newUser);
            }

        }catch (e) {
            console.log('err')
            return cb(e, null);
        }
    }));


app.get('/auth/google', passport.authenticate('google', {scope: ['profile']}));

app.get('/auth/google/callback',
    //passport.authenticate('google', {failureRedirect: 'https://reader-frontend.onrender.com', session: true}),
    function (req, res) {
        res.redirect('https://reader-frontend.onrender.com');
    });

// ---------------FacebookStrategy-----------------

passport.use(new FacebookStrategy({
        clientID: `3515674072086995`,
        clientSecret: `26a438a460c2e2ccd9b81697a1d2c5a0`,
        callbackURL: "/auth/facebook/callback"
    },
    async (_, __, profile, cb) => {
        console.log('fb profile',profile)
        try{
            const user = await User.findOne({facebookId: profile.id})
            if(!!user){
                return cb(null, user);
            }else{
                const newUser = await User.create({facebookId: profile.id, username: profile.displayName})
                return cb(null, newUser);
            }
        }catch (e) {
            return cb(e, null);
        }


    }));

app.get('/auth/facebook',
    passport.authenticate('facebook', {
        scope: ['email', 'public_profile']
    }));
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {failureRedirect: 'https://reader-frontend.onrender.com', session: true}),
    function (req, res) {
        console.log(req)
        res.redirect('https://reader-frontend.onrender.com');
    });


// ---------------TelegramStrategy-----------------


// passport.use(new TelegramStrategy({
//         clientID: `test`,
//         clientSecret: `test`,
//         callbackURL: "/auth/telegram/callback"
//     },
//     function (_, __, profile, cb) {
//
//         User.findOne({ telegramId: profile.id }, async (err, doc) => {
//
//             if (err) {
//                 return cb(err, null);
//             }
//
//             if (!doc) {
//                 const newUser = new User({
//                     telegramId: profile.id,
//                     username: profile.name.givenName
//                 });
//
//                 await newUser.save();
//                 cb(null, newUser);
//             }
//             cb(null, doc);
//         })
//
//     }));
//
// app.get('/auth/telegram', passport.authenticate('telegram', { scope: ['profile'] }));
//
// app.get('/auth/telegram/callback',
//     passport.authenticate('telegram', { failureRedirect: '', session: true }),
//     function (req, res) {
//         res.redirect('');
//     });
//

// --------------------------------------------------


app.get("/user/check", (req, res) => {
    console.log('check')
    console.log(req.user)
    res.send(req.user);
})

app.get("/auth/logout", (req, res) => {
    if (req.user) {
        req.logout();
        res.send("done");
    }
})
app.get("/", (req, res) => {
    res.send('hi world')
})
app.listen(process.env.PORT || 5000, () => {
    console.log("Server Started");
})
