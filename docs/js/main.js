let slides = document.querySelectorAll('.slide');
let currentSlide = 0;

function showNextSlide() {
  slides[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add('active');
}

setInterval(showNextSlide, 5000);

const sections = document.querySelectorAll('.section-animate');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // animate once
      }
    });
  }, { threshold: 0.2 });

  sections.forEach(section => {
    observer.observe(section);
  });

  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('show');
  });

let step = 0;
let userResponses = {};
let userNeed = ""; // buy / rent / sell

document.getElementById('chat-icon').addEventListener('click', function () {
  const chatBox = document.getElementById('chatbotBox');
  chatBox.style.display = chatBox.style.display === 'flex' ? 'none' : 'flex';

  if (step === 0) {
    askNextQuestion();
  }
});

function sendMessage(userTyped = null) {
  const input = document.getElementById("userInput");
  const chatBody = document.getElementById("chatBody");
  const userText = userTyped || input.value.trim();

  if (userText === "") return;

  const userMsg = document.createElement("div");
  userMsg.className = "user-message";
  userMsg.textContent = userText;
  chatBody.appendChild(userMsg);
  chatBody.scrollTop = chatBody.scrollHeight;

  input.value = "";

  // Store responses based on step
  if (step === 1) {
    userNeed = userText.toLowerCase();
    userResponses.need = userNeed;
  } else if (userNeed === "sell") {
    switch (step) {
      case 2: userResponses.sellType = userText; break;
      case 3: userResponses.sellLocation = userText; break;
      case 4: userResponses.sellPrice = userText; break;
      case 5: userResponses.contact = userText; break;
    }
  } else {
    switch (step) {
      case 2: userResponses.budget = userText; break;
      case 3: userResponses.location = userText; break;
      case 4: userResponses.type = userText; break;
      case 5: userResponses.contact = userText; break;
    }
  }

  setTimeout(() => {
    askNextQuestion();
  }, 600);
}

function askNextQuestion() {
  const chatBody = document.getElementById("chatBody");
  const botMsg = document.createElement("div");
  botMsg.className = "bot-message";

  step++;

  if (step === 1) {
    botMsg.innerHTML = `
      Hi! 👋 What would you like to do?<br><br>
      <button onclick="sendMessage('Buy')">🏠 Buy</button>
      <button onclick="sendMessage('Rent')">📄 Rent</button>
      <button onclick="sendMessage('Sell')">🏷️ Sell</button>
    `;
  }

  // Buy/Rent Flow
  if (userNeed === "buy" || userNeed === "rent") {
    switch (step) {
      case 2:
        botMsg.textContent = `Great! What is your budget? (e.g., ₹50L - ₹1Cr)`;
        break;
      case 3:
        botMsg.textContent = "Which location are you interested in?";
        break;
      case 4:
        botMsg.textContent = "What type of property are you looking for? (Apartment / Villa / Plot)";
        break;
      case 5:
        botMsg.textContent = "Can you please share your contact number or email?";
        break;
      case 6:
        botMsg.innerHTML = `
          Thank you! 🙌 Here's what you've shared:<br><br>
          🏠 Need: ${userResponses.need}<br>
          💰 Budget: ${userResponses.budget}<br>
          📍 Location: ${userResponses.location}<br>
          🏡 Property Type: ${userResponses.type}<br>
          📞 Contact: ${userResponses.contact}<br><br>
          Our team will reach out to you shortly!
        `;
        break;
    }
  }

  // Sell Flow
  if (userNeed === "sell") {
    switch (step) {
      case 2:
        botMsg.textContent = "What type of property are you selling? (Apartment / Plot / Commercial etc.)";
        break;
      case 3:
        botMsg.textContent = "Where is the property located?";
        break;
      case 4:
        botMsg.textContent = "What is your expected price?";
        break;
      case 5:
        botMsg.textContent = "Please share your contact number or email.";
        break;
      case 6:
        botMsg.innerHTML = `
          Thank you for sharing! 🙏 Here's the info:<br><br>
          🏷️ Selling: ${userResponses.sellType}<br>
          📍 Location: ${userResponses.sellLocation}<br>
          💰 Expected Price: ${userResponses.sellPrice}<br>
          📞 Contact: ${userResponses.contact}<br><br>
          Our sales expert will contact you soon!
        `;
        break;
    }
  }

  chatBody.appendChild(botMsg);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Restart bot logic
document.getElementById("restartBot").addEventListener("click", () => {
  const chatBody = document.getElementById("chatBody");
  chatBody.innerHTML = ""; // Clear chat
  step = 0;
  userResponses = {};
  askNextQuestion(); // Restart conversation
});
