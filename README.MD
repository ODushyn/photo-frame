- Start up:
    Prerequisites: 
    - install Node.js
    - create `env.sh` file and export following environment variables: 
        - G_PHOTOS_AUTH_CLIENT_ID
        - G_PHOTOS_AUTH_CLIENT_SECRET
        - G_PHOTOS_AUTH_CALLBACK_URL
    ---

- Start server by running
    `./start.sh`

    Note:
    ```
    `start.sh` is main bash script that start the server.
    Give `start.sh` executable permisisons if needed: `sudo chmod 744 start.sh`
    ```


Tech side:

- Main API /getQueue is the main call that fetches all albums, pick several random photos from each album. Those photose are displayed with a fixed delay.

