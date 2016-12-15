"use strict";

const canvas = document.getElementById("eroc-canvas");
const ctx = canvas.getContext("2d");

const selections = {
  image: "genericsnowflakecardFB.png",
  holiday: "",
  gift: ""
};

document.querySelectorAll("#eroc-canvas-controls select").forEach(select => {
  select.addEventListener("change", ev => {
    selections[ev.target.id] = ev.target.value;
    if (ev.target.id === "image") {
      loadBackground(selections.image);
    } else {
      render();
    }
  })
})

function loadBackground(src) {
  selections.img = new Image();
  selections.img.src = "img/" + src;
  selections.img.onload = render;
}
loadBackground(document.getElementById("image").value);

function render() {
  const locs = {
    holiday: {
      x: 765,
      y: 135,
      maxWidth: 375
    },
    gift: {
      x: 560,
      y: 275,
      maxWidth: 585
    }
  }
  ctx.drawImage(selections.img, 0, 0);

  ctx.font = "36px Marydale";
  ctx.fillText(selections.holiday, getCenteredX(selections.holiday, locs.holiday.x, locs.holiday.maxWidth), locs.holiday.y);
  ctx.fillText(selections.gift, getCenteredX(selections.gift, locs.gift.x, locs.gift.maxWidth), locs.gift.y);
}

function getCenteredX(txt, left, width) {
  return left + ((width - ctx.measureText(txt).width) / 2);
}

document.getElementById("btn-download").addEventListener("click", ev => {
  const dataURI = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataURI;
  a.download = "eroc_holiday_image.png"
  a.click();
})

document.getElementById("btn-share").addEventListener("click", ev => {
  const modal = document.getElementById("uploading-modal-outer");
  modal.classList = ["active"];
  upload((err, url) => {
    if (err) {
      console.log(err);
      modal.classList = [];
      alert("Sorry, something went wrong when we tried to upload your image! Please try again.");
    } else {
      share(url);
    }
  })
})

function upload(callback) {
  const dataURI = canvas.toDataURL("image/png");
  const blob = dataURItoBlob(dataURI);
  
  const fd = new FormData();
  fd.append("image", blob);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://api.imgur.com/3/image");
  xhr.setRequestHeader("Authorization", "Client-ID dbdf169c000df54");
  xhr.send(fd);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        const link = JSON.parse(xhr.responseText).data.link;
        callback(null, link);
      } else {
        callback(xhr.statusText + " : " + xhr.responseText);
      }
    }
  }
}

function share(imgUrl) {
  var shareUrl = "https://www.facebook.com/dialog/feed";
  shareUrl += "?app_id=385908625081752&display=page";
  shareUrl += "&name=Test";
  shareUrl += "&picture=" + imgUrl;
  shareUrl += "&description=" + encodeURIComponent("Need to decide what goes here");
  shareUrl += "&link=http://www.endrapeoncampus.org/holiday";
  window.location.href = shareUrl;
}

function dataURItoBlob(dataURI) {
  var byteString = atob(dataURI.split(',')[1]);
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], {type: 'image/png'});
}

