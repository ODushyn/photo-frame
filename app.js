// firefox --kiosk  --private-window https://www.stackoverflow.com
// https://github.com/googlesamples/google-photos

import bodyParser from 'body-parser';
import express from 'express';
import fetch from 'node-fetch';
import http from 'http';
import passport from 'passport';
import session from 'express-session';
import sessionFileStore from 'session-file-store';

import { auth } from './auth.js';
import { config } from './config.js';
import { fileURLToPath } from 'url';

const app = express();
const fileStore = sessionFileStore(session);
const server = http.Server(app);

auth(passport);

const sessionMiddleware = session({
  resave: true,
  saveUninitialized: true,
  store: new fileStore({}),
  secret: 'photo frame sample',
});

app.set('view engine', 'ejs');

app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('static'));
app.use('/js',
  express.static(
    fileURLToPath(
      new URL('./node_modules/jquery/dist/', import.meta.url)
    ),
  )
);

app.get('/', (req, res) => {
  if (!req.user || !req.isAuthenticated()) {
    // Not logged in yet.
    res.render('pages/login');
  } else {
    res.render('pages/frame');
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

app.get('/auth/google', passport.authenticate('google', {
  scope: config.scopes,
  failureFlash: true,
  session: true,
}));

app.get(
  '/auth/google/callback',
  passport.authenticate(
    'google', { failureRedirect: '/', failureFlash: true, session: true }),
  (req, res) => {
    // User has logged in.
    console.log('User has logged in.');
    req.session.save(() => {
      res.redirect('/');
    });
  });

app.get('/getQueue', async (req, res) => {
  const userId = req.user.profile.id;
  const authToken = req.user.token;
  console.log(userId);
  console.log(authToken);
  const data = await libraryApiSearch(authToken);

  return res.status(200).send(data);
})

async function libraryApiSearch(authToken) {
  let photos = [];
  let nextPageToken = null;
  let error = null;
  const parameters = {
    pageSize: config.searchPageSize
  }

  console.log(
    `Submitting search with parameters: ${JSON.stringify(parameters)}`);

  // Make a POST request to search the library or album
  const searchResponse =
    await fetch(config.apiEndpoint + '/v1/mediaItems:search', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken
      },
      body: JSON.stringify(parameters)
    });

  const result = await searchResponse.json();

  return result;
}

// Start the server
server.listen(config.port, () => {
  console.log(`App listening on port ${config.port}`);
  console.log('Press Ctrl+C to quit.');
});