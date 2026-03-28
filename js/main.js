import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("main.js loaded");

let stopPostsSubscription = null;

function getFeedContainer() {
  const container = document.getElementById("feedList");
  console.log(container);
  return container;
}

function formatCreatedAt(createdAt) {
  if (!createdAt) return "just now";

  try {
    if (typeof createdAt.toDate === "function") {
      return createdAt.toDate().toLocaleString();
    }

    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleString();
    }

    return String(createdAt);
  } catch (error) {
    console.warn("Could not format createdAt:", error);
    return "just now";
  }
}

function buildPostCard(doc) {
  const data = doc.data();
  console.log("Firestore doc:", doc.id, data);

  const bridge = window.noctiveFeedBridge;
  const post = {
    id: doc.id,
    uid: data.uid || doc.id,
    author: data.displayName || data.username || "Noctive User",
    theme: data.theme || "default",
    avatar: data.avatar || "",
    time: formatCreatedAt(data.createdAt),
    tag: data.tag || "#Post",
    body: data.text || "",
    votes: {
      up: Number(data.votes?.up ?? data.likesCount ?? 0),
      down: Number(data.votes?.down ?? 0)
    },
    comments: Array.isArray(data.comments) ? data.comments : []
  };

  let postCard;

  if (bridge?.buildPostMarkup) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = bridge.buildPostMarkup(post);
    postCard = wrapper.firstElementChild;

    if (postCard && bridge.postVoteState && bridge.postCommentState) {
      bridge.postVoteState.set(post.id, {
        up: Number(post.votes.up),
        down: Number(post.votes.down),
        userVote: null
      });
      bridge.postCommentState.set(post.id, post.comments);
      bridge.syncPostVoteUI?.(postCard);
      bridge.syncPostCommentsUI?.(postCard);
      bridge.applyGeneratedAvatars?.();
    }
  } else {
    postCard = document.createElement("article");
    postCard.className = "post";
    postCard.dataset.firestoreId = doc.id;

    const nameEl = document.createElement("div");
    nameEl.textContent = post.author;
    nameEl.style.fontWeight = "700";
    nameEl.style.marginBottom = "6px";

    const dateEl = document.createElement("div");
    dateEl.textContent = post.time;
    dateEl.style.fontSize = "0.85rem";
    dateEl.style.opacity = "0.72";
    dateEl.style.marginBottom = "10px";

    const textEl = document.createElement("div");
    textEl.textContent = post.body;
    textEl.style.lineHeight = "1.5";
    textEl.style.whiteSpace = "pre-wrap";

    postCard.appendChild(nameEl);
    postCard.appendChild(dateEl);
    postCard.appendChild(textEl);
  }

  console.log("Appended post card into #feedList:", postCard);
  return postCard;
}

function renderPosts(snapshot) {
  const container = getFeedContainer();

  if (!container) return;

  console.log("querySnapshot size:", snapshot.size);
  container.innerHTML = "";

  if (snapshot.empty) {
    container.innerHTML = "<p>No posts yet.</p>";
    return;
  }

  snapshot.forEach((doc) => {
    container.appendChild(buildPostCard(doc));
  });
}

function renderPostsError(error) {
  const container = getFeedContainer();

  if (!container) return;

  console.error("Error loading posts:", error);
  container.innerHTML = "<p>Could not load posts.</p>";
}

function subscribeToPosts(postsSource) {
  if (stopPostsSubscription) {
    stopPostsSubscription();
  }

  stopPostsSubscription = onSnapshot(
    postsSource,
    (snapshot) => {
      renderPosts(snapshot);
    },
    (error) => {
      renderPostsError(error);
    }
  );
}

async function loadPosts() {
  const container = getFeedContainer();

  if (!container) return;

  console.log("Loading Firestore posts...");
  container.innerHTML = "<p>Loading posts...</p>";

  const postsCollection = collection(db, "Posts");

  try {
    const orderedPostsQuery = query(postsCollection, orderBy("createdAt", "desc"));
    await getDocs(orderedPostsQuery);
    subscribeToPosts(orderedPostsQuery);
  } catch (orderError) {
    console.warn("Falling back to unordered posts:", orderError);

    try {
      await getDocs(postsCollection);
      subscribeToPosts(postsCollection);
    } catch (error) {
      renderPostsError(error);
    }
  }
}

async function createPost(text) {
  const trimmedText = String(text || "").trim();

  if (!trimmedText) {
    throw new Error("Write something before posting.");
  }

  const uid = window.noctiveViewerKey;

  if (!uid || uid === "guest") {
    throw new Error("Sign in before posting.");
  }

  const displayName =
    document.getElementById("userDisplayName")?.textContent?.trim() || "Noctive User";
  const avatarBox = document.getElementById("sidebarAvatarBox");
  const username = displayName.toLowerCase().replace(/\s+/g, "");

  await addDoc(collection(db, "Posts"), {
    uid,
    displayName,
    username,
    text: trimmedText,
    avatar: avatarBox?.dataset.avatar || "",
    theme: avatarBox?.dataset.theme || "default",
    createdAt: serverTimestamp()
  });
}

window.noctiveCreatePost = createPost;

document.addEventListener("DOMContentLoaded", loadPosts);
