import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("main.js loaded");

function formatCreatedAt(createdAt) {
  if (!createdAt) return "";

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
    return "";
  }
}

async function loadPosts() {
  const container = document.getElementById("feedList");
  console.log(container);

  if (!container) return;

  console.log("Loading Firestore posts...");
  container.innerHTML = "<p>Loading posts...</p>";

  try {
    let querySnapshot;

    try {
      const postsQuery = query(
        collection(db, "Posts"),
        orderBy("createdAt", "desc")
      );
      querySnapshot = await getDocs(postsQuery);
    } catch (orderError) {
      console.warn("Falling back to unordered posts:", orderError);
      querySnapshot = await getDocs(collection(db, "Posts"));
    }

    console.log("querySnapshot size:", querySnapshot.size);
    container.innerHTML = "";

    if (querySnapshot.empty) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("Firestore doc:", doc.id, data);
      const username = data.username || data.displayName || "Noctive User";
      const text = data.text || "";
      const createdAtText = formatCreatedAt(data.createdAt);

      const postCard = document.createElement("div");
      postCard.className = "post";
      postCard.style.background = "rgba(255,255,255,0.03)";
      postCard.style.border = "1px solid rgba(255,255,255,0.08)";
      postCard.style.borderRadius = "16px";
      postCard.style.padding = "14px";
      postCard.style.marginBottom = "12px";

      const nameEl = document.createElement("div");
      nameEl.textContent = username;
      nameEl.style.fontWeight = "700";
      nameEl.style.marginBottom = "8px";

      const textEl = document.createElement("div");
      textEl.textContent = text;
      textEl.style.lineHeight = "1.5";

      postCard.appendChild(nameEl);

      if (createdAtText) {
        const dateEl = document.createElement("div");
        dateEl.textContent = createdAtText;
        dateEl.style.fontSize = "0.85rem";
        dateEl.style.opacity = "0.7";
        dateEl.style.marginBottom = "8px";
        postCard.appendChild(dateEl);
      }

      postCard.appendChild(textEl);
      container.appendChild(postCard);
      console.log("Appended post card into #feedList:", postCard);
    });
  } catch (err) {
    console.error("Error loading posts:", err);
    container.innerHTML = "<p>Could not load posts.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadPosts);
