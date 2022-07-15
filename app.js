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
  req.logout(function (err) {
    if (err) { return next(err); }
    req.session.destroy();
    res.redirect('/');
  });
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
  const authToken = req.user.token;

  // get all albums
  const albums = await libraryApiAlbums(authToken);
  // get random albums
  const randomAlbums = albums.sort(() => .5 - Math.random()).slice(0, config.randomAlbumsSize);
  // get photos from random items
  const mediaItems = [];
  for (let i = 0; i < randomAlbums.length; i++) {
    mediaItems.push(...(await libraryApiSearch(authToken, randomAlbums[i].id)).mediaItems)
  }

  return res.status(200).send(mediaItems);
})

async function libraryApiSearch(authToken, albumId) {
  const parameters = {
    albumId: albumId,
    pageSize: config.searchPageSize
  }

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

async function libraryApiAlbums(authToken) {
  let albums = [];
  let error = null;
  let parameters = new URLSearchParams();
  parameters.append('pageSize', config.albumPageSize);

  try {
    // Loop while there is a nextpageToken property in the response until all
    // albums have been listed.
    do {
      // Make a POST request to search the library or album
      const searchResponse =
        await fetch(config.apiEndpoint + '/v1/albums?' + parameters, {
          method: 'get',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          }
        });

      const result = await checkStatus(searchResponse);
      if (result && result.albums) {
        // Parse albums and add them to the list, skipping empty entries.
        const items = result.albums.filter(x => !!x);

        albums = albums.concat(items);
      }
      if (result.nextPageToken) {
        parameters.set('pageToken', result.nextPageToken);
      } else {
        parameters.delete('pageToken');
      }

      // Loop until all albums have been listed and no new nextPageToken is
      // returned.
    } while (parameters.has('pageToken'));
  } catch (err) {
    // Log the error and prepare to return it.
    error = err;
    console.log(error);
  }

  return albums;
}

async function checkStatus(response) {
  if (!response.ok) {
    let message = "";
    try {
      message = await response.json();
    } catch (err) { }
    throw new StatusError(response.status, response.statusText, message);
  }

  // If the HTTP status is OK, return the body as JSON.
  return await response.json();
}

// Start the server
server.listen(config.port, () => {
  console.log(`App listening on port ${config.port}`);
  console.log('Press Ctrl+C to quit.');
});