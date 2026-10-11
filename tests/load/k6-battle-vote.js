import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 20 },  // Ramp up to 20 concurrent users
    { duration: '30s', target: 50 },  // Ramp up to 50 concurrent users
    { duration: '30s', target: 100 }, // Peak load 100 concurrent users
    { duration: '15s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<150', 'p(99)<300'], // 95% of requests under 150ms
    http_req_failed: ['rate<0.01'],                 // Error rate < 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api/v1';

export default function () {
  // 1. Fetch next battle
  const battleRes = http.get(`${BASE_URL}/battles/next`);
  check(battleRes, {
    'battle status is 200': (r) => r.status === 200,
    'has battle payload': (r) => {
      const json = r.json();
      return json && (json.battle !== undefined || json.hasMore !== undefined);
    },
  });

  const battleData = battleRes.json();
  if (battleData && battleData.battle) {
    const battle = battleData.battle;
    const selectedStudentId = Math.random() > 0.5 ? battle.contestantA.id : battle.contestantB.id;
    const idempotencyKey = `k6-vote-${__VU}-${Date.now()}-${Math.random()}`;

    // 2. Submit vote
    const votePayload = JSON.stringify({
      selectedStudentId,
      idempotencyKey,
    });

    const voteParams = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const voteRes = http.post(`${BASE_URL}/battles/${battle.id}/vote`, votePayload, voteParams);
    check(voteRes, {
      'vote responded cleanly': (r) => r.status === 200 || r.status === 401 || r.status === 409,
    });
  }

  // 3. Fetch Leaderboard (Cached)
  const leaderboardRes = http.get(`${BASE_URL}/leaderboard`);
  check(leaderboardRes, {
    'leaderboard status is 200': (r) => r.status === 200,
  });

  sleep(0.5); // Pace next battle loop
}
