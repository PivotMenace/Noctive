// Ensure all DOM elements are properly referenced
const debar = document.getElementById("trendingSidebar") as HTMLElement | null;
const enTrendingButton = document.getElementById("openTrendingButton") as HTMLElement | null;
const closeTrendingButton = document.getElementById("closeTrendingButton") as HTMLElement | null;

// Dynamically add a meta tag for viewport
const metaViewport = document.createElement("meta");
metaViewport.name = "viewport";
metaViewport.content = "width=device-width, initial-scale=1.0";
document.head.appendChild(metaViewport);

document.title = "Noctive – Night‑First Gaming Platform";

// Function to open the trending sidebar
function openTrending(): void {
  if (debar && enTrendingButton) {
    debar.classList.remove("hidden");
    enTrendingButton.classList.add("hidden");
  } else {
    handleError("Trending Sidebar or Open Button not found.");
  }
}

// Function to close the trending sidebar
function closeTrending(): void {
  if (debar && enTrendingButton) {
    debar.classList.add("hidden");
    enTrendingButton.classList.remove("hidden");
  } else {
    handleError("Trending Sidebar or Close Button not found.");
  }
}

// Add event listeners to the buttons
if (enTrendingButton) {
  enTrendingButton.addEventListener("click", openTrending);
} else {
  handleError("Open Trending Button not found in the DOM.");
}

if (closeTrendingButton) {
  closeTrendingButton.addEventListener("click", closeTrending);
} else {
  handleError("Close Trending Button not found in the DOM.");
}

// Utility function for error handling
function handleError(message: string): void {
  console.error(`Error: ${message}`);
}

// Function to update character count
function updateCharCount(inputElement: HTMLTextAreaElement, charCountElement: HTMLElement): void {
  charCountElement.textContent = `${inputElement.value.length}`;
}

// Function to update the preview text
function updatePreview(inputElement: HTMLTextAreaElement, previewElement: HTMLElement): void {
  previewElement.textContent = inputElement.value;
}

// Hooking up textarea event
const newPostInput = document.getElementById("newPostInput") as HTMLTextAreaElement | null;
const charCount = document.getElementById("charCount") as HTMLElement | null;
const previewText = document.getElementById("previewText") as HTMLElement | null;

if (newPostInput && charCount && previewText) {
  newPostInput.addEventListener("input", () => {
    updateCharCount(newPostInput, charCount);
    updatePreview(newPostInput, previewText);
  });
} else {
  handleError("New Post Input, Char Count, or Preview Text not found in the DOM.");
}

function toggleDropdown() {
  const dropdownLinks = document.querySelector('.dropdown-links');
  if (dropdownLinks) {
    dropdownLinks.classList.toggle('active');
  } else {
    handleError("Dropdown links element not found in the DOM.");
  }
}

// Simulate user login data
const user = {
  isLoggedIn: true,
  profilePicture: "https://example.com/user-profile-picture.jpg", // Replace with actual user profile picture URL
};

// Update profile icon dynamically
const profileIcon = document.getElementById("profileIcon") as HTMLImageElement | null;

if (profileIcon) {
  if (user.isLoggedIn && user.profilePicture) {
    profileIcon.src = user.profilePicture;
  } else {
    // Fallback to placeholder if no profile picture is available
    profileIcon.src = profileIcon.getAttribute("data-placeholder") || "";
  }
} else {
  handleError("Profile icon element not found in the DOM.");
}

// Toggle the night crew sidebar
function toggleSidebar(): void {
  const sidebar = document.getElementById('nightCrewWidget') as HTMLElement | null;
  const trending = document.getElementById('trendingSidebar') as HTMLElement | null;
  if (sidebar && trending) {
    sidebar.classList.toggle('hidden');
    // Hide the other sidebar if opening this one
    if (!sidebar.classList.contains('hidden')) {
      trending.classList.add('hidden');
    }
  }
}

// Toggle the trending sidebar
function toggleTrending(): void {
  const trending = document.getElementById('trendingSidebar') as HTMLElement | null;
  const sidebar = document.getElementById('nightCrewWidget') as HTMLElement | null;
  if (trending && sidebar) {
    trending.classList.toggle('hidden');
    if (!trending.classList.contains('hidden')) {
      sidebar.classList.add('hidden');
    }
  }
}

// Helper: Get unique post ID from the vote button's parent post element
function getPostId(button: HTMLElement): string | null {
  // Assumes each post has a unique attribute, e.g., data-post-id
  const post = button.closest('.post') as HTMLElement | null;
  return post ? post.getAttribute('data-post-id') : null;
}

// Helper: Check if user has already upvoted this post
function hasUpvoted(postId: string): boolean {
  const upvoted = localStorage.getItem('upvotedPosts');
  if (!upvoted) return false;
  const upvotedPosts = JSON.parse(upvoted) as string[];
  return upvotedPosts.includes(postId);
}

// Helper: Mark post as upvoted
function setUpvoted(postId: string): void {
  const upvoted = localStorage.getItem('upvotedPosts');
  const upvotedPosts = upvoted ? (JSON.parse(upvoted) as string[]) : [];
  if (!upvotedPosts.includes(postId)) {
    upvotedPosts.push(postId);
    localStorage.setItem('upvotedPosts', JSON.stringify(upvotedPosts));
  }
}

// Voting function (upvote only once per user per post)
function vote(button: HTMLElement, direction: 'up' | 'down'): void {
  const postId = getPostId(button);
  if (!postId) return;

  // Only allow one upvote per user per post
  if (direction === 'up' && hasUpvoted(postId)) {
    // Optionally, show a message or visual feedback
    return;
  }

  const voteCount = button.parentElement?.querySelector('.vote-count') as HTMLElement | null;
  if (!voteCount) return;
  let count = parseInt(voteCount.innerText, 10);

  if (direction === 'up') {
    count++;
    button.classList.add('voted-up');
    voteCount.classList.add('animate');
    setUpvoted(postId);
  } else {
    count--;
    button.classList.add('voted-down');
    voteCount.classList.add('animate');
    // Optionally, handle downvote tracking if needed
  }
  voteCount.innerText = count.toString();
  setTimeout(() => {
    voteCount.classList.remove('animate');
  }, 500);
}

// Character counter for the post input (limits to 200 chars)
const newPostInput2 = document.getElementById('newPostInput') as HTMLTextAreaElement | null;
const charCount2 = document.getElementById('charCount') as HTMLElement | null;
if (newPostInput2 && charCount2) {
  newPostInput2.addEventListener('input', () => {
    const length = newPostInput2.value.length;
    charCount2.innerText = length.toString();
    if (length > 200) {
      newPostInput2.value = newPostInput2.value.substring(0, 200);
    }
  });
}

// Simulate window close: hide all content except header
function windowClose(): void {
  document.body.querySelectorAll('header ~ *').forEach(el => {
    (el as HTMLElement).style.display = 'none';
  });
  const header = document.querySelector('header') as HTMLElement | null;
  if (header) header.style.opacity = '0.7';
}

// Animated starfield: create and animate stars
(function createStars() {
  const starBg = document.getElementById('starBg') as HTMLElement | null;
  if (!starBg) return;
  const STAR_COUNT = 60;
  for (let i = 0; i < STAR_COUNT; i++) {
    const star = document.createElement('div');
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

// Example login function
async function login(username: string, password: string) {
  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (data.success) {
    alert('Login successful!');
  } else {
    alert('Login failed: ' + data.message);
  }
}

// Your form code here...
const loginForm = document.getElementById('loginForm') as HTMLFormElement | null;
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    await login(username, password);
  });
}

async function loadPosts() {
  const response = await fetch('/posts');
  const posts = await response.json();
  // Render posts to the page
  console.log(posts);
}

async function postComment(postId: string, comment: string) {
  const response = await fetch('/comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, comment })
  });
  const data = await response.json();
  if (data.success) {
    alert('Comment saved!');
  }
}

//# sourceMappingURL=index.js.map