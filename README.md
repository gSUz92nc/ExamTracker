# ExamTracker

## Database Setup (D1) - WIP (copy pasted for future reference)
This project uses Cloudflare D1 as its database. The schema includes a `scores` table with a text ID as the primary key and a score column (integer) with a default value of 0.

### Setting up D1 Database
1. Create your D1 database using Wrangler CLI:
   ```bash
   npx wrangler d1 create scores-db
   ```
   This will generate a database ID that you'll need for the next step.

2. Update your `wrangler.toml` with the actual database ID:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "scores-db"
   database_id = "<your-database-id>" # Replace with your actual D1 database ID
   ```

3. Apply the schema to your D1 database:
   ```bash
   npx wrangler d1 execute scores-db --file=./migrations/schema.sql
   ```

### Local Development with D1
To test locally with D1 database access:
```bash
npx wrangler pages dev -- npm run dev
```

### Using the Database
The project includes database utilities in `src/lib/db.ts` to interact with the D1 database:

```typescript
// Get a specific score
const score = await getScore('user123');

// Get all scores
const allScores = await getAllScores();

// Save or update a score
await saveScore('user123', 42);
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

### Deploying with D1
To deploy your application with D1 to Cloudflare Pages:
```bash
npx wrangler pages deploy .svelte-kit/cloudflare
```

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
