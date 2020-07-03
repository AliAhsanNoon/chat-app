const socket = io();

const $msgForm = document.querySelector("#message-form");
const $msgFormInput = document.querySelector("input");
const $msgFormBtn = $msgForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");

const $messages = document.querySelector("#messages");
const messageTemplate = document.querySelector("#message-template").innerHTML;

const $userLocation = document.querySelector("#user-location");
const locationTemplate = document.querySelector("#location-message-template")
  .innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

socket.on("message", ({ username, message, createdAt }) => {
  createdAt = moment(createdAt).format("h:mm a");
  const html = Mustache.render(messageTemplate, {
    username,
    message,
    createdAt,
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("messageLocation", ({ username, url, createdAt }) => {
  //socket.on("messageLocation", (message) => {
  createdAt = moment(createdAt).format("h:mm a");
  const html = Mustache.render(locationTemplate, {
    username,
    url,
    createdAt,
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

$msgForm.addEventListener("submit", (e) => {
  $msgFormBtn.setAttribute("disabled", "disabled");
  e.preventDefault();

  const message = $msgFormInput.value;

  socket.emit("sendMessage", message, (err) => {
    console.log("data:: ", message);
    $msgFormBtn.removeAttribute("disabled");
    $msgFormInput.value = "";
    $msgFormInput.focus();
    if (err) {
      return console.log(err);
    }
    console.log("The message was delivered");
  });
});
// socket.on("roomData", ({ room, users }) => {
//   console.log("rm :: ", room);
//   console.log("users :", users);
// });
$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation)
    return alert("Geolocation is not supported by your browser");

  $sendLocationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute("disabled");
        console.log("location shared");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  alert(error);
  location.href = "/";
});
