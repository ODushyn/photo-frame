import datetime
import json
import os
import random
import schedule
import google_auth_oauthlib.flow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from selenium import webdriver
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import time

photo_transition_time = 60
photo_ids_cache = []
data_file_name = 'albums.json'
ignored_albums = ["Israel 08.2014", "Nastya HB 2014"]


def print_with_timestamp(*args, **kwargs):
    timestamp = datetime.datetime.now().strftime('%d-%m-%Y %H:%M:%S')
    print(f"[{timestamp}]", *args, **kwargs)


def create_credentials():
    # Google Photos API credentials
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json')
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
                'client_secret.json',
                scopes=['https://www.googleapis.com/auth/photoslibrary.readonly'],
                redirect_uri='http://localhost:8080'
            )
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return creds


def get_random_photo_url_from_cache():
    print_with_timestamp("Getting new photo from cache...")
    photo_id = random.choice(photo_ids_cache)
    from googleapiclient.discovery import build
    creds = create_credentials()
    service = build('photoslibrary', 'v1', credentials=creds, static_discovery=False)
    response = retry_on_http_error(service.mediaItems().get(mediaItemId=photo_id))
    photo_url = response.get('baseUrl') + '=w2048-h1024'
    print_with_timestamp("Photo loaded (url={0})".format(response['productUrl']))
    return photo_url


def retry_on_http_error(request_func):
    while True:
        try:
            response = request_func.execute()
            return response
        except HttpError as error:
            if error.resp.status == 503:
                print_with_timestamp("Service is currently unavailable. Retrying in 30 seconds...")
                time.sleep(30)
            elif error.resp.status == 404:
                print_with_timestamp(
                    "Media item not found. Was it deleted? Check that this error disappear after next refresh")
            else:
                raise error
        except Exception as e:
            print_with_timestamp(f"Error occurred: {str(e)}. Retrying in 30 seconds...")
            time.sleep(30)


def populate_cache():
    print_with_timestamp("Populating in-memory cache with photos from data file...")
    with open(data_file_name, 'r') as file:
        data = json.load(file)
    all_photo_ids = []
    albums = data['albums']
    for album in albums:
        album_photo_ids = album['photos']
        all_photo_ids.extend(album_photo_ids)
        global photo_ids_cache
        photo_ids_cache = all_photo_ids
    print_with_timestamp("Cache is populated with {0} photos".format(len(photo_ids_cache)))


def create_data_file():
    print_with_timestamp("Creating new data file. Loading all photos from photos.google.com")
    service = build('photoslibrary', 'v1', credentials=create_credentials(), static_discovery=False)
    albums_with_items = fetch_all_albums_with_photos(service)

    save_albums_to_json(albums_with_items)


def data_file_exists():
    if os.path.exists(data_file_name):
        print_with_timestamp("Data file found")
        return True
    print_with_timestamp("Data file not found")
    return False


def refresh_data_file():
    print_with_timestamp("Starting data refresh...")
    with open(data_file_name, 'r') as file:
        data = json.load(file)

    service = build('photoslibrary', 'v1', credentials=create_credentials(), static_discovery=False)
    fetched_albums = fetch_all_albums(service)

    total_albums = len(fetched_albums)  # Total number of albums
    processed_albums = 0  # Counter for processed albums

    # Update existing albums and add new albums
    for fetched_album in fetched_albums:
        fetched_album_id = fetched_album['id']
        fetched_album_title = fetched_album['title']
        fetched_album_size = fetched_album.get('mediaItemsCount', 0)

        processed_albums += 1
        print_with_timestamp("Processing album {0}/{1}...".format(processed_albums, total_albums))
        if fetched_album_title in ignored_albums:
            processed_albums += 1
            print_with_timestamp("Skipping ignored album {0}".format(fetched_album_title))
            continue

        existing_album = next((album for album in data['albums'] if album['id'] == fetched_album_id), None)

        if existing_album:
            if existing_album['size'] != fetched_album_size:
                print_with_timestamp(
                    "Album {0} size was changed from {1} to {2}".format(fetched_album_title, existing_album['size'],
                                                                        fetched_album_size))
                existing_album['size'] = fetched_album_size
                album_photos = fetch_album_photos(service, fetched_album_id, fetched_album_title)
                existing_album['photos'] = [item['id'] for item in album_photos]
        else:
            album_photos = fetch_album_photos(service, fetched_album_id, fetched_album_title)
            new_album = {
                'id': fetched_album_id,
                'title': fetched_album['title'],
                'url': fetched_album['productUrl'],
                'size': fetched_album_size,
                'photos': [item['id'] for item in album_photos]
            }
            data['albums'].append(new_album)
            print_with_timestamp(
                "Album {0} was added. url: {1}".format(fetched_album_title, fetched_album['productUrl']))

    # Remove albums that no longer exist
    removed_album_titles = []
    data['albums'] = [album for album in data['albums'] if
                      album_exists(album, fetched_albums) or removed_album_titles.append(album['title'])]

    # Print the titles of the removed albums
    for title in removed_album_titles:
        print_with_timestamp("Album {0} was removed".format(title))

    # see if this duplication can be avoided
    with open(data_file_name, 'w') as file:
        json.dump(data, file, indent=2)
        print_with_timestamp("Data refresh is finished")
    print_next_data_file_refresh_time()


# Helper function to check if an album exists in the fetched albums list
def album_exists(album, fetched_albums):
    return any(fetched_album['id'] == album['id'] for fetched_album in fetched_albums)


def get_browser_driver():
    # Initialize Selenium WebDriver
    firefox_options = webdriver.FirefoxOptions()
    firefox_driver = webdriver.Firefox(options=firefox_options)
    firefox_driver.fullscreen_window()
    return firefox_driver


def schedule_data_file_refresh():
    schedule.every(6).hours.do(refresh_data_file)
    print_next_data_file_refresh_time()


def print_next_data_file_refresh_time():
    if len(schedule.jobs) > 0:
        now = datetime.datetime.now()
        next_run_time = now + datetime.timedelta(hours=schedule.jobs[0].interval)
        print_with_timestamp("Next data file refresh: {0}".format(next_run_time.strftime("%Y-%m-%d %H:%M:%S")))


def fetch_all_albums(service):
    print_with_timestamp("Start loading albums metadata...")
    albums = []

    page_token = None
    while True:
        response = retry_on_http_error(service.albums().list(
            pageSize=50,
            pageToken=page_token
        ))

        albums.extend(response.get('albums', []))
        page_token = response.get('nextPageToken')
        if not page_token:
            break

    print_with_timestamp("{0} albums are loaded".format(len(albums)))
    return albums


def fetch_all_albums_with_photos(service):
    albums_with_photos = []
    total_photos = 0
    albums = fetch_all_albums(service)

    for album in albums:
        album_id = album['id']
        album_product_url = album['productUrl']
        album_title = album['title']
        album_photos = fetch_album_photos(service, album_id, album_title)
        albums_with_photos.append(
            {'id': album_id, 'title': album_title, 'url': album_product_url, 'photos': album_photos})
        total_photos += len(album_photos)
    print_with_timestamp("Photos loading is finished. {0} photos are loaded.".format(total_photos))
    return albums_with_photos


def fetch_album_photos(service, album_id, album_title):
    print_with_timestamp("Starting loading photos for album {0}".format(album_title))
    photos = []
    page_token = None

    while True:
        response = retry_on_http_error(service.mediaItems().search(
            body={
                'pageSize': 100,
                'albumId': album_id,
                'pageToken': page_token
            }
        ))

        photos.extend(response.get('mediaItems', []))
        page_token = response.get('nextPageToken')

        if not page_token:
            break

    # Apply filters to exclude videos and other types of media
    filtered_photos = [photo for photo in photos if photo.get('mimeType', '').startswith('image/')]

    print_with_timestamp(
        "Photos loading is finished. {0} photos are loaded for album {1}".format(len(filtered_photos), album_title))
    return filtered_photos


def save_albums_to_json(albums_with_items):
    data = {
        "date": datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "albums": []
    }

    for album in albums_with_items:
        album_data = {
            "id": album['id'],
            "title": album['title'],
            "url": album['url'],
            "size": len(album['photos']),
            "photos": [item['id'] for item in album['photos']]
        }
        data["albums"].append(album_data)

    with open(data_file_name, 'w') as file:
        json.dump(data, file, indent=2)
    print_with_timestamp("File {0} is created.".format(data_file_name))


def main():
    if data_file_exists():
        refresh_data_file()
    else:
        create_data_file()

    populate_cache()
    schedule_data_file_refresh()
    firefox_driver = get_browser_driver()

    try:
        while True:
            schedule.run_pending()
            photo_url = get_random_photo_url_from_cache()
            if photo_url:
                firefox_driver.get(photo_url)
            time.sleep(photo_transition_time)
    except KeyboardInterrupt:
        firefox_driver.quit()


if __name__ == '__main__':
    main()
