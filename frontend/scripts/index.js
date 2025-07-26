// Track votes per user for each post
const userVotes = {}; // Example: { postId: { userId: 'up' } }

// Function to handle voting
function vote(button, direction) {
  const postElement = button.closest('.post');
  const postId = postElement.getAttribute('data-post-id');
  const userId = 'currentUser'; // Replace with actual user ID

  // Initialize votes for the post if not already set
  if (!userVotes[postId]) userVotes[postId] = {};

  const voteCountElement = postElement.querySelector('.vote-count');
  let currentVotes = parseInt(voteCountElement.textContent, 10) || 0;

  // Check the user's current vote
  const currentVote = userVotes[postId][userId];

  if (currentVote === direction) {
    // If the user clicks the same vote again, remove their vote
    currentVotes += direction === 'up' ? -1 : 1;
    delete userVotes[postId][userId]; // Remove the vote
  } else {
    // If the user changes their vote or votes for the first time
    if (currentVote === 'up') currentVotes -= 1; // Remove previous upvote
    if (currentVote === 'down') currentVotes += 1; // Remove previous downvote
    currentVotes += direction === 'up' ? 1 : -1; // Apply the new vote
    userVotes[postId][userId] = direction; // Register the new vote
  }

  // Update the UI
  voteCountElement.textContent = currentVotes.toString();
  console.log(`Post ID: ${postId}, Updated vote count: ${currentVotes}`);
}

// Attach event listeners to vote buttons
document.querySelectorAll('.vote-btn').forEach(button => {
  button.addEventListener('click', function () {
    const direction = this.getAttribute('data-direction'); // Add data-direction="up" or "down" to buttons
    vote(this, direction);
  });
});

// Dark Mode Toggle
document.getElementById('darkModeToggle').addEventListener('click', function () {
  document.body.classList.toggle('dark-mode'); // Toggle the "dark-mode" class on the body
  this.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode'; // Update button text
});