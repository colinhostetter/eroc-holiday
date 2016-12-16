"use strict";

const htmlxhr = new XMLHttpRequest();
htmlxhr.open("GET", "//s3.amazonaws.com/eroc-holiday/ui.html?" + Date.now());
htmlxhr.send();
htmlxhr.onreadystatechange = bootstrap;
const cssxhr = new XMLHttpRequest();
cssxhr.open("GET", "//s3.amazonaws.com/eroc-holiday/style.css?" + Date.now());
cssxhr.send();
cssxhr.onreadystatechange = bootstrap;

function bootstrap() {
  if (htmlxhr.readyState === XMLHttpRequest.DONE && cssxhr.readyState === XMLHttpRequest.DONE) {
    const target = document.getElementById("eroc-holiday-app-target");
    const style = document.createElement("style");
    style.innerText = cssxhr.responseText;
    document.body.insertBefore(style, target);
    const container = document.createElement("div");
    container.innerHTML = htmlxhr.responseText;
    document.body.insertBefore(container, target);

    const canvas = document.getElementById("eroc-canvas");
    const ctx = canvas.getContext("2d");

    const selects = document.querySelectorAll("#eroc-canvas-controls select")
    for (let select of selects) {
      select.addEventListener("change", ev => {
        selections[ev.target.id] = ev.target.value;
        if (ev.target.id === "holiday" && ev.target.value !== "Other") {
          selections.holidayOther = false;
          document.getElementById("other-container").style.display = "none";
        } else if (ev.target.id === "holiday" && ev.target.value === "Other") {
          selections.holidayOther = true;
          selections.holiday = "";
          document.getElementById("other").value = "";
          document.getElementById("other-container").style.display = "block";
        }
        if (ev.target.id === "image") {
          loadBackground(selections.image, ctx);
        } else {
          render(ctx);
        }
      })
    }

    const otherCallback = ev => {
      if (selections.holidayOther) selections.holiday = ev.target.value;
      render(ctx);
    }
    const other = document.getElementById("other");
    ["keyup", "keydown", "change", "paste"].forEach(evType => {
      other.addEventListener(evType, otherCallback);
    });

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
      upload(canvas, (err, url) => {
        if (err) {
          console.log(err);
          modal.classList = [];
          alert("Sorry, something went wrong when we tried to upload your image! Please try again.");
        } else {
          share(url);
        }
      })
    })

    loadBackground(document.getElementById("image").value, ctx);
  }
}

const selections = {
  image: "genericsnowflakecardFB.png",
  holiday: "",
  holidayOther: false,
  gift: ""
};

function loadBackground(src, ctx) {
  selections.img = new Image();
  selections.img.src = "//s3.amazonaws.com/eroc-holiday/img/" + src;
  selections.img.onload = () => {
    // make sure this image is still selected
    if (selections.image === src) render(ctx);
  }
}

function render(ctx) {
  const locs = {
    holiday: {
      x: 765,
      y: 135,
      maxWidth: 375
    },
    gift: {
      x: 560,
      y: 270,
      maxWidth: 585
    }
  }
  ctx.drawImage(selections.img, 0, 0);

  ctx.font = "36px Marydale";
  ctx.fillText(selections.holiday, getCenteredX(ctx, selections.holiday, locs.holiday.x, locs.holiday.maxWidth), locs.holiday.y);
  ctx.fillText(selections.gift, getCenteredX(ctx, selections.gift, locs.gift.x, locs.gift.maxWidth), locs.gift.y);
}

function getCenteredX(ctx, txt, left, width) {
  return left + ((width - ctx.measureText(txt).width) / 2);
}

function upload(canvas, callback) {
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
  shareUrl += "&name=" + encodeURIComponent("Donate to End Rape on Campus this holiday season!");
  shareUrl += "&picture=" + imgUrl;
  shareUrl += "&description=" + encodeURIComponent("End Rape on Campus needs our support now more than ever. Please consider making a gift this holiday season to ensure ALL students can receive an education free from sexual violence. You can make your own custom card at endrapeoncampus.org/holiday");
  shareUrl += "&link=" + encodeURIComponent("http://endrapeoncampus.org/holiday");
  shareUrl += "&redirect_uri=" + encodeURIComponent("http://endrapeoncampus.org/holiday");
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

