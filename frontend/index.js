const toggleSidebar = () => {
  const sidebar = document.getElementById('nightCrewWidget');
  sidebar.classList.toggle('hidden');
};

const toggleTrending = () => {
  const trendingSidebar = document.getElementById('trendingSidebar');
  trendingSidebar.classList.toggle('hidden');
};

function toggleSidebar() {
  const sidebar = document.getElementById('nightCrewWidget');
  sidebar.classList.toggle('hidden');
}

function toggleTrending() {
  const trendingSidebar = document.getElementById('trendingSidebar');
  trendingSidebar.classList.toggle('hidden');
}

// Track votes per user for each post
const userVotes = {}; // Example: { postId: { userId: 'up' } }

function vote(button, direction) {
  const postElement = button.closest('.post');
  const postId = postElement.getAttribute('data-post-id');
  const userId = 'currentUser'; // Replace with actual user ID

  // Initialize votes for the post if not already set
  if (!userVotes[postId]) userVotes[postId] = {};

  const voteCountElement = postElement.querySelector('.vote-count');
  const upvoteButton = postElement.querySelector('.vote-btn.upvote');
  const downvoteButton = postElement.querySelector('.vote-btn.downvote');
  let currentVotes = parseInt(voteCountElement.textContent, 10) || 0;

  // Check the user's current vote
  const currentVote = userVotes[postId][userId];

  if (currentVote === direction) {
    // If the user clicks the same vote again, remove their vote
    currentVotes = 0; // Reset vote count to 0
    delete userVotes[postId][userId]; // Remove the vote

    // Remove active class from both buttons
    upvoteButton.classList.remove('active');
    downvoteButton.classList.remove('active');
  } else {
    // If the user switches their vote or votes for the first time
    if (currentVote === 'up') {
      currentVotes -= 1; // Remove previous upvote
    } else if (currentVote === 'down') {
      currentVotes += 1; // Remove previous downvote
    }
    currentVotes += direction === 'up' ? 1 : -1; // Apply the new vote
    userVotes[postId][userId] = direction; // Register the new vote

    // Update active class based on the direction
    if (direction === 'up') {
      upvoteButton.classList.add('active');
      downvoteButton.classList.remove('active');
    } else {
      downvoteButton.classList.add('active');
      upvoteButton.classList.remove('active');
    }
  }

  // Update the UI
  voteCountElement.textContent = currentVotes.toString();
  console.log(`Post ID: ${postId}, Updated vote count: ${currentVotes}`);
}

vote(document.querySelector('.vote-btn'), 'up');

const App = () => (
  <>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Noctive – Night‑First Gaming Platform</title>
        <link rel="stylesheet" href="styles.css" />
        <script src="index.js" defer></script>
      </head>
      <body>
        <header>
          <div className="header-content">
            <div className="brand-title">Noctive</div>
            <nav className="header-nav">
              <a href="#" className="nav-link">Home</a>
              <a href="#" className="nav-link">Trending</a>
            </nav>
          </div>
        </header>
        {/* Scripts moved to external functions */}
      </body>
    </html>
  </>
);

export default App;
