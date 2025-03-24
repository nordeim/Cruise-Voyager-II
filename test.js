import fetch from 'node-fetch';

async function testAuth() {
  try {
    // Test registration
    const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User',
      }),
    });

    console.log('Registration response:', await registerResponse.json());

    // Test login
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123',
      }),
    });

    console.log('Login response:', await loginResponse.json());

    // Test password reset request
    const resetResponse = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });

    console.log('Password reset response:', await resetResponse.json());
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth(); 