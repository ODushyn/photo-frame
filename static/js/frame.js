
function showPreview(mediaItems) {
    const fullUrl = "https://lh3.googleusercontent.com/pkrOkrBgML52L1B97tRRDMCt0wKeuqNDen9tFNUir9921QlnzkBvIEDx3q-bFMMUgsqKxkN-69GxciSOHwzpYslpZTUAU5mgGivulFcunYAEQCH_Zz3gIuTGy2SxZS_nDeYWcQEwT6o8SLqe_5-qmWdWPdye1MwruGVwNH0nga6mtlbFrzNUamCA2UIb1oQIZdawjm85VZag5xREzFdCWTcr8ImI4UQqg5uX3rM53jfM5NGwfrfjKkSxKoMXWbMD60cnbdIiOURJJlNmtyLlgIJqA8xVeYeZ21GTiq3-Iqri2gfsQQBm-K_PRiiZcj-NNHkAcvRnGIql5lMN2YnCBbFDa3DlodbeyRBW5dGQZV_0tEWUhqzPJtvQSIQq6-qZqwQeGwxTD67goedUeMdXVGP1kmAGnS9QruncpCKh8xZd6LfXvc-tQTM5OVHJzt9p1IrjluNkUAALdwZoCt5M8LPOLLJDzduYYL3Q5dqKgU9fALBEe0up6e5XpoEZl6J4XdSOp4_b_WzLo0sl22fD1S12H35BjiYvnl-FNccEJ2fc69ctLPvMKVANtY_xAPbcRLVHiq4bh8TmKUtnMsN-CbuKUP7iUcoxZmhR97KB61XNt7gmVDs6hqB0BgfHvqCia0pLXZ65B0d3eP-2jT6aEwaWmccMPArUrhZiVDmLMZ7kxVlPdHdzPPvbrymIWyQ0y0LX1UzYY9HCaMCOrG4h7GF-TNmmw8wWk3d1ptn2d_ehFO7_rMq0GOBtjmVqagk=w747-h1328-no?authuser=0";
    const linkToFullImage = $('<img />')
        .attr('src', fullUrl)
    console.log(linkToFullImage);
    $('#images-container').append(linkToFullImage);
}


$(function () {
    showPreview()
});