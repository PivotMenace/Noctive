import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadPosts() {
  const container = document.getElementById("firebasePosts");

  if (!container) return;

  container.innerHTML = "Loading...";

  try {
    const querySnapshot = await getDocs(collection(db, "Posts"));

    container.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      const div = document.createElement("div");
      div.textContent = data.text;

      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "Error loading posts";
  }
}

document.addEventListener("DOMContentLoaded", loadPosts);