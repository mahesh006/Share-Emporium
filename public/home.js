document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("nearbyItemsBtn")
    .addEventListener("click", fetchAndSortProductsByDistance);
  fetchAllProducts();
  const userToken = localStorage.getItem("userToken");
  if (userToken) {
    const userName = decodeJWT(userToken); // Assuming this function correctly extracts the userName
    document.getElementById("userInfoContainer").innerHTML = `
    <span><a href="/profile.html">Profile</a></span>
          <span>Welcome, ${userName}</span>
          <a href="#" onclick="logout()">Logout</a>
      `;
    //fetchUserUniqueProducts(userName, userToken); // Pass the userName and token for the request
  } else {
    console.error("No userToken found in localStorage");
  }
});

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

function logout() {
  localStorage.removeItem("userToken");
  window.location.reload();
}

function fetchAllProducts() {
  fetch("/products", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((products) => displayProducts(products))
    .catch((error) => console.error("Error:", error));
}

function fetchAndSortProductsByDistance() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      console.log("User's location:", latitude, longitude); // Debugging

      fetch("/products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((products) => {
          console.log(
            "Before sorting:",
            products.map((p) => p.name + " -> " + (p.distance || "No distance"))
          ); // Debugging
          const sortedProducts = sortProductsByDistance(
            products,
            latitude,
            longitude
          );
          console.log(
            "After sorting:",
            sortedProducts.map(
              (p) => p.name + " -> " + p.distance.toFixed(2) + " km"
            )
          ); // Debugging
          displayProducts(sortedProducts);
        })
        .catch((error) => console.error("Error fetching products:", error));
    },
    (error) => {
      console.error("Geolocation error:", error);
      alert("Unable to retrieve your location.");
    }
  );
}

function sortProductsByDistance(products, userLat, userLon) {
  return products
    .map((product) => {
      if (product.location) {
        // Assuming product.location is a string like "Lat: 16.5019648, Lon: 80.642048"
        // More robust parsing to handle spaces and labels
        const latLon = product.location.match(/Lat: ([\d.-]+), Lon: ([\d.-]+)/);
        if (latLon && latLon.length === 3) {
          const lat = parseFloat(latLon[1]);
          const lon = parseFloat(latLon[2]);
          product.distance = calculateDistance(userLat, userLon, lat, lon);
        } else {
          console.error("Invalid location format:", product.location);
          product.distance = Infinity; // Handle parsing failure
        }
      } else {
        product.distance = Infinity; // Products without a location go to the end
      }
      return product;
    })
    .sort((a, b) => a.distance - b.distance);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function displayProducts(sortedProducts) {
  const container = document.getElementById("productsContainer");
  container.innerHTML = "";

  for (const product of sortedProducts) {
    const productElement = document.createElement("div");
    productElement.className = "product clickable";
    const imageHtml = product.imagePath
      ? `<img src="${product.imagePath}" alt="${product.name}" style="max-width: 100px; max-height: 100px;">`
      : "No image available";

    let productInfoHTML = `
      ${imageHtml}
      <h2><a href="product-details.html?productId=${product.id}">${product.name}</a></h2>
      <p>Country: ${product.country}</p>
      <p>Category: ${product.category}</p>
      <p>Item Type: ${product.itemType}</p>
      <p id="rating-${product.id}">Loading ratings...</p>
    `;

    productElement.innerHTML = productInfoHTML;
    container.appendChild(productElement);

    // Fetch and calculate the average rating correctly
    fetch(`/product/${product.id}/reviews`)
      .then((response) => response.json())
      .then((reviews) => {
        if (reviews.length > 0) {
          // Ensure each rating is treated as a number and correctly sum them up
          const totalRating = reviews.reduce(
            (acc, review) => acc + Number(review.rating),
            0
          );
          const averageRating = totalRating / reviews.length;
          const stars = getStarRating(averageRating);

          document.getElementById(
            `rating-${product.id}`
          ).innerHTML = `${stars} `;
        } else {
          document.getElementById(`rating-${product.id}`).innerText =
            "No ratings available";
        }
      })
      .catch((error) => {
        console.error("Error fetching reviews:", error);
        document.getElementById(`rating-${product.id}`).innerText =
          "Error loading ratings";
      });

    if (product.location) {
      const mapId = `map-${product.id}`;
      productElement.innerHTML += `<div id="${mapId}" style="height: 200px;"></div>`;
      initializeMap(mapId, product.location);
    }
  }
}

function getStarRating(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars += '<i class="fas fa-star full-star"></i>'; // Added class "full-star" for styling
    } else if (i - 1 < rating && i > rating) {
      stars += '<i class="fas fa-star-half-alt"></i>'; // Half star
    } else {
      stars += '<i class="far fa-star"></i>'; // Empty star
    }
  }
  return stars;
}

// Re-add your initializeMap function here unchanged

function initializeMap(mapId, locationString) {
  // Assuming locationString is in the format "Lat: 16.5019648, Lon: 80.642048"
  // First, remove the labels and split by comma
  const coords = locationString
    .replace("Lat: ", "")
    .replace("Lon: ", "")
    .split(", ");
  const lat = parseFloat(coords[0]);
  const lon = parseFloat(coords[1]);

  // Ensure lat and lon are valid numbers before initializing the map
  if (!isNaN(lat) && !isNaN(lon)) {
    const map = L.map(mapId).setView([lat, lon], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Add a marker for the product location
    L.marker([lat, lon]).addTo(map).bindPopup("Product Location");
  } else {
    console.error("Invalid location coordinates:", locationString);
  }
}

function searchAndFilterProducts() {
  const searchValue = document.getElementById("searchInput").value;
  const itemType = document.getElementById("filterItemType").value;
  const category = document.getElementById("filterCategory").value;
  const country = document.getElementById("filterCountry").value;

  // Constructing the query parameters
  const queryParams = new URLSearchParams({
    search: searchValue,
    itemType: itemType,
    category: category,
    country: country, // Include the country filter
  }).toString();

  fetch(`/products?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Add any required headers here
    },
  })
    .then((response) => response.json())
    .then((products) => displayProducts(products))
    .catch((error) => console.error("Error:", error));
}
