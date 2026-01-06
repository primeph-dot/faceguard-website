# FaceGuard Application

FaceGuard is a web application that displays detection and notification data from a Supabase database. It's focused on presenting recent detections, historical records, and notifications for review and reporting.

## Features

- Recent detection notifications
- Historical detection records with export
- Simple, data-focused UI for monitoring and reporting

## Project Structure

```
faceguard-app
├── src
│   ├── client
│   │   ├── components
│   │   │   ├── Dashboard.tsx      # Main layout / navigation
│   │   │   └── FaceRecognitionStatus.tsx # Component for recognition status
│   │   ├── pages
│   │   │   └── App.tsx           # Main application component
│   │   └── styles
│   │       └── main.css          # CSS styles for the application
│   └── types
│       └── index.ts              # TypeScript interfaces and types
├── package.json                   # npm configuration file
├── tsconfig.json                  # TypeScript configuration file
└── README.md                      # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/faceguard-app.git
   cd faceguard-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. (Optional) Configure any data sources or detection pipelines that insert detection records into the Supabase database.

## Usage

Local development:

1. Install dependencies: `npm install`
2. Start the dev server: `npm start` (opens at http://localhost:3000)

Production build & deploy:

- Build: `npm run build` (outputs to `dist`)
- Deploy `dist` to a static host (Vercel, Netlify, etc.)

This project is focused on displaying detection and notification data from Supabase.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.