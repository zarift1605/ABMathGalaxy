// quizLogic.js (BM + Math version with identical logic)

// --- Firebase Initialization ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3iyKczmk97lG68Pthi_KyPlfY6ZxM9no",
  authDomain: "abmath-galaxy-new.firebaseapp.com",
  projectId: "abmath-galaxy-new",
  storageBucket: "abmath-galaxy-new.appspot.com",
  messagingSenderId: "163126177991",
  appId: "1:163126177991:web:c0562ab5bf7a50c3538ee2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Global Variables ---
let questionStartTime;
const message = document.getElementById('message');
const wrongMessage = document.getElementById('wrong-message');

// ============================
// BM SECTION
// ============================
async function awardMarks(points) {
  const user = auth.currentUser;
  if (!user) return console.error("❌ User not logged in.");

  const userRef = doc(db, "users", user.uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      await updateDoc(userRef, { totalMarks: increment(points) });
    } else {
      await setDoc(userRef, {
        name: user.displayName || "Pelajar",
        role: "student",
        totalMarks: points,
        highestBmLevel: 0
      });
    }
    console.log("✅ Mark added:", points);
  } catch (error) {
    console.error("❌ Firestore update failed:", error);
  }
}

window.goToNextQuestion = async function () {
  const currentPath = window.location.pathname.split('/').pop();
  const levelMatch = currentPath.match(/lvl(\d+)Bm/i);
  if (!levelMatch) return;

  const levelNumber = parseInt(levelMatch[1]);
  let questions = JSON.parse(localStorage.getItem(`bmLevel${levelNumber}Questions`)) || [];
  let usedQuestions = JSON.parse(localStorage.getItem(`usedBmLevel${levelNumber}`)) || [];

  const filename = currentPath;
  if (!usedQuestions.includes(filename)) usedQuestions.push(filename);
  localStorage.setItem(`usedBmLevel${levelNumber}`, JSON.stringify(usedQuestions));

  const nextQuestion = questions.find(q => {
    const qName = q.split('/').pop();
    return !usedQuestions.includes(qName);
  });

  if (nextQuestion) {
    window.location.href = nextQuestion;
    return;
  }

  alert("Tahniah! Anda telah menamatkan semua soalan bagi tahap ini!");

  // Unlock next level locally
  let highestUnlocked = parseInt(localStorage.getItem('highestUnlocked') || '1');
  if (levelNumber === highestUnlocked && highestUnlocked < 5) {
    localStorage.setItem('highestUnlocked', highestUnlocked + 1);
  }

  // Update Firestore highest BM level
  const user = auth.currentUser;
  if (user) {
    const userRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(userRef);
      const prevLevel = docSnap.exists() ? docSnap.data().highestBmLevel ?? 0 : 0;
      if (levelNumber > prevLevel) {
        await updateDoc(userRef, { highestBmLevel: levelNumber });
        console.log(`⭐ BM Highest Level Updated: ${levelNumber}`);
      }
    } catch (err) {
      console.error("❌ Gagal update highestBmLevel:", err);
    }
  }

  setTimeout(() => {
    window.location.href = "selectLvl.html";
  }, 800);
};

// ============================
// MATH SECTION (Fully Synced with BM)
// ============================
async function awardMarksMath(points) {
  const user = auth.currentUser;
  if (!user) return console.error("❌ User not logged in.");

  const userRef = doc(db, "users", user.uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      await updateDoc(userRef, { mathMarks: increment(points) });
    } else {
      await setDoc(userRef, {
        name: user.displayName || "Pelajar",
        role: "student",
        totalMarks: 0,
        highestBmLevel: 0,
        mathMarks: points,
        highestMathLevel: 0
      });
    }
    console.log("✅ Math Mark added:", points);
  } catch (error) {
    console.error("❌ Firestore update failed (Math):", error);
  }
}

window.goToNextQuestionMath = async function () {
  const currentPath = window.location.pathname.split('/').pop(); // filename only
  const levelMatch = currentPath.match(/lvl(\d+)Math/i);
  if (!levelMatch) return;

  const levelNumber = parseInt(levelMatch[1]);

  let questions = JSON.parse(localStorage.getItem(`mathLevel${levelNumber}Questions`)) || [];
  let usedQuestions = JSON.parse(localStorage.getItem(`usedMathLevel${levelNumber}`)) || [];

  const filename = currentPath; // filename only
  if (!usedQuestions.includes(filename)) usedQuestions.push(filename);
  localStorage.setItem(`usedMathLevel${levelNumber}`, JSON.stringify(usedQuestions));

  const nextQuestion = questions.find(q => {
    const qName = q.split('/').pop(); // compare filenames only
    return !usedQuestions.includes(qName);
  });

  if (nextQuestion) {
    window.location.href = nextQuestion;
    return;
  }

  // All questions done
  alert("Tahniah! Anda telah menamatkan semua soalan Matematik bagi tahap ini!");

  // Unlock next level locally
  let highestUnlocked = parseInt(localStorage.getItem('highestUnlockedMath') || '1');
  if (levelNumber === highestUnlocked && highestUnlocked < 5) {
    localStorage.setItem('highestUnlockedMath', highestUnlocked + 1);
  }

  // Update Firestore highest Math level
  const user = auth.currentUser;
  if (user) {
    const userRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(userRef);
      const prevLevel = docSnap.exists() ? docSnap.data().highestMathLevel ?? 0 : 0;
      if (levelNumber > prevLevel) {
        await updateDoc(userRef, { highestMathLevel: levelNumber });
        console.log(`⭐ Math Highest Level Updated: ${levelNumber}`);
      }
    } catch (err) {
      console.error("❌ Gagal update highestMathLevel:", err);
    }
  }

  // Go back to level select
  setTimeout(() => {
    window.location.href = "selectLvl.html";
  }, 800);
};

// ============================
// ANSWER CHECKING (BM + Math unified)
// ============================
window.checkAnswer = function (target, answer, correct, isMath = false) {
  const isDragDrop = target.classList.contains("dropzone");
  const elapsed = ((Date.now() - questionStartTime) / 1000).toFixed(1);

  if (answer === correct) {
    let points = 0;
    if (elapsed <= 2) points = 15;
    else if (elapsed <= 5) points = 10;
    else if (elapsed <= 10) points = 5;
    else points = 2;

    message.style.display = "block";
    wrongMessage.style.display = "none";
    message.textContent = `⏱ Masa diambil: ${elapsed}s. ✅ Betul! (+${points} markah)`;

    if (isMath) awardMarksMath(points);
    else awardMarks(points);

    if (isDragDrop) {
      target.textContent = "✅ Betul!";
      target.style.background = "rgba(0,255,204,0.2)";
      document.querySelectorAll(".choice").forEach(c => c.setAttribute("draggable", false));
    } else {
      document.querySelectorAll(".choice-btn").forEach(btn => btn.disabled = true);
      target.classList.add("correct");
    }

    // Countdown to next question
    let countdown = 3;
    const interval = setInterval(() => {
      if (countdown > 0) {
        message.textContent = `⏱ Masa diambil: ${elapsed}s. ✅ Betul! (+${points} markah) Soalan seterusnya dalam... ${countdown}`;
        countdown--;
      } else {
        clearInterval(interval);
        if (isMath) window.goToNextQuestionMath();
        else window.goToNextQuestion();
      }
    }, 1000);

  } else {
    wrongMessage.style.display = "block";
    if (isDragDrop) {
      target.style.background = "rgba(255,0,0,0.3)";
      target.textContent = "❌ Salah! Cuba lagi.";
      setTimeout(() => {
        wrongMessage.style.display = "none";
        target.style.background = "";
        target.textContent = "Letakkan jawapan di sini";
      }, 1000);
    } else {
      target.classList.add("wrong");
      setTimeout(() => {
        target.classList.remove("wrong");
        wrongMessage.style.display = "none";
      }, 1000);
    }
  }
};

// --- Timer Start ---
window.addEventListener("load", () => {
  questionStartTime = Date.now();
});
