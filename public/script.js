

const socket = io();
let username = prompt("Enter your name");
if (!username) username = "Anonymous";
socket.emit("joined", username);

const form = document.getElementById("chat-form");
const input = document.getElementById("msg");
const messages = document.getElementById("messages");
const fileInput = document.getElementById("fileInput");
const fileBtn = document.getElementById("fileBtn");

// Show file picker when attach button clicked
fileBtn.addEventListener("click", () => {
  fileInput.click();
});

// Handle file selection and upload
fileInput.addEventListener("change", () => {
  if (fileInput.files.length === 0) return;

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file);
  formData.append("username", username);

  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        alert("Failed to upload file");
      }
      fileInput.value = ""; // reset file input
    })
    .catch(() => {
      alert("Failed to upload file");
    });
});

// Send text message on form submit
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (msg) {
    socket.emit("message", msg);
    input.value = "";
  }
});

// Handle incoming messages
socket.on("message", (data) => {
  const div = document.createElement("div");

  if (data.user === "System") {
    div.textContent = data.text;
    div.classList.add("system");
  } else if (data.isFile) {
    // Show file message differently
    if (data.mimeType.startsWith("image/")) {
      div.innerHTML = `<b>${data.user}:</b><br><img src="${data.text}" alt="${data.originalName}" style="max-width:200px; border-radius:5px;" />`;
    } else if (data.mimeType.startsWith("video/")) {
      div.innerHTML = `<b>${data.user}:</b><br><video controls style="max-width:200px; border-radius:5px;">
        <source src="${data.text}" type="${data.mimeType}" />
        Your browser does not support the video tag.
      </video>`;
    } else {
      div.innerHTML = `<b>${data.user}:</b> <a href="${data.text}" target="_blank" download>${data.originalName}</a>`;
    }
    div.classList.add(data.user === username ? "own" : "other");
  } else {
    div.textContent = `${data.user}: ${data.text}`;
    div.classList.add(data.user === username ? "own" : "other");
  }

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

// ===== Emoji picker feature (added without changing your code) =====

const emojiBtn = document.getElementById("emoji-btn");
const emojiContainer = document.getElementById("emoji-container");
const emojiPicker = document.getElementById("emoji-picker");
const emojiClose = document.getElementById("emoji-close");

// Toggle emoji picker visibility
emojiBtn.addEventListener("click", () => {
  if (emojiContainer.style.display === "none" || emojiContainer.style.display === "") {
    emojiContainer.style.display = "block";
  } else {
    emojiContainer.style.display = "none";
  }
});

// Close emoji picker on close button click
emojiClose.addEventListener("click", () => {
  emojiContainer.style.display = "none";
});

// When emoji selected, insert it into input at cursor position
emojiPicker.addEventListener("emoji-click", event => {
  const emoji = event.detail.unicode;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;

  // Insert emoji at cursor position
  input.value = text.slice(0, start) + emoji + text.slice(end);
  
  // Move cursor after inserted emoji
  input.selectionStart = input.selectionEnd = start + emoji.length;
  
  input.focus();
});
