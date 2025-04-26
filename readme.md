# Freelancer Bid Explorer (Client-Side Version)

A static web application that allows you to explore and analyze bids on Freelancer.com projects.

## Features

- View all bids for a specific Freelancer.com project
- See bid details including amount, delivery time, and full proposal descriptions
- Download bid data in CSV or TXT format
- Entirely client-side (can be hosted on GitHub Pages)

## Setup Instructions

### Get Your API Key

1. Go to [Freelancer.com Developer Settings](https://accounts.freelancer.com/settings/develop)
2. Create a new application
3. Copy your API token

### Deployment Options

#### Option 1: GitHub Pages

1. Fork this repository
2. Go to repository Settings > Pages
3. Set Source to "main" branch
4. Click Save
5. Your site will be published at `https://yourusername.github.io/freelancer-bid-explorer/`

#### Option 2: Local Deployment

1. Clone this repository
2. Open `index.html` in your browser

## Usage

1. Enter a Freelancer.com project URL (e.g., `https://www.freelancer.com/projects/javascript/create-website-123456789`)
2. Enter your API token
3. Select output format (view in app or download as CSV/TXT)
4. Click "Get Bids" button

## Privacy & Security

⚠️ **IMPORTANT:** Your API token is used client-side to make authenticated requests to the Freelancer.com API. The token is never sent to any third-party servers, but be aware of these security considerations:

- The token is stored in memory during your browsing session
- It is included in API requests to Freelancer.com
- It is not persisted or stored anywhere

For maximum security, consider creating a limited-scope API token specifically for this application.

## Browser Compatibility

This application works with all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Troubleshooting

If you encounter issues:

1. Check that your API token is correct
2. Verify you're using a valid Freelancer.com project URL
3. Ensure the project has active bids
4. Check your browser console for any JavaScript errors

## License

MIT License
