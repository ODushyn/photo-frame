PhotoFrame loads all albums from `photo.google` hosting and displays random photo in the browser each N(see photo_transition_time) seconds.
To skip photos from an album add its title to `ignored_albums` array.

Tested on Raspberry Pi 3 Model B+.

Installation steps:

1. pip install -r requirements.txt
2. sudo apt update & sudo apt install chromium-broweser & sudo apt install chromium-chromedriver

Start photoframe: `python app.py`
 
Run tests: `python3 -m unittest test_module.py`

