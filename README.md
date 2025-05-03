# ExamTracker

ExamTracker is a modern web application designed to help students track their performance on past examination papers. With an intuitive terminal-inspired interface, it allows users to record, analyze, and improve their exam preparation.

![ExamTracker Screenshot](static/screenshot.png)

## Features

- **Paper Tracking**: Log your scores for individual questions on past papers
- **Subject & Exam Board Organization**: Filter papers by subject and examination board
- **Performance Analysis**: View your average scores and identify weak areas
- **PocketBase Integration**: Data is securely stored and accessed through PocketBase
- **Cloudflare Workers**: Deployed using Cloudflare's edge computing platform
- **Terminal-Inspired UI**: Clean, distraction-free interface designed for focus

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Bun](https://bun.sh/) (optional, for faster package management)
- [Cloudflare Account](https://dash.cloudflare.com/sign-up) (for deployment)
- [PocketBase](https://pocketbase.io/) (for database)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gSUz92nc/ExamTracker.git
   cd ExamTracker
   ```

2. Install dependencies:
   ```bash
   # Using npm
   npm install
   
   # Or using Bun
   bun install
   ```

3. Set up environment variables:
   - Copy `.env.template` to a new file called `.env`
   - Fill in your Cloudflare Access credentials and PocketBase admin details
   ```bash
   cp .env.template .env
   # Now edit the .env file with your credentials
   ```

4. Start the development server:
   ```bash
   # Using npm
   npm run dev
   
   # Or using Bun
   bun run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Environment Variables

The following environment variables need to be configured in your `.env` file (I have my backend behind Clouflare Zero Trust which is why I have the CF_* variables. You probably wouldn't need it depending on your setup):

- `CF_ACCESS_CLIENT_ID`: Your Cloudflare Access Client ID
- `CF_ACCESS_CLIENT_SECRET`: Your Cloudflare Access Client Secret
- `PB_EMAIL`: Your PocketBase admin email
- `PB_PASSWORD`: Your PocketBase admin password

## Usage

1. **Select a Subject**: Choose from available subjects like Computer Science, Mathematics, etc.
2. **Choose an Exam Board**: Select the relevant examination board (OCR, AQA, Edexcel, etc.)
3. **Browse Papers**: View available past papers organized by year and season
4. **Mark Your Answers**: Select a paper and record your score for each question
5. **Analyze Performance**: Track your progress and identify areas for improvement

## Project Structure

```
ExamTracker/
├── src/                     # Source code
│   ├── lib/                 # Library files and utilities
│   │   ├── pb.ts           # PocketBase client configuration
│   │   ├── pastPapers.ts    # Past paper data handling
│   │   └── validatePaperMarks.ts # Validation utilities
│   ├── routes/              # SvelteKit routes
│   │   ├── api/             # API endpoints
│   │   │   └── +server.ts   # API routes
│   │   ├── +layout.svelte   # Main layout component
│   │   └── +page.svelte     # Main page component
│   ├── app.css              # Global CSS
│   └── app.html             # HTML template
├── static/                  # Static assets
├── wrangler.toml            # Cloudflare Workers configuration
└── .env.template            # Template for environment variables
```

## Building for Production

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

## Deployment

The application is designed to work with Cloudflare Workers:

1. Make sure you have the Wrangler CLI installed:
   ```bash
   npm install -g wrangler
   ```

2. Log in to your Cloudflare account:
   ```bash
   wrangler login
   ```

3. Deploy the application:
   ```bash
   npm run deploy
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Deployed with [Cloudflare Workers](https://workers.cloudflare.com/)
- Database powered by [PocketBase](https://pocketbase.io/)
- Terminal-inspired styling based on modern command-line interfaces
