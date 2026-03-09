import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.LOAD_BASE_URL || 'http://localhost:8081';

export default function () {
  const health = http.get(`${BASE_URL}/api/health`);
  check(health, {
    'health endpoint available': (res) => res.status < 500,
  });

  const loginAttempt = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username: 'k6-user', password: 'wrong-password' }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(loginAttempt, {
    'login rejects invalid credentials': (res) => [400, 401].includes(res.status),
  });

  sleep(1);
}
