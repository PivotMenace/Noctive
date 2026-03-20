// index.ts

const loginFormElement = document.getElementById('loginForm') as HTMLFormElement | null;
if (loginFormElement) {
  loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    await login(username, password);
  });
}

function login(username: string, password: string) {
  throw new Error("Function not implemented.");
}
