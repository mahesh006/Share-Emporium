document.addEventListener("DOMContentLoaded", () => {
  const userToken = localStorage.getItem("userToken");
  if (userToken) {
    const userName = decodeJWT(userToken); // Assuming this function correctly extracts the userName
    fetchUserUniqueProducts(userName, userToken); // Pass the userName and token for the request
    document.getElementById("userInfoContainer").innerHTML = `
    <span><a href="/home.html">Home</a></span>
    <span><a href="/addProduct.html">Add Products</a></span>
          <span>Welcome, ${userName}</span>
          <a href="#" onclick="logout()">Logout</a>
      `;
  } else {
    console.error("No userToken found in localStorage");
  }
});

function fetchUserUniqueProducts(userName, token) {
  fetch(`/profile/${encodeURIComponent(userName)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Include the authorization header
    },
  })
    .then((response) => response.json())
    .then((products) => displayUserUniqueProducts(products))
    .catch((error) =>
      console.error("Error fetching user-specific products:", error)
    );
}

function displayUserUniqueProducts(products) {
  const container = document.getElementById("userProductsContainer");
  container.innerHTML = ""; // Clear previous content

  products.forEach((product) => {
    // Assuming each product has an imagePath property
    // Adjust the src attribute's value according to how you store the image URL/path
    const imageHtml = product.imagePath
      ? `<img src="${product.imagePath}" alt="${product.name}" style="width: 100px; height: auto;">`
      : "No image available";

    const productElement = document.createElement("div");
    productElement.className = "product"; // For CSS styling
    productElement.innerHTML = `
    ${imageHtml}
    <h2>${product.name}</h2>
    <p>${product.country}</p>
    <p>Category: ${product.category}</p> 
    <p>Item Type: ${product.itemType}</p>   
    <span class="delete-icon" onclick="deleteProduct('${product.id}')"><i class="fas fa-trash-alt"></i></span>`;
    container.appendChild(productElement);
  });
}

function deleteProduct(productId) {
  const token = localStorage.getItem("userToken");
  fetch(`/delete-product/${productId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        console.log("Product deleted successfully");
        // Refresh the products display
        const userName = decodeJWT(token);
        fetchUserUniqueProducts(userName, token);
      } else {
        throw new Error("Failed to delete product");
      }
    })
    .catch((error) => console.error("Error deleting product:", error));
}

// Re-use or ensure the decodeJWT function is present from your addProduct script
function decodeJWT(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload).id; // Ensure this matches the property where userName is stored
}
