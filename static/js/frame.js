
function showPreview(mediaItems) {
    $.ajax({
        type: 'GET',
        url: '/getQueue',
        dataType: 'json',
        success: (data) => {

            console.log("Success from html");
            console.log(data.mediaItems);
            const item = data.mediaItems[0];
            const fullUrl = `${item.baseUrl}=w${item.mediaMetadata.width}-h${
                item.mediaMetadata.height}`;
            const linkToFullImage = $('<img />')
                .attr('src', fullUrl)
                .addClass('center-fit')
            $('#images-container').append(linkToFullImage);

        },
        error: (data) => {
            console.log('Could not load queue', data)
        }
    });
}


$(function () {
    showPreview()
});