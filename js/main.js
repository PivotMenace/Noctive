import { app, db } from "./firebase.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  runTransaction,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { isAdminIdentity } from "./admin-config.js";
import { normalizeUsername } from "./username-utils.js";

console.log("main.js loaded");

let stopPostsSubscription = null;
let stopProfilesSubscription = null;
let latestSnapshot = null;
let currentViewer = null;
let currentViewerIsAdmin = false;
const postCommentSubscriptions = new Map();
const PUBLIC_PROFILE_DIRECTORY_KEY = "noctive_public_profile_directory";
const POST_VOTE_STORAGE_PREFIX = "noctive_post_votes_";
const BIO_MAX_LENGTH = 180;
const ACCESS_MODE_SESSION_KEY = "noctive_access_mode";
const GUEST_PREVIEW_MODE = "guest";

function isGuestPreviewSession() {
  try {
    return window.sessionStorage.getItem(ACCESS_MODE_SESSION_KEY) === GUEST_PREVIEW_MODE;
  } catch (error) {
    console.warn("Could not read guest preview session:", error);
    return false;
  }
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

function normalizeUid(value) {
  return String(value || "").trim().toLowerCase();
}

function slugifyProfileName(value, fallback = "noctive_user") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || fallback;
}

function getPublicProfile(uid) {
  const normalizedUid = normalizeUid(uid);
  if (!normalizedUid) return null;

  try {
    const raw = window.localStorage.getItem(PUBLIC_PROFILE_DIRECTORY_KEY);
    if (!raw) {
      return null;
    }

    const directory = JSON.parse(raw);
    return directory?.[normalizedUid] || null;
  } catch (error) {
    console.warn("Could not read public profile directory:", error);
    return null;
  }
}

function clampBio(value) {
  return String(value || "").trim().slice(0, BIO_MAX_LENGTH);
}

function stripLegacyBio(value) {
  const bio = clampBio(value);

  if (
    [
      "Add a bio to make this profile feel like yours.",
      "A late-night profile in progress. Shape the vibe, set the look, and make this space feel like yours.",
      "Sign in and start shaping this profile."
    ].includes(bio)
    || bio.includes("is officially inside Noctive. Build this profile into your own corner with a strong bio")
    || bio.includes("has joined Noctive. Edit this section to add a real bio")
  ) {
    return "";
  }

  return bio;
}

function getBannerHeadline(username, displayName = "Noctive User") {
  const safeDisplayName = String(displayName || "").trim() || "Noctive User";
  return `${safeDisplayName} is Alive After Dark`;
}

function syncPublicProfileFromPost(uid, profile = {}) {
  const normalizedUid = normalizeUid(uid);
  if (!normalizedUid) return;

  try {
    const raw = window.localStorage.getItem(PUBLIC_PROFILE_DIRECTORY_KEY);
    const directory = raw ? JSON.parse(raw) : {};
    const existing = directory?.[normalizedUid] || {};
    const displayName =
      existing.displayName ||
      profile.displayName ||
      profile.username ||
      "Noctive User";
    const username = normalizeUsername(
      existing.username || profile.username || displayName,
      normalizedUid
    );

    directory[normalizedUid] = {
      ...existing,
      profileUid: normalizedUid,
      username,
      displayName,
      title: profile.title || existing.title || "Noctive User",
      status: profile.status || existing.status || "Online",
      bio: stripLegacyBio(profile.bio || existing.bio || ""),
      theme: profile.theme || existing.theme || "default",
      avatar: profile.avatar ?? existing.avatar ?? "",
      bannerTitle: profile.bannerTitle || existing.bannerTitle || getBannerHeadline(username, displayName),
      bannerText:
        profile.bannerText ||
        existing.bannerText ||
        "",
      bannerTags: profile.bannerTags || existing.bannerTags || ["Noctive"],
      stats: existing.stats || {
        posts: 0,
        followers: 0,
        following: 0,
        games: 0,
        hubs: 0,
        clips: 0
      }
    };

    window.localStorage.setItem(PUBLIC_PROFILE_DIRECTORY_KEY, JSON.stringify(directory));
  } catch (error) {
    console.warn("Could not sync public profile from post:", error);
  }
}

function getResolvedPostProfile(uid, fallback = {}) {
  const savedProfile = getSavedProfile(uid);
  const publicProfile = getPublicProfile(uid);
  const profile = publicProfile || savedProfile || {};

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
    status:
      profile.status ||
      fallback.status ||
      "Online",
    email:
      profile.email ||
      fallback.email ||
      ""
  };
}

function upsertPublicProfilesFromSnapshot(snapshot) {
  try {
    const raw = window.localStorage.getItem(PUBLIC_PROFILE_DIRECTORY_KEY);
    const directory = raw ? JSON.parse(raw) : {};

    snapshot.forEach((profileDoc) => {
      const data = profileDoc.data();
      const normalizedUid = normalizeUid(data.uid || profileDoc.id);
      if (!normalizedUid) return;

      const displayName =
        data.displayName ||
        data.username ||
        data.email?.split("@")[0] ||
        "Noctive User";
      const username = normalizeUsername(data.username || displayName, normalizedUid);

      directory[normalizedUid] = {
        ...directory[normalizedUid],
        ...data,
        profileUid: normalizedUid,
        uid: normalizedUid,
        username,
        displayName
      };
    });

    window.localStorage.setItem(PUBLIC_PROFILE_DIRECTORY_KEY, JSON.stringify(directory));
  } catch (error) {
    console.warn("Could not sync shared profile directory:", error);
  }
}

function subscribeToProfiles() {
  if (stopProfilesSubscription) return;

  stopProfilesSubscription = onSnapshot(
    collection(db, "Profiles"),
    (snapshot) => {
      upsertPublicProfilesFromSnapshot(snapshot);
      if (latestSnapshot) {
        renderPosts(latestSnapshot);
      }
    },
    (error) => {
      console.error("Could not load shared profiles:", error);
    }
  );
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

function buildPostVoteStorageKey() {
  return `${POST_VOTE_STORAGE_PREFIX}${currentViewer?.uid || window.noctiveViewerKey || "guest"}`;
}

function readStoredPostVotes() {
  try {
    const raw = window.localStorage.getItem(buildPostVoteStorageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.warn("Could not read stored post votes:", error);
    return {};
  }
}

function getStoredPostVote(postId) {
  const votes = readStoredPostVotes();
  const vote = votes?.[postId];
  return vote === "up" || vote === "down" ? vote : null;
}

function saveStoredPostVote(postId, vote) {
  try {
    const votes = readStoredPostVotes();
    if (vote === "up" || vote === "down") {
      votes[postId] = vote;
    } else {
      delete votes[postId];
    }
    window.localStorage.setItem(buildPostVoteStorageKey(), JSON.stringify(votes));
  } catch (error) {
    console.warn("Could not save stored post vote:", error);
  }
}

function getVoteDeltas(previousVote, nextVote) {
  let upDelta = 0;
  let downDelta = 0;

  if (previousVote === "up") upDelta -= 1;
  if (previousVote === "down") downDelta -= 1;
  if (nextVote === "up") upDelta += 1;
  if (nextVote === "down") downDelta += 1;

  return { upDelta, downDelta };
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

function formatPostTime(createdAt) {
  if (!createdAt) return "just now";

  try {
    let dateObj;
    if (typeof createdAt.toDate === "function") {
      dateObj = createdAt.toDate();
    } else if (createdAt.seconds) {
      dateObj = new Date(createdAt.seconds * 1000);
    } else if (createdAt instanceof Date) {
      dateObj = createdAt;
    } else {
      return "just now";
    }

    const hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  } catch (error) {
    return "just now";
  }
}

function formatPostDate(createdAt) {
  if (!createdAt) return "Recently";

  try {
    let dateObj;
    if (typeof createdAt.toDate === "function") {
      dateObj = createdAt.toDate();
    } else if (createdAt.seconds) {
      dateObj = new Date(createdAt.seconds * 1000);
    } else if (createdAt instanceof Date) {
      dateObj = createdAt;
    } else {
      return "Recently";
    }

    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (error) {
    return "Recently";
  }
}

function subscribeToPostComments(postId) {
  if (!postId || postCommentSubscriptions.has(postId)) return;

  const commentsQuery = query(
    collection(db, "Posts", postId, "Comments"),
    orderBy("createdAt", "asc")
  );

  const unsubscribe = onSnapshot(
    commentsQuery,
    (snapshot) => {
      const comments = snapshot.docs.map((commentDoc) => {
        const data = commentDoc.data();
        const resolvedProfile = getResolvedPostProfile(data.uid, {
          displayName: data.author,
          username: data.username
        });
        return {
          id: commentDoc.id,
          uid: data.uid || "",
          author: resolvedProfile.displayName || data.author || "Noctive User",
          username: resolvedProfile.username || data.username || "",
          time: formatCreatedAt(data.createdAt),
          body: data.body || ""
        };
      });

      const bridge = window.noctiveFeedBridge;
      bridge?.postCommentState?.set(postId, comments);

      const postEl = document.querySelector(`[data-post-id="${CSS.escape(postId)}"]`);
      if (postEl) {
        bridge?.syncPostCommentsUI?.(postEl);
      }
    },
    (error) => {
      console.error("Could not load post comments:", error);
    }
  );

  postCommentSubscriptions.set(postId, unsubscribe);
}

function stopPostCommentSubscriptions() {
  postCommentSubscriptions.forEach((unsubscribe) => unsubscribe());
  postCommentSubscriptions.clear();
}

function buildPostCard(doc) {
  const data = doc.data();
  console.log("Firestore doc:", doc.id, data);
  const resolvedProfile = getResolvedPostProfile(data.uid, {
    displayName: data.displayName,
    username: data.username,
    avatar: data.avatar,
    theme: data.theme,
    status: data.status,
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
    username: resolvedProfile.username,
    theme: resolvedProfile.theme,
    avatar: resolvedProfile.avatar,
    status: resolvedProfile.status,
    time: formatPostTime(data.createdAt),
    date: formatPostDate(data.createdAt),
    views: data.views || 0,
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

  syncPublicProfileFromPost(post.uid, {
    username: resolvedProfile.username,
    displayName: resolvedProfile.displayName,
    avatar: resolvedProfile.avatar,
    theme: resolvedProfile.theme,
    title: postIsAdmin ? "Admin" : "Noctive User",
    status: resolvedProfile.status,
    bio: clampBio(postIsAdmin
      ? `${resolvedProfile.displayName} is an official Noctive account.`
      : `${resolvedProfile.displayName} is active on Noctive.`),
    bannerTitle: getBannerHeadline(resolvedProfile.username, resolvedProfile.displayName),
    bannerText: postIsAdmin
      ? `${resolvedProfile.displayName} posts official updates and community notes on Noctive.`
      : "",
    bannerTags: postIsAdmin ? ["Official", "Noctive"] : ["Noctive"]
  });

  let postCard;

  if (bridge?.buildPostMarkup) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = bridge.buildPostMarkup(post);
    postCard = wrapper.firstElementChild;

    if (postCard && bridge.postVoteState && bridge.postCommentState) {
      const storedVote = getStoredPostVote(post.id);
      bridge.postVoteState.set(post.id, {
        up: Number(post.votes.up),
        down: Number(post.votes.down),
        userVote: storedVote
      });
      bridge.postCommentState.set(post.id, post.comments);
      bridge.syncPostVoteUI?.(postCard);
      bridge.syncPostCommentsUI?.(postCard);
      bridge.applyGeneratedAvatars?.();
      subscribeToPostComments(post.id);
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
  stopPostCommentSubscriptions();
  container.innerHTML = "";

  if (snapshot.empty) {
    container.innerHTML = "<p>No posts yet.</p>";
    window.noctiveFeedBridge?.renderGuestPreviewPosts?.(container);
    return;
  }

  snapshot.forEach((doc) => {
    container.appendChild(buildPostCard(doc));
  });

  window.noctiveFeedBridge?.renderGuestPreviewPosts?.(container);
  window.noctiveFeedBridge?.applyGeneratedAvatars?.();
}

function renderPostsError(error) {
  const container = getFeedContainer();

  if (!container) return;

  console.error("Error loading posts:", error);
  const message = String(error?.message || "");
  const isPermissionError =
    error?.code === "permission-denied"
    || message.toLowerCase().includes("permission")
    || message.toLowerCase().includes("insufficient permissions");

  if (isPermissionError) {
    container.innerHTML = "<p>Posts are blocked by Firestore permissions right now.</p>";
    return;
  }

  container.innerHTML = "<p>Could not load posts.</p>";
}

function subscribeToPosts(postsSource, fallbackSource = null) {
  if (stopPostsSubscription) {
    stopPostsSubscription();
  }

  stopPostsSubscription = onSnapshot(
    postsSource,
    (snapshot) => {
      renderPosts(snapshot);
    },
    (error) => {
      if (fallbackSource && fallbackSource !== postsSource) {
        console.warn("Falling back to alternate posts source:", error);
        subscribeToPosts(fallbackSource, null);
        return;
      }

      renderPostsError(error);
    }
  );
}

function loadPosts() {
  const container = getFeedContainer();

  if (!container) return;

  console.log("Loading Firestore posts...");
  container.innerHTML = "<p>Loading posts...</p>";

  const postsCollection = collection(db, "Posts");
  const orderedPostsQuery = query(postsCollection, orderBy("createdAt", "desc"));
  subscribeToPosts(orderedPostsQuery, postsCollection);
}

async function createPost(text) {
  const trimmedText = String(text || "").trim();

  if (!trimmedText) {
    throw new Error("Write something before posting.");
  }

  const uid = window.noctiveViewerKey;

  if (isGuestPreviewSession() || !uid || uid === "guest") {
    throw new Error("Guest preview posts do not publish. Sign up to post for real.");
  }

  const resolvedProfile = getResolvedPostProfile(uid, {
    displayName: document.getElementById("userDisplayName")?.textContent?.trim(),
    username: currentViewer?.email?.split("@")[0],
    avatar: document.getElementById("sidebarAvatarBox")?.dataset.avatar,
    theme: document.getElementById("sidebarAvatarBox")?.dataset.theme,
    status: "Online",
    email: currentViewer?.email || ""
  });
  const displayName = resolvedProfile.displayName || "Noctive User";
  const username = normalizeUsername(resolvedProfile.username || displayName, uid);
  const avatarBox = document.getElementById("sidebarAvatarBox");

  await addDoc(collection(db, "Posts"), {
    uid,
    email: currentViewer?.email || "",
    displayName,
    username,
    text: trimmedText,
    avatar: resolvedProfile.avatar || avatarBox?.dataset.avatar || "",
    theme: resolvedProfile.theme || avatarBox?.dataset.theme || "default",
    status: resolvedProfile.status || "Online",
    createdAt: serverTimestamp()
  });
}

window.noctiveCreatePost = createPost;

async function createComment(postId, body) {
  const trimmedBody = String(body || "").trim();

  if (!trimmedBody) {
    throw new Error("Write a reply first.");
  }

  if (isGuestPreviewSession() || !currentViewer?.uid) {
    throw new Error("Sign in before replying.");
  }

  const resolvedProfile = getResolvedPostProfile(currentViewer.uid, {
    displayName: document.getElementById("userDisplayName")?.textContent?.trim()
      || currentViewer.displayName,
    username: currentViewer.email?.split("@")[0],
    email: currentViewer.email || ""
  });
  const displayName = resolvedProfile.displayName || "Noctive User";

  await addDoc(collection(db, "Posts", postId, "Comments"), {
    uid: currentViewer.uid,
    author: displayName,
    username: normalizeUsername(resolvedProfile.username || displayName, currentViewer.uid),
    body: trimmedBody,
    createdAt: serverTimestamp()
  });
}

window.noctiveCreateComment = createComment;

async function voteOnPost(postId, direction) {
  const normalizedDirection = direction === "down" ? "down" : "up";

  if (isGuestPreviewSession() || !currentViewer?.uid) {
    throw new Error("Sign in before voting.");
  }

  const legacyStoredVote = getStoredPostVote(postId);
  const bridge = window.noctiveFeedBridge;
  const currentState = bridge?.postVoteState?.get(postId) || {
    up: 0,
    down: 0,
    userVote: legacyStoredVote
  };

  const postRef = docRef("Posts", postId);
  const voteRef = doc(db, "Posts", postId, "Votes", currentViewer.uid);
  let nextState = {
    ...currentState,
    userVote: normalizedDirection
  };

  await runTransaction(db, async (transaction) => {
    const voteSnapshot = await transaction.get(voteRef);
    const previousVote = voteSnapshot.exists()
      ? voteSnapshot.data()?.direction
      : legacyStoredVote;
    const normalizedPreviousVote = previousVote === "up" || previousVote === "down"
      ? previousVote
      : null;

    if (normalizedPreviousVote === normalizedDirection) {
      const { upDelta, downDelta } = getVoteDeltas(normalizedPreviousVote, null);
      const updates = {};

      if (upDelta) {
        updates["votes.up"] = increment(upDelta);
        updates.likesCount = increment(upDelta);
      }

      if (downDelta) {
        updates["votes.down"] = increment(downDelta);
      }

      transaction.update(postRef, updates);

      if (voteSnapshot.exists()) {
        transaction.delete(voteRef);
      }

      nextState = {
        up: Math.max(0, Number(currentState.up || 0) + upDelta),
        down: Math.max(0, Number(currentState.down || 0) + downDelta),
        userVote: null
      };
      return;
    }

    const { upDelta, downDelta } = getVoteDeltas(normalizedPreviousVote, normalizedDirection);
    const updates = {};

    if (upDelta) {
      updates["votes.up"] = increment(upDelta);
      updates.likesCount = increment(upDelta);
    }

    if (downDelta) {
      updates["votes.down"] = increment(downDelta);
    }

    transaction.update(postRef, updates);
    transaction.set(voteRef, {
      uid: currentViewer.uid,
      direction: normalizedDirection,
      createdAt: voteSnapshot.exists() ? voteSnapshot.data()?.createdAt || serverTimestamp() : serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    nextState = {
      up: Math.max(0, Number(currentState.up || 0) + upDelta),
      down: Math.max(0, Number(currentState.down || 0) + downDelta),
      userVote: normalizedDirection
    };
  });

  saveStoredPostVote(postId, nextState.userVote);

  return nextState;
}

window.noctiveVotePost = voteOnPost;

onAuthStateChanged(getAuth(app), (user) => {
  if (isGuestPreviewSession()) {
    currentViewer = null;
    currentViewerIsAdmin = false;

    if (latestSnapshot) {
      renderPosts(latestSnapshot);
    }
    return;
  }

  currentViewer = user;
  currentViewerIsAdmin = isAdminIdentity(getViewerAdminIdentity(user));
  subscribeToProfiles();

  if (latestSnapshot) {
    renderPosts(latestSnapshot);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  subscribeToProfiles();
  loadPosts();
});
