document.addEventListener("DOMContentLoaded", function () {
  const userToken = localStorage.getItem("userToken");
  const userName = decodeJWT(userToken);
  document.getElementById("userInfoContainer").innerHTML = `
  <span><a href="/home.html">Home</a></span>
          <span>Welcome, ${userName}</span>
          <a href="#" onclick="logout()">Logout</a>
      `;

  // Call the function to fetch and display product details and reviews
  fetchProductDetails();
  setupReviewForm(userName);
});

const queryParams = new URLSearchParams(window.location.search);
const productId = queryParams.get("productId");

async function fetchProductDetails() {
  try {
    const response = await fetch(`/product/${productId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch product details");
    }
    const product = await response.json();

    // Update image if available
    const imageElement = document.getElementById("productImage");
    if (product.imagePath) {
      imageElement.src = product.imagePath;
      imageElement.alt = product.name;
      imageElement.style.display = "block"; // Show the image
    } else {
      imageElement.style.display = "none"; // Hide the image if not available
    }

    // Update text content for other details
    document.getElementById("productName").textContent = product.name;
    document.getElementById("productDescription").innerHTML +=
      product.description;
    document.getElementById(
      "productCategory"
    ).innerHTML += ` ${product.category}`;
    document.getElementById(
      "productItemType"
    ).innerHTML += ` ${product.itemType}`;

    // Additional setup functions as needed
    setupContactOwnerModal(product.phone);
    fetchAndDisplayReviews();
    if (product.location) {
      setupMap(product.location);
    }
  } catch (error) {
    console.error(error);
    alert("Error fetching product details");
  }
}

function setupMap(productLocation) {
  const locationParts = productLocation.split(", ");
  const productLat = parseFloat(locationParts[0].split(": ")[1]);
  const productLng = parseFloat(locationParts[1].split(": ")[1]);

  navigator.geolocation.getCurrentPosition(
    function (position) {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      const map = L.map("map").setView([userLat, userLng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 10,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Show loading indicator
      document.getElementById("loading").style.display = "block";

      const control = L.Routing.control({
        waypoints: [
          L.latLng(userLat, userLng),
          L.latLng(productLat, productLng),
        ],
        routeWhileDragging: true,
        router: L.Routing.osrmv1({
          serviceUrl: `https://router.project-osrm.org/route/v1`,
          profile: "driving", // Change 'driving' to 'walking' or 'cycling' as needed
        }),
        showAlternatives: true,
      }).addTo(map);

      control.on("routesfound", function () {
        // Hide loading indicator when route is found
        document.getElementById("loading").style.display = "none";
      });

      control.on("routingerror", function () {
        // Hide loading indicator and show an error message if routing fails
        document.getElementById("loading").style.display = "none";
        alert("Failed to calculate the route. Please try again.");
      });
    },
    function (error) {
      alert(`Unable to access your location: ${error.message}`);
    }
  );
}
async function fetchAndDisplayReviews() {
  const reviewsContainer = document.getElementById("reviewsContainer");
  reviewsContainer.innerHTML = ""; // Clear existing content

  try {
    const reviewsResponse = await fetch(`/product/${productId}/reviews`);
    if (!reviewsResponse.ok) {
      throw new Error("Failed to fetch reviews");
    }
    const reviews = await reviewsResponse.json();

    if (reviews.length > 0) {
      const reviewsTitle = document.createElement("h2");
      reviewsTitle.textContent = "Reviews";
      reviewsContainer.appendChild(reviewsTitle);

      reviews.forEach((review) => {
        const reviewDiv = document.createElement("div");
        reviewDiv.classList.add("review");

        const usernameP = document.createElement("p");
        usernameP.textContent = `${review.userId}`;

        const starsP = document.createElement("p");
        let stars = "";
        for (let i = 0; i < 5; i++) {
          if (i < parseInt(review.rating)) {
            stars += "★"; // Filled star
          } else {
            stars += "☆"; // Empty star
          }
        }
        starsP.innerHTML = `<span class="gold-stars">${stars}</span>`;

        const reviewTextP = document.createElement("p");
        reviewTextP.textContent = `Review: ${review.reviewText}`;

        // Append the paragraphs to the review div
        reviewDiv.appendChild(usernameP);
        reviewDiv.appendChild(starsP);
        reviewDiv.appendChild(reviewTextP);

        // Append the review div to the container
        reviewsContainer.appendChild(reviewDiv);
      });
    } else {
      const noReviewsP = document.createElement("p");
      noReviewsP.textContent = "No reviews yet.";
      reviewsContainer.appendChild(noReviewsP);
    }
  } catch (error) {
    console.error(error);
    alert("Error fetching reviews");
  }
}

function setupReviewForm(userName) {
  const form = document.getElementById("reviewForm");
  form.onsubmit = async function (event) {
    event.preventDefault();

    // Retrieve the selected rating from the radio buttons
    const ratingElements = document.getElementsByName("rating");
    let ratingValue;
    for (const ratingElement of ratingElements) {
      if (ratingElement.checked) {
        ratingValue = ratingElement.value;
        break;
      }
    }

    const reviewText = document.getElementById("reviewText").value;

    try {
      const response = await fetch(`/product/${productId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: ratingValue,
          reviewText: reviewText,
          userName: userName, // Use the userName obtained from JWT
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      // Clear form
      ratingElements.forEach((element) => (element.checked = false)); // Uncheck all stars
      document.getElementById("reviewText").value = "";

      // Fetch and display updated reviews
      fetchAndDisplayReviews();

      alert("Review submitted successfully!");
    } catch (error) {
      console.error(error);
      alert("Error submitting review");
    }
  };
}

function setupContactOwnerModal(productPhone) {
  const contactOwnerButton = document.getElementById("contactOwnerButton");
  const contactOwnerModal = document.getElementById("contactOwnerModal");
  const close = document.getElementsByClassName("close")[0];
  const submitContact = document.getElementById("submitContact");

  contactOwnerButton.onclick = function () {
    contactOwnerModal.style.display = "block";
  };

  close.onclick = function () {
    contactOwnerModal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target === contactOwnerModal) {
      contactOwnerModal.style.display = "none";
    }
  };

  submitContact.onclick = async function () {
    const description = document.getElementById("description").value;
    const contactNumber = document.getElementById("contactNumber").value; // Sender's contact number
    const message = `${description}. My Contact Number: ${contactNumber}`;
    const messageBox = document.getElementById("messageBox");

    // Send WhatsApp message to the product's phone number
    try {
      const response = await fetch("/send-whatsapp-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: productPhone, // Use the product's phone number
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send WhatsApp message");
      }

      // Display success message
      messageBox.style.display = "block";
      messageBox.textContent = "Message sent successfully via WhatsApp";
      messageBox.style.backgroundColor = "#d4edda"; // Light green background
      messageBox.style.color = "#155724"; // Dark green text
      //contactOwnerModal.style.display = "none";
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);

      // Display error message
      messageBox.style.display = "block";
      messageBox.textContent = "Error sending message via WhatsApp";
      messageBox.style.backgroundColor = "#f8d7da"; // Light red background
      messageBox.style.color = "#721c24"; // Dark red text
    }
  };
}

function decodeJWT(token) {
  const base64Url = token.split(".")[1]; // Get the payload part of the token
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload).id; // Assuming 'id' is where you stored the userName
}
