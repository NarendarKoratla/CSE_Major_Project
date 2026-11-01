# NutriVision — AI-Powered Malnutrition Screening System

NutriVision is a final-year CSE project focused on supporting early malnutrition-risk screening using anthropometric inputs. It provides a web interface for presenting screening information and nutrition guidance.

> **Important:** This is an educational screening project, not a medical diagnostic tool. Results should not replace assessment by a qualified healthcare professional.

## Goals
- Support preliminary nutritional-risk screening.
- Present assessment information in an understandable interface.
- Provide nutrition awareness and educational guidance.
- Offer dashboard-style analytics and downloadable reports where implemented.

## Modules
- Anthropometric data input
- Malnutrition-risk prediction
- Nutrition recommendations
- Rule-based nutrition chatbot
- Analytics dashboard
- PDF report generation

The available functionality depends on the current implementation and any separately configured prediction service. Do not use sample results as medical advice.

## Technology
The frontend package uses React 18, TypeScript, Vite, Tailwind CSS, Recharts, React Router, shadcn/ui, and Radix UI components.

## Run locally
### Prerequisites
- Node.js (LTS recommended)
- npm

### Setup
```bash
git clone https://github.com/NarendarKoratla/CSE_Major_Project.git
cd CSE_Major_Project
npm install
npm run dev
```
Vite prints a local development URL in the terminal (commonly `http://localhost:5173`). Open it in your browser.

### Validate the frontend
```bash
npm run lint
npm run build
npm run preview
```
If a feature depends on a separate backend or machine-learning service, configure and run that service separately. The frontend `package.json` alone does not document backend deployment or model setup.

## Responsible use
- Enter only data you are authorized to use.
- Do not commit personal, identifiable, or real patient information.
- Treat results as preliminary screening support, not a diagnosis.
- Validate the system with qualified domain experts before real-world healthcare use.

## Author
**Narendar Koratla**  
[GitHub](https://github.com/NarendarKoratla) · [LinkedIn](https://www.linkedin.com/in/narendar-koratla-63569b384/)
