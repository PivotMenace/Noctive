import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

console.log("main.js loaded");

let stopPostsSubscription = null;
let latestSnapshot = null;
let currentViewer = null;
let currentViewerIsAdmin = false;
const PUBLIC_PROFILE_DIRECTORY_KEY = "noctive_public_profile_directory";

const ADMIN_CONFIG = {
  uids: [
    "TljwjuBuKvd6VG9e0Mz81y7ZRgi1",
    "G6RyacKuSUTLXniBWRC1WsAm4Rq2"
  ],
  emails: [
    "noctivehq@gmail.com"
  ],
  usernames: [
    "venus"
  ]
};

function normalizeAdminValue(value) {
  return String(value || "").trim().toLowerCase();
}

function isAdminIdentity(identity = {}) {
  const uid = String(identity.uid || "").trim();
  const email = normalizeAdminValue(identity.email);
  const username = normalizeAdminValue(identity.username);
  const displayName = normalizeAdminValue(identity.displayName);

  if (uid && ADMIN_CONFIG.uids.includes(uid)) {
    return true;
  }

  if (email && ADMIN_CONFIG.emails.map(normalizeAdminValue).includes(email)) {
    return true;
  }

  const adminUsernames = ADMIN_CONFIG.usernames.map(normalizeAdminValue);
  return adminUsernames.includes(username) || adminUsernames.includes(displayName);
}

function getSavedProfile(uid) {
  if (!uid) return null;

  try {
    const raw = window.localStorage.getItem(`noctive_profile_${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Could not read saved profile:", error);
    return null;
  }
}

function getPublicProfile(uid) {
  if (!uid) return null;

  try {
    const raw = window.localStorage.getItem(PUBLIC_PROFILE_DIRECTORY_KEY);
    if (!raw) {
      return null;
    }

    const directory = JSON.parse(raw);
    return directory?.[uid] || null;
  } catch (error) {
    console.warn("Could not read public profile directory:", error);
    return null;
  }
}

function getResolvedPostProfile(uid, fallback = {}) {
  const savedProfile = getSavedProfile(uid);
  const publicProfile = getPublicProfile(uid);
  const profile = savedProfile || publicProfile || {};

  return {
    displayName:
      profile.displayName ||
      fallback.displayName ||
      fallback.username ||
      "Noctive User",
    username:
      profile.username ||
      fallback.username ||
      "",
    avatar:
      profile.avatar ??
      fallback.avatar ??
      "",
    theme:
      profile.theme ||
      fallback.theme ||
      "default",
    email:
      profile.email ||
      fallback.email ||
      ""
  };
}

function getViewerAdminIdentity(user) {
  const savedProfile = getSavedProfile(user?.uid);
  return {
    uid: user?.uid,
    email: user?.email,
    username: savedProfile?.username || user?.email?.split("@")[0],
    displayName: savedProfile?.displayName || user?.displayName
  };
}

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
  const resolvedProfile = getResolvedPostProfile(data.uid, {
    displayName: data.displayName,
    username: data.username,
    avatar: data.avatar,
    theme: data.theme,
    email: data.email
  });
  const postIsAdmin = isAdminIdentity({
    uid: data.uid,
    email: resolvedProfile.email,
    username: resolvedProfile.username,
    displayName: resolvedProfile.displayName
  });
  const canDelete = currentViewerIsAdmin || currentViewer?.uid === data.uid;

  const bridge = window.noctiveFeedBridge;
  const post = {
    id: doc.id,
    uid: data.uid || doc.id,
    author: resolvedProfile.displayName,
    theme: resolvedProfile.theme,
    avatar: resolvedProfile.avatar,
    time: formatCreatedAt(data.createdAt),
    tag: data.tag || "#Post",
    body: data.text || "",
    roleLabel: postIsAdmin ? "Admin" : "",
    officialLabel: postIsAdmin ? "Official Noctive Team" : "",
    canDelete,
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

    if (post.roleLabel) {
      const roleEl = document.createElement("div");
      roleEl.textContent = post.roleLabel;
      roleEl.style.fontSize = "0.82rem";
      roleEl.style.fontWeight = "700";
      roleEl.style.color = "rgba(220,20,60,0.95)";
      roleEl.style.marginBottom = "4px";
      postCard.appendChild(roleEl);
    }

    const textEl = document.createElement("div");
    textEl.textContent = post.body;
    textEl.style.lineHeight = "1.5";
    textEl.style.whiteSpace = "pre-wrap";

    postCard.appendChild(nameEl);
    postCard.appendChild(dateEl);
    postCard.appendChild(textEl);

    if (post.canDelete) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.dataset.adminDelete = "true";
      deleteButton.style.marginTop = "12px";
      deleteButton.style.padding = "8px 12px";
      deleteButton.style.borderRadius = "999px";
      deleteButton.style.border = "1px solid rgba(255,255,255,0.12)";
      deleteButton.style.background = "rgba(255,255,255,0.04)";
      deleteButton.style.color = "rgba(255,120,140,0.98)";
      deleteButton.style.cursor = "pointer";
      postCard.appendChild(deleteButton);
    }
  }

  if (postCard) {
    postCard.dataset.firestoreId = doc.id;
    const deleteButton = postCard.querySelector("[data-admin-delete='true']");
    if (deleteButton) {
      deleteButton.addEventListener("click", async () => {
        const confirmed = window.confirm("Delete this post?");
        if (!confirmed) {
          return;
        }

        deleteButton.disabled = true;

        try {
          await deleteDoc(docRef("Posts", doc.id));
        } catch (error) {
          console.error("Could not delete post:", error);
          deleteButton.disabled = false;
          window.alert("Could not delete this post.");
        }
      });
    }
  }

  console.log("Appended post card into #feedList:", postCard);
  return postCard;
}

function docRef(collectionName, id) {
  return doc(db, collectionName, id);
}

function renderPosts(snapshot) {
  const container = getFeedContainer();

  if (!container) return;

  console.log("querySnapshot size:", snapshot.size);
  latestSnapshot = snapshot;
  container.innerHTML = "";

  if (snapshot.empty) {
    container.innerHTML = "<p>No posts yet.</p>";
    return;
  }

  snapshot.forEach((doc) => {
    container.appendChild(buildPostCard(doc));
  });

  window.noctiveFeedBridge?.applyGeneratedAvatars?.();
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
    email: currentViewer?.email || "",
    displayName,
    username,
    text: trimmedText,
    avatar: avatarBox?.dataset.avatar || "",
    theme: avatarBox?.dataset.theme || "default",
    createdAt: serverTimestamp()
  });
}

window.noctiveCreatePost = createPost;

onAuthStateChanged(getAuth(), (user) => {
  currentViewer = user;
  currentViewerIsAdmin = isAdminIdentity(getViewerAdminIdentity(user));

  if (latestSnapshot) {
    renderPosts(latestSnapshot);
  }
});

document.addEventListener("DOMContentLoaded", loadPosts);
