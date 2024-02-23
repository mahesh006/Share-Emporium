function createUser() {
  const userName = document.getElementById("userName").value;
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  fetch("/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userName, name, email }),
  })
    .then((response) => response.json())
    .then((data) => alert(JSON.stringify(data)))
    .catch((error) => console.error("Error:", error));
}

function getUser() {
  const userName = document.getElementById("userName").value;
  fetch(`/user/${userName}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("name").value = data.name || "";
      document.getElementById("email").value = data.email || "";
    })
    .catch((error) => console.error("Error:", error));
}

function updateUser() {
  const userName = document.getElementById("userName").value;
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  fetch(`/user/${userName}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email }),
  })
    .then((response) => response.json())
    .then((data) => alert(JSON.stringify(data)))
    .catch((error) => console.error("Error:", error));
}

function deleteUser() {
  const userName = document.getElementById("userName").value;
  fetch(`/user/${userName}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => alert(JSON.stringify(data)))
    .catch((error) => console.error("Error:", error));
}
