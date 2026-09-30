# Travel Document & E-Ticket Generator

A modern, standalone web application extracted from the Ocean Travel platform to generate official **Agoda Hotel Booking Confirmations** and **AirAsia & VietJet E-Ticket Receipts**.

---

## 🚀 Features

### 1. 🏨 Agoda Hotel Booking
- **Official Confirmation Layout**: Exact layout, official colors, logos, and stamps matching Agoda's official hotel vouchers.
- **Multiple Destination Presets**:
  - Bangkok (*Grande Centre Point Ratchadamri*)
  - Guangzhou (*Grand Park Guangzhou*)
  - Kuala Lumpur (*THE FACE Style Hotel*)
  - Singapore (*Village Hotel Bugis*)
- **Automated Generation**:
  - Random 12-digit Booking ID generator
  - Random 10-digit Member ID generator
  - Auto-calculated free cancellation date (3 days before arrival)
- **Live Preview & Export**:
  - Live side-by-side preview as you edit
  - Download as high-resolution official PDF (`jsPDF`)
  - Save as high-resolution image (`PDF.js` / `html2canvas`)
  - Native Web Share API integration
  - Quick Generate button for one-click voucher generation

### 2. ✈️ AirAsia & VietJet E-Ticket Generator
- **Smart PDF Parser**:
  - Drag-and-drop or select Trip.com / OTA PDF itineraries.
  - Automatically parses PNR, passenger names, flight numbers, routes, dates, times, airports, and baggage allowances using `PDF.js`.
- **Multiple Airline Templates**:
  - AirAsia (Official red header, logo, baggage styling)
  - VietJet Air (Official layout and logo)
- **Multi-Passenger Support**:
  - Dynamically add or remove passengers with Adult / Child / Infant designations.
- **Manual Form Mode**:
  - Option to create custom tickets from scratch without an OTA PDF.
- **Export Options**:
  - Download official E-Ticket PDF
  - Save as PNG image
  - Share ticket directly

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, Modern ES Modules (JavaScript)
- **UI Design**: Apple-inspired clean UI styling
- **PDF & Canvas Engines**:
  - [jsPDF](https://github.com/parallax/jsPDF) & [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)
  - [PDF.js](https://mozilla.github.io/pdf.js/)
  - [html2canvas](https://html2canvas.hertzen.com/)
- **Icons**: [Font Awesome 6](https://fontawesome.com/)
- **Datepicker**: [VanillaJS Datepicker](https://mymth.github.io/vanillajs-datepicker/)

---

## 💻 How to Run Locally

Because the project uses ES Modules and local image assets, serve it with any local static HTTP server:

```bash
# Python 3
python3 -m http.server 8080

# Or with Node.js npx
npx serve .
```

Then open `http://localhost:8080` in your web browser.

---

## 🌐 Deploy to GitHub Pages

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git branch -M main
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Source**, select `Deploy from a branch`.
   - Select branch `main` and folder `/ (root)`.
   - Click **Save**.
