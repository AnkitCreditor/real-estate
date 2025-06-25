// Sidebar Toggle for Mobile
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('active');
}

// Wait until DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  // Revenue Chart (Bar)
  const ctxRevenue = document.getElementById('revenueChart');
  if (ctxRevenue) {
    new Chart(ctxRevenue.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        datasets: [
          {
            label: 'Deals',
            data: [120, 140, 180, 210, 250, 300, 330, 310, 280, 240, 180, 150],
            backgroundColor: '#d4af37'
          },
          {
            label: 'Deal Value ($)',
            data: [100, 120, 160, 190, 240, 280, 310, 290, 260, 220, 170, 130],
            backgroundColor: '#f7e7b7'
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  // Pie Chart (Status)
  const ctxPie = document.getElementById('myPieChart');
  if (ctxPie) {
    new Chart(ctxPie.getContext('2d'), {
      type: 'pie',
      data: {
        labels: ['Luxury Villas', 'Condos', 'Investments'],
        datasets: [{
          label: 'Distribution',
          data: [40, 30, 30],
          backgroundColor: [
            'rgba(212, 175, 55, 0.8)',   // Gold
            'rgba(0, 123, 255, 0.75)',   // Blue
            'rgba(255, 99, 132, 0.75)'   // Pink
          ],
          borderColor: 'rgba(255, 255, 255, 0.9)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#111',
              font: {
                size: 14,
                weight: '500'
              }
            }
          },
          title: {
            display: true,
            text: 'Luxury Property Investment Focus',
            color: '#111',
            font: {
              size: 18,
              weight: 'bold'
            }
          }
        }
      }
    });
  }

  // Transaction Chart
  const transChart = document.getElementById('transactionChart');
  if (transChart) {
    new Chart(transChart.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Monthly Revenue ($K)',
          data: [320, 400, 380, 520, 450, 600],
          fill: true,
          tension: 0.4,
          backgroundColor: 'rgba(212, 175, 55, 0.2)',
          borderColor: '#d4af37',
          borderWidth: 2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: '#333'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#666'
            }
          },
          x: {
            ticks: {
              color: '#666'
            }
          }
        }
      }
    });
  }
});

// Toggle View/Hide for Client Detail Section
function toggleClientDetails(button) {
  const card = button.closest('.client-card');
  const nextDetail = card.nextElementSibling;
  if (nextDetail && nextDetail.classList.contains('client-detail')) {
    nextDetail.classList.toggle('hidden');
    button.textContent = nextDetail.classList.contains('hidden') ? 'View' : 'Hide';
  }
}

function toggleAccountEdit(button) {
  const form = button.closest('.account-profile').querySelector('.account-form');
  const inputs = form.querySelectorAll('input:not([type="email"]), textarea');
  const saveBtn = form.querySelector('.save-btn');

  const isEditing = button.textContent === "Save";
  
  inputs.forEach(input => input.disabled = isEditing);
  saveBtn.classList.toggle('hidden', isEditing);
  button.textContent = isEditing ? "Edit" : "Save";
}

function saveAccountChanges(event) {
  event.preventDefault();
  alert("Changes saved! (Demo only)");
  const form = event.target;
  const inputs = form.querySelectorAll('input:not([type="email"]), textarea');
  inputs.forEach(input => input.disabled = true);
  form.querySelector('.save-btn').classList.add('hidden');

  // Switch button text back to Edit
  const editBtn = form.closest('.account-profile').querySelector('.edit-btn');
  if (editBtn) editBtn.textContent = "Edit";
}

function enableAccountEdit() {
  const form = document.querySelector('.account-form');
  const inputs = form.querySelectorAll('input:not([readonly]), textarea');
  const saveBtn = form.querySelector('.save-btn');

  inputs.forEach(input => input.disabled = false);
  saveBtn.classList.remove('hidden');
}

// Preview Banner
document.getElementById('banner-upload').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    document.getElementById('banner-preview').src = URL.createObjectURL(file);
  }
});

// Preview Profile
document.getElementById('profile-upload').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    document.getElementById('profile-preview').src = URL.createObjectURL(file);
  }
});
