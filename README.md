# Beverage Tracker

A Next.js application for tracking tea and coffee consumption within organizations.

## Features Implemented

### ✅ US-1: User Sign Up (COMPLETE)
- User registration with email and password
- Email validation
- Password requirements (8+ chars, 1 number, 1 special character)
- Verification email system
- Users cannot login until email is verified

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Prisma Postgres)
- **ORM:** Prisma
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Forms:** React Hook Form
- **Email:** Resend

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd personal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: A random secret key
- `RESEND_API_KEY`: Your Resend API key for sending emails
- `FROM_EMAIL`: Email address to send from

4. Start the Prisma development database:
```bash
npx prisma dev
```

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Generate Prisma Client:
```bash
npx prisma generate
```

7. Start the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── register/       # User registration endpoint
│   │       └── verify-email/   # Email verification endpoint
│   ├── signup/                 # Sign up page
│   └── verify-email/           # Email verification page
├── components/
│   └── auth/
│       └── SignUpForm.tsx      # Sign up form component
├── lib/
│   ├── db.ts                   # Prisma client
│   ├── validations.ts          # Zod schemas
│   ├── email.ts                # Email sending utilities
│   └── tokens.ts               # Token generation utilities
├── prisma/
│   └── schema.prisma           # Database schema
└── prisma.config.ts            # Prisma configuration
```

## Available Routes

- `/signup` - User registration page
- `/verify-email?token=xxx` - Email verification page
- `/api/auth/register` - Registration API endpoint (POST)
- `/api/auth/verify-email?token=xxx` - Verification API endpoint (GET)

## Development Progress

### Phase 1: Foundation (MVP Core)
- [✅] US-1: User Sign Up - COMPLETE
- [ ] US-2: Organization Creation - PENDING
- [ ] US-3: Tea Logging - PENDING
- [ ] US-4: Daily Consumption View - PENDING
- [ ] US-5: User Invitation - PENDING
- [ ] US-6: Team Dashboard - PENDING

## Testing

To test the sign-up flow:

1. Navigate to http://localhost:3000/signup
2. Fill in the registration form with:
   - A valid email address
   - A password meeting requirements (8+ chars, 1 number, 1 special char)
   - Your name
3. Submit the form
4. Check your email for the verification link
5. Click the verification link
6. You should be redirected to the login page

## License

MIT
