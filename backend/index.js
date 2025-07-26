// Ensure all DOM elements are properly referenced
var debar = document.getElementById("trendingSidebar");
var enTrendingButton = document.getElementById("openTrendingButton");
var closeTrendingButton = document.getElementById("closeTrendingButton");
// Dynamically add a meta tag for viewport
var metaViewport = document.createElement("meta");
metaViewport.name = "viewport";
metaViewport.content = "width=device-width, initial-scale=1.0";
document.head.appendChild(metaViewport);
document.title = "Noctive – Night‑First Gaming Platform";
// Function to open the trending sidebar
function openTrending() {
    if (debar && enTrendingButton) {
        debar.classList.remove("hidden");
        enTrendingButton.classList.add("hidden");
    }
    else {
        handleError("Trending Sidebar or Open Button not found.");
    }
}
// Function to close the trending sidebar
function closeTrending() {
    if (debar && enTrendingButton) {
        debar.classList.add("hidden");
        enTrendingButton.classList.remove("hidden");
    }
    else {
        handleError("Trending Sidebar or Close Button not found.");
    }
}
// Add event listeners to the buttons
if (enTrendingButton) {
    enTrendingButton.addEventListener("click", openTrending);
}
else {
    handleError("Open Trending Button not found in the DOM.");
}
if (closeTrendingButton) {
    closeTrendingButton.addEventListener("click", closeTrending);
}
else {
    handleError("Close Trending Button not found in the DOM.");
}
// Utility function for error handling
function handleError(message) {
    console.error("Error: ".concat(message));
}
// Function to update character count
function updateCharCount(inputElement, charCountElement) {
    charCountElement.textContent = "".concat(inputElement.value.length);
}
// Function to update the preview text
function updatePreview(inputElement, previewElement) {
    previewElement.textContent = inputElement.value;
}
// Hooking up textarea event
var newPostInput = document.getElementById("newPostInput");
var charCount = document.getElementById("charCount");
var previewText = document.getElementById("previewText");
if (newPostInput && charCount && previewText) {
    newPostInput.addEventListener("input", function () {
        updateCharCount(newPostInput, charCount);
        updatePreview(newPostInput, previewText);
    });
}
else {
    handleError("New Post Input, Char Count, or Preview Text not found in the DOM.");
}
function toggleDropdown() {
    var dropdownLinks = document.querySelector('.dropdown-links');
    if (dropdownLinks) {
        dropdownLinks.classList.toggle('active');
    }
    else {
        handleError("Dropdown links element not found in the DOM.");
    }
}
// Simulate user login data
var user = {
    isLoggedIn: true,
    profilePicture: "https://example.com/user-profile-picture.jpg", // Replace with actual user profile picture URL
};
// Update profile icon dynamically
var profileIcon = document.getElementById("profileIcon");
if (profileIcon) {
    if (user.isLoggedIn && user.profilePicture) {
        profileIcon.src = user.profilePicture;
    }
    else {
        // Fallback to placeholder if no profile picture is available
        profileIcon.src = profileIcon.getAttribute("data-placeholder") || "";
    }
}
else {
    handleError("Profile icon element not found in the DOM.");
}
// Toggle the night crew sidebar
function toggleSidebar() {
    var sidebar = document.getElementById('nightCrewWidget');
    var trending = document.getElementById('trendingSidebar');
    if (sidebar && trending) {
        sidebar.classList.toggle('hidden');
        // Hide the other sidebar if opening this one
        if (!sidebar.classList.contains('hidden')) {
            trending.classList.add('hidden');
        }
    }
}
// Toggle the trending sidebar
function toggleTrending() {
    var trending = document.getElementById('trendingSidebar');
    var sidebar = document.getElementById('nightCrewWidget');
    if (trending && sidebar) {
        trending.classList.toggle('hidden');
        if (!trending.classList.contains('hidden')) {
            sidebar.classList.add('hidden');
        }
    }
}
// Helper: Get unique post ID from the vote button's parent post element
function getPostId(button) {
    // Assumes each post has a unique attribute, e.g., data-post-id
    var post = button.closest('.post');
    return post ? post.getAttribute('data-post-id') : null;
}
// Helper: Check if user has already upvoted this post
function hasUpvoted(postId) {
    var upvoted = localStorage.getItem('upvotedPosts');
    if (!upvoted)
        return false;
    var upvotedPosts = JSON.parse(upvoted);
    return upvotedPosts.includes(postId);
}
// Helper: Mark post as upvoted
function setUpvoted(postId) {
    var upvoted = localStorage.getItem('upvotedPosts');
    var upvotedPosts = upvoted ? JSON.parse(upvoted) : [];
    if (!upvotedPosts.includes(postId)) {
        upvotedPosts.push(postId);
        localStorage.setItem('upvotedPosts', JSON.stringify(upvotedPosts));
    }
}
// Voting function (upvote only once per user per post)
function vote(button, direction) {
    var _a;
    var postId = getPostId(button);
    if (!postId)
        return;
    // Only allow one upvote per user per post
    if (direction === 'up' && hasUpvoted(postId)) {
        // Optionally, show a message or visual feedback
        return;
    }
    var voteCount = (_a = button.parentElement) === null || _a === void 0 ? void 0 : _a.querySelector('.vote-count');
    if (!voteCount)
        return;
    var count = parseInt(voteCount.innerText, 10);
    if (direction === 'up') {
        count++;
        button.classList.add('voted-up');
        voteCount.classList.add('animate');
        setUpvoted(postId);
    }
    else {
        count--;
        button.classList.add('voted-down');
        voteCount.classList.add('animate');
        // Optionally, handle downvote tracking if needed
    }
    voteCount.innerText = count.toString();
    setTimeout(function () {
        voteCount.classList.remove('animate');
    }, 500);
}
// Character counter for the post input (limits to 200 chars)
var newPostInput2 = document.getElementById('newPostInput');
var charCount2 = document.getElementById('charCount');
if (newPostInput2 && charCount2) {
    newPostInput2.addEventListener('input', function () {
        var length = newPostInput2.value.length;
        charCount2.innerText = length.toString();
        if (length > 200) {
            newPostInput2.value = newPostInput2.value.substring(0, 200);
        }
    });
}
// Simulate window close: hide all content except header
function windowClose() {
    document.body.querySelectorAll('header ~ *').forEach(function (el) {
        el.style.display = 'none';
    });
    var header = document.querySelector('header');
    if (header)
        header.style.opacity = '0.7';
}
// Animated starfield: create and animate stars
(function createStars() {
    var starBg = document.getElementById('starBg');
    if (!starBg)
        return;
    var STAR_COUNT = 60;
    for (var i = 0; i < STAR_COUNT; i++) {
        var star = document.createElement('div');
        star.className = 'star';
        // Randomize initial position and animation duration
        star.style.left = Math.random() * 100 + 'vw';
        star.style.top = Math.random() * 100 + 'vh';
        star.style.opacity = (0.5 + Math.random() * 0.5).toString();
        star.style.animationDuration = (8 + Math.random() * 8) + 's';
        star.style.animationDelay = (-Math.random() * 10) + 's';
        starBg.appendChild(star);
    }
})();
