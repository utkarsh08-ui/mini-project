const API_KEY = "a51788fe";

const moviesContainer = document.getElementById("movies");
const recommendedContainer = document.getElementById("recommended");
const likedContainer = document.getElementById("likedMovies");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");

let likedGenres = JSON.parse(localStorage.getItem("likedGenres")) || {};
let movieRatings = JSON.parse(localStorage.getItem("movieRatings")) || {};
let likedMovies = JSON.parse(localStorage.getItem("likedMovies")) || [];

if (Object.keys(likedGenres).length > 0) showRecommendations();
if (likedMovies.length > 0) displayLikedMovies();

async function fetchMovies(query) {
  const res = await fetch(`https://www.omdbapi.com/?s=${query}&apikey=${API_KEY}`);
  const data = await res.json();
  if (data.Response === "True") displayMovies(data.Search);
  else moviesContainer.innerHTML = `<p>No movies found. Try another search.</p>`;
}

function displayMovies(movies) {
  moviesContainer.innerHTML = "";
  movies.forEach(movie => {
    const card = document.createElement("div");
    card.classList.add("movie-card");
    const poster = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x400?text=No+Image";
    const rating = movieRatings[movie.Title] || 0;
    const isLiked = likedMovies.includes(movie.Title);
    card.innerHTML = `
      <img src="${poster}" alt="${movie.Title}">
      <h3>${movie.Title}</h3>
      <p>${movie.Year}</p>
      <div class="stars" id="stars-${movie.Title.replace(/\s/g, '')}">
        ${createStarButtons(movie.Title, rating)}
      </div>
      <button class="like-btn" onclick="toggleLikeMovie('${movie.Title}', '${poster}')">
        ${isLiked ? "💔 Unlike" : "❤️ Like"}
      </button>
    `;
    moviesContainer.appendChild(card);
  });
}

function createStarButtons(title, currentRating) {
  let starsHTML = "";
  for (let i = 1; i <= 5; i++) {
    const filled = i <= currentRating ? "⭐" : "☆";
    starsHTML += `<span class="star" onclick="rateMovie('${title}', ${i})">${filled}</span>`;
  }
  return starsHTML;
}

function rateMovie(title, rating) {
  movieRatings[title] = rating;
  localStorage.setItem("movieRatings", JSON.stringify(movieRatings));
  const starDiv = document.getElementById(`stars-${title.replace(/\s/g, '')}`);
  if (starDiv) starDiv.innerHTML = createStarButtons(title, rating);
}

async function toggleLikeMovie(title, poster) {
  if (likedMovies.includes(title)) {
    likedMovies = likedMovies.filter(t => t !== title);
    localStorage.setItem("likedMovies", JSON.stringify(likedMovies));
    displayLikedMovies();
    updateButtonText(title, "❤️ Like");
    showRecommendations();
    return;
  }

  const res = await fetch(`https://www.omdbapi.com/?t=${title}&apikey=${API_KEY}`);
  const data = await res.json();
  if (data.Response === "True" && data.Genre) {
    const genres = data.Genre.split(", ").map(g => g.trim());
    genres.forEach(g => {
      likedGenres[g] = (likedGenres[g] || 0) + 1;
    });
    localStorage.setItem("likedGenres", JSON.stringify(likedGenres));

    likedMovies.push(title);
    localStorage.setItem("likedMovies", JSON.stringify(likedMovies));
    displayLikedMovies();
    updateButtonText(title, "💔 Unlike");
    showRecommendations();
  }
}

function updateButtonText(title, text) {
  const button = [...document.querySelectorAll(".like-btn")].find(btn =>
    btn.outerHTML.includes(title)
  );
  if (button) button.textContent = text;
}

function displayLikedMovies() {
  likedContainer.innerHTML = "";
  if (likedMovies.length === 0) {
    likedContainer.innerHTML = "<p>No liked movies yet.</p>";
    return;
  }

  likedMovies.forEach(async (title) => {
    const res = await fetch(`https://www.omdbapi.com/?t=${title}&apikey=${API_KEY}`);
    const data = await res.json();
    if (data.Response === "True") {
      const poster = data.Poster !== "N/A" ? data.Poster : "https://via.placeholder.com/300x400?text=No+Image";
      const card = document.createElement("div");
      card.classList.add("movie-card");
      card.innerHTML = `
        <img src="${poster}" alt="${data.Title}">
        <h3>${data.Title}</h3>
        <p>${data.Year}</p>
        <button class="unlike-btn" onclick="toggleLikeMovie('${data.Title}', '${poster}')">Remove 💔</button>
      `;
      likedContainer.appendChild(card);
    }
  });
}

async function showRecommendations() {
  recommendedContainer.innerHTML = "<p>Loading recommendations...</p>";
  const topGenre = Object.keys(likedGenres).reduce((a, b) => likedGenres[a] > likedGenres[b] ? a : b, null);
  if (!topGenre) {
    recommendedContainer.innerHTML = "<p>Like some movies to get recommendations!</p>";
    return;
  }

  const res = await fetch(`https://www.omdbapi.com/?s=${topGenre}&apikey=${API_KEY}`);
  const data = await res.json();
  if (data.Response === "True") {
    recommendedContainer.innerHTML = "";
    data.Search.slice(0, 8).forEach(movie => {
      const card = document.createElement("div");
      card.classList.add("movie-card");
      const poster = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x400?text=No+Image";
      const rating = movieRatings[movie.Title] || 0;
      card.innerHTML = `
        <img src="${poster}" alt="${movie.Title}">
        <h3>${movie.Title}</h3>
        <p>${movie.Year}</p>
        <div class="stars" id="stars-${movie.Title.replace(/\s/g, '')}">
          ${createStarButtons(movie.Title, rating)}
        </div>
      `;
      recommendedContainer.appendChild(card);
    });
  } else {
    recommendedContainer.innerHTML = "<p>No recommendations found yet.</p>";
  }
}

function clearAllData() {
  localStorage.clear();
  likedGenres = {};
  movieRatings = {};
  likedMovies = [];
  moviesContainer.innerHTML = "";
  recommendedContainer.innerHTML = "<p>Recommendations cleared.</p>";
  likedContainer.innerHTML = "<p>Liked movies cleared.</p>";
  alert("All data cleared!");
}

searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) fetchMovies(query);
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

clearBtn.addEventListener("click", clearAllData);
