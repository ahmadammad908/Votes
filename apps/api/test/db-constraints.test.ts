// Integration tests for database-level guarantees. Requires a migrated, disposable
// PostgreSQL pointed to by DATABASE_URL; skipped otherwise. TRUNCATEs all tables.
import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("database constraints", () => {
  let db: Client;

  beforeAll(async () => {
    db = new Client({ connectionString: url });
    await db.connect();
  });
  afterAll(async () => {
    await db.end();
  });
  beforeEach(async () => {
    await db.query(
      `TRUNCATE votes, comments, reports, consent_records, audit_logs, sessions,
                student_vote_totals, battles, students, users RESTART IDENTITY CASCADE`,
    );
  });

  const mkUser = async (email: string): Promise<string> =>
    (await db.query(`INSERT INTO users (email, password_hash) VALUES ($1, 'x') RETURNING id`, [email])).rows[0].id;

  const mkStudent = async (name: string, userId: string | null = null, approved = true): Promise<string> =>
    (
      await db.query(
        `INSERT INTO students (display_name, user_id, image_storage_key, consent_status, profile_status)
         VALUES ($1, $2, 'k', 'ACTIVE', $3::profile_status) RETURNING id`,
        [name, userId, approved ? "APPROVED" : "DRAFT"],
      )
    ).rows[0].id;

  const mkBattle = async (x: string, y: string): Promise<string> =>
    (
      await db.query(
        `INSERT INTO battles (contestant_a_id, contestant_b_id)
         VALUES (LEAST($1::uuid, $2::uuid), GREATEST($1::uuid, $2::uuid)) RETURNING id`,
        [x, y],
      )
    ).rows[0].id;

  const vote = (user: string, battle: string, student: string, key = "k".repeat(20)) =>
    db.query(
      `INSERT INTO votes (user_id, battle_id, selected_student_id, idempotency_key) VALUES ($1,$2,$3,$4)`,
      [user, battle, student, key],
    );

  async function setup() {
    const voter = await mkUser("voter@example.test");
    const a = await mkStudent("A");
    const b = await mkStudent("B");
    return { voter, a, b, battle: await mkBattle(a, b) };
  }

  it("accepts a valid vote", async () => {
    const { voter, battle, a } = await setup();
    await vote(voter, battle, a);
    const r = await db.query(`SELECT count(*)::int AS n FROM votes`);
    expect(r.rows[0].n).toBe(1);
  });

  it("rejects a second vote by the same user in the same battle", async () => {
    const { voter, battle, a, b } = await setup();
    await vote(voter, battle, a);
    await expect(vote(voter, battle, b, "z".repeat(20))).rejects.toMatchObject({ code: "23505" });
  });

  it("rejects reuse of an idempotency key by the same user", async () => {
    const { voter, battle, a, b } = await setup();
    const other = await mkBattle(a, await mkStudent("C"));
    await vote(voter, battle, a, "same-key-same-key-1");
    await expect(vote(voter, other, a, "same-key-same-key-1")).rejects.toMatchObject({ code: "23505" });
    void b;
  });

  it("rejects a selected student who is not a contestant", async () => {
    const { voter, battle } = await setup();
    const outsider = await mkStudent("Outsider");
    await expect(vote(voter, battle, outsider)).rejects.toMatchObject({ code: "23514" });
  });

  it("rejects voting for yourself", async () => {
    const u = await mkUser("self@example.test");
    const me = await mkStudent("Me", u);
    const other = await mkStudent("Other");
    const battle = await mkBattle(me, other);
    await expect(vote(u, battle, me)).rejects.toMatchObject({ code: "23514" });
  });

  it("rejects votes in a closed battle", async () => {
    const { voter, battle, a } = await setup();
    await db.query(`UPDATE battles SET status = 'CLOSED', closed_at = now() WHERE id = $1`, [battle]);
    await expect(vote(voter, battle, a)).rejects.toMatchObject({ code: "23514" });
  });

  it("rejects votes for a student whose consent was withdrawn", async () => {
    const { voter, battle, a } = await setup();
    await db.query(
      `UPDATE students SET consent_status = 'WITHDRAWN', profile_status = 'REMOVED' WHERE id = $1`,
      [a],
    );
    await expect(vote(voter, battle, a)).rejects.toMatchObject({ code: "23514" });
  });

  it("forbids APPROVED profiles without active consent", async () => {
    const { a } = await setup();
    await expect(db.query(`UPDATE students SET consent_status = 'WITHDRAWN' WHERE id = $1`, [a])).rejects.toMatchObject(
      { code: "23514" },
    );
  });

  it("forbids a battle with the same contestant twice and reversed duplicate pairs", async () => {
    const { a, b } = await setup();
    await expect(
      db.query(`INSERT INTO battles (contestant_a_id, contestant_b_id) VALUES ($1, $1)`, [a]),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(mkBattle(b, a)).rejects.toMatchObject({ code: "23505" });
  });

  it("makes votes immutable", async () => {
    const { voter, battle, a } = await setup();
    await vote(voter, battle, a);
    await expect(db.query(`DELETE FROM votes`)).rejects.toMatchObject({ code: "23001" });
    await expect(db.query(`UPDATE votes SET created_at = now()`)).rejects.toMatchObject({ code: "23001" });
  });
});
