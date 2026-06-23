function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export class VoteStore {
  constructor(state) {
    this.state = state;
    this.sql = state.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS loop_votes (
        loop_slug TEXT NOT NULL,
        voter_key TEXT NOT NULL,
        value INTEGER NOT NULL CHECK (value IN (-1, 1)),
        provider TEXT NOT NULL CHECK (provider = 'github'),
        username TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (loop_slug, voter_key)
      );
      CREATE INDEX IF NOT EXISTS loop_votes_slug
        ON loop_votes(loop_slug, value);
    `);
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/votes") {
      const voterKey = url.searchParams.get("voter") || "";
      return jsonResponse({
        votes: this.counts(),
        viewerVotes: voterKey ? this.viewerVotes(voterKey) : {},
      });
    }

    const voteMatch = url.pathname.match(/^\/votes\/([a-z0-9-]+)$/);

    if (request.method === "POST" && voteMatch) {
      const body = await request.json();

      if (
        !body ||
        ![-1, 0, 1].includes(body.value) ||
        !/^github:[A-Za-z0-9_-]{1,128}$/.test(body.voterKey || "") ||
        body.provider !== "github" ||
        !body.voterKey.startsWith(`${body.provider}:`) ||
        typeof body.username !== "string" ||
        body.username.length < 1 ||
        body.username.length > 80
      ) {
        return jsonResponse(
          { error: "Invalid vote", code: "invalid_vote" },
          400,
        );
      }

      const slug = voteMatch[1];
      const now = new Date().toISOString();

      this.state.storage.transactionSync(() => {
        if (body.value === 0) {
          this.sql.exec(
            "DELETE FROM loop_votes WHERE loop_slug = ? AND voter_key = ?",
            slug,
            body.voterKey,
          );
          return;
        }

        this.sql.exec(
          `INSERT INTO loop_votes (
             loop_slug, voter_key, value, provider, username, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(loop_slug, voter_key) DO UPDATE SET
             value = excluded.value,
             provider = excluded.provider,
             username = excluded.username,
             updated_at = excluded.updated_at`,
          slug,
          body.voterKey,
          body.value,
          body.provider,
          body.username,
          now,
          now,
        );
      });

      return jsonResponse({
        slug,
        vote: body.value,
        counts: this.countForSlug(slug),
      });
    }

    return jsonResponse({ error: "Not found", code: "not_found" }, 404);
  }

  counts() {
    return Object.fromEntries(
      [...this.sql.exec(
        `SELECT
           loop_slug,
           SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) AS upvotes,
           SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END) AS downvotes,
           SUM(value) AS score
         FROM loop_votes
         GROUP BY loop_slug
         ORDER BY loop_slug`,
      )].map((row) => [row.loop_slug, normalizeCounts(row)]),
    );
  }

  countForSlug(slug) {
    const row = [...this.sql.exec(
      `SELECT
         SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) AS upvotes,
         SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END) AS downvotes,
         SUM(value) AS score
       FROM loop_votes
       WHERE loop_slug = ?`,
      slug,
    )][0];
    return normalizeCounts(row || {});
  }

  viewerVotes(voterKey) {
    return Object.fromEntries(
      [...this.sql.exec(
        "SELECT loop_slug, value FROM loop_votes WHERE voter_key = ?",
        voterKey,
      )].map((row) => [row.loop_slug, row.value]),
    );
  }
}

function normalizeCounts(row) {
  return {
    upvotes: Number(row.upvotes || 0),
    downvotes: Number(row.downvotes || 0),
    score: Number(row.score || 0),
  };
}
