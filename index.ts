// index.ts

async function login(username: string, password: string) {
  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (data.success) {
    alert('Login successful!');
  } else {
    alert('Login failed: ' + data.message);
  }
}

const loginForm = document.getElementById('loginForm') as HTMLFormElement | null;
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    await login(username, password);
  });
}