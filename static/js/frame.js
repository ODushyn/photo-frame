
function showPreview(mediaItems) {
    $.ajax({
        type: 'GET',
        url: '/getQueue',
        dataType: 'json',
        success: (data) => {
            const item = data.mediaItems[Math.floor(Math.random() * 10)];
            const fullUrl = `${item.baseUrl}=w${item.mediaMetadata.width}-h${
                item.mediaMetadata.height}`;
            const linkToFullImage = $('<img />')
                .attr('src', fullUrl)
                .addClass('center-fit')  
            $('#images-container') .find("img").remove()
            $('#images-container').append(linkToFullImage);

        },
        error: (data) => {
            console.log('Could not load queue', data)
        }
    });
}


$(function () {
    showPreview()
    setInterval(() => showPreview(), 5000)
});