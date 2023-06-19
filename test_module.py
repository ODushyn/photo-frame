import unittest
from unittest.mock import MagicMock
from googleapiclient.errors import HttpError

from app import retry_on_http_error


class MockResponse:
    def __init__(self, status, reason):
        self.status = status
        self.reason = reason


class RetryOnHttpErrorTests(unittest.TestCase):
    def test_successful_request(self):
        # Mock the request function
        request_func = MagicMock()
        request_func.execute.return_value = {'status': 'success'}

        # Call the function under test
        response = retry_on_http_error(request_func)

        # Assertions
        self.assertEqual(response, {'status': 'success'})
        request_func.execute.assert_called_once()

    def test_http_error_503_retry(self):
        # Mock the request function
        request_func = MagicMock()
        request_func.execute.side_effect = [
            HttpError(resp=MockResponse(503, 'Service Unavailable'), content='Service Unavailable'.encode('utf-8')),
            {'status': 'success'}
        ]
        # Call the function under test
        response = retry_on_http_error(request_func)

        # Assertions
        self.assertEqual(response, {'status': 'success'})
        self.assertEqual(request_func.execute.call_count, 2)

    def test_http_error_404_retry(self):
        # Mock the request_func
        request_func = MagicMock()
        request_func.execute.side_effect = [
            HttpError(resp=MockResponse(404,  'Not found'), content='The provided ID does not match any media items.'.encode('utf-8')),
            {'status': 'success'}
        ]

        # Call the function under test
        response = retry_on_http_error(request_func)

        # Assertions
        self.assertEqual(response, {'status': 'success'})
        self.assertEqual(request_func.execute.call_count, 2)

    def test_other_error_retry(self):
        # Mock the request function
        request_func = MagicMock()
        request_func.execute.side_effect = [Exception('Something went wrong'), {'status': 'success'}]

        # Call the function under test
        response = retry_on_http_error(request_func)

        # Assertions
        self.assertEqual(response, {'status': 'success'})
        self.assertEqual(request_func.execute.call_count, 2)


if __name__ == '__main__':
    unittest.main()
