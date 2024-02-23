function signUp() {
  const userName = document.getElementById("userName").value;
  const name = document.getElementById("signUpName").value;
  const email = document.getElementById("signUpEmail").value;
  const password = document.getElementById("signUpPassword").value;
  fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, name, email, password }),
  })
    .then((response) => response.json())
    .then((data) => alert(JSON.stringify(data)))
    .catch((error) => console.error("Error:", error));
}

function signIn() {
  const userName = document.getElementById("userNameSignIn").value;
  const password = document.getElementById("signInPassword").value;
  fetch("/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.token) {
        localStorage.setItem("userToken", data.token); // Store the token
        //window.location.href = "/crud.html"; // Navigate to the CRUD interface
        // After successful sign-in
        window.location.href = "/home.html"; // Redirect to Add Products page
      } else {
        alert("Sign in failed");
      }
    })
    .catch((error) => console.error("Error:", error));
}
