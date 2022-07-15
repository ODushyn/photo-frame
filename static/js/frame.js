
function showPreview() {
    $.ajax({
        type: 'GET',
        url: '/getQueue',
        dataType: 'json',
        success: (mediaItems) => {
            const item = mediaItems[Math.floor(Math.random() * 10)];
            const fullUrl = `${item.baseUrl}=w${item.mediaMetadata.width}-h${
                item.mediaMetadata.height}`;
            const linkToFullImage = $('<img />')
                .attr('src', fullUrl)
                .addClass('center-fit')  
            $('#images-container') .find("img").remove()
            $('#images-container').append(linkToFullImage);

        },
        error: (mediaItems) => {
            console.log('Could not load queue', mediaItems)
        }
    });
}


$(function () {
    showPreview()
    setInterval(() => showPreview(), 5000)
});