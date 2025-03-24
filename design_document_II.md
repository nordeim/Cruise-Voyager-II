# Cruise Voyager II - Technical Design Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Database Design](#database-design)
7. [Authentication & Authorization](#authentication--authorization)
8. [Payment Integration](#payment-integration)
9. [Email Service](#email-service)
10. [UI/UX Components](#uiux-components)
11. [API Design](#api-design)
12. [Performance Considerations](#performance-considerations)
13. [Security Measures](#security-measures)
14. [Deployment Architecture](#deployment-architecture)
15. [Development Workflow](#development-workflow)

## 1. Project Overview

Cruise Voyager II is a modern, full-stack web application designed for cruise booking and management. The application provides a comprehensive platform for users to browse, book, and manage cruise vacations. It features a responsive user interface, secure payment processing, real-time availability checking, and a robust booking management system.

### Key Features
- Cruise listing and detailed viewing
- Advanced search and filtering
- Secure booking system
- Payment processing with Stripe
- User account management
- Booking history and management
- Email notifications
- Responsive design for all devices
- Real-time availability updates

## 2. System Architecture

The application follows a modern client-server architecture with clear separation of concerns:

```
Cruise Voyager II
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utility functions and hooks
│   │   └── hooks/        # Custom React hooks
├── server/                # Backend Express application
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database models and queries
│   ├── auth.ts          # Authentication logic
│   └── email.ts         # Email service
└── shared/               # Shared types and utilities
```

The architecture implements:
- Clear separation between frontend and backend
- RESTful API design principles
- Type safety across the stack with TypeScript
- Modular component design
- Centralized state management
- Secure authentication flow
- Scalable database design

## 3. Technology Stack

### Frontend
- React 18.3.1
- TypeScript
- Vite for build tooling
- TanStack Query for data fetching
- Tailwind CSS for styling
- Radix UI for accessible components
- Wouter for routing
- React Hook Form for form management
- Zod for validation

### Backend
- Node.js
- Express.js
- TypeScript
- Drizzle ORM
- PostgreSQL (via Neon Database)
- Passport.js for authentication
- Express Session for session management
- Nodemailer for email services

### Development Tools
- ESBuild for server bundling
- Drizzle Kit for database migrations
- TypeScript for type checking
- Tailwind for styling
- PostCSS for CSS processing

## 4. Frontend Architecture

### Component Structure
The frontend follows a component-based architecture with clear hierarchy:

```typescript
// App.tsx - Main Application Structure
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### Routing System
The application uses Wouter for client-side routing with the following structure:

```typescript
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/cruises" component={Cruises} />
      <Route path="/cruises/:id" component={CruiseDetails} />
      <Route path="/booking/:id" component={Booking} />
      <Route path="/checkout/:bookingId" component={Checkout} />
      <Route path="/booking-confirmation/:id" component={BookingConfirmation} />
      <Route path="/profile" component={Profile} />
      <Route path="/my-bookings" component={MyBookings} />
      <Route component={NotFound} />
    </Switch>
  );
}
```

### State Management
- TanStack Query for server state management
- React Context for global application state
- Local component state for UI-specific state
- Form state managed by React Hook Form

### UI Component Library
The application uses a comprehensive set of UI components built on Radix UI:
- Accessible by default
- Customizable with Tailwind CSS
- Consistent design language
- Mobile-responsive
- Theme-aware

## 5. Backend Architecture

### Server Setup
The Express server is configured with middleware for security, logging, and request handling:

```typescript
// server/index.ts
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  // ... logging logic
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});
```

### API Structure
The backend implements a RESTful API with the following key endpoints:

```typescript
// Example API endpoints
GET    /api/cruises           // List all cruises
GET    /api/cruises/:id       // Get cruise details
POST   /api/bookings          // Create new booking
GET    /api/bookings/:id      // Get booking details
POST   /api/auth/login        // User login
POST   /api/auth/register     // User registration
GET    /api/user/profile      // Get user profile
PATCH  /api/user/profile      // Update user profile
```

## 6. Database Design

### Schema Design
The database uses Drizzle ORM with PostgreSQL, implementing the following core tables:

```typescript
// Example schema definitions
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const cruises = pgTable('cruises', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  price: decimal('price').notNull(),
  capacity: integer('capacity').notNull(),
  imageUrl: text('image_url'),
});

const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  cruiseId: integer('cruise_id').references(() => cruises.id),
  status: text('status').notNull(),
  passengerCount: integer('passenger_count').notNull(),
  totalPrice: decimal('total_price').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Data Access Layer
The application uses Drizzle ORM for type-safe database operations:

```typescript
// Example database queries
export async function getCruiseById(id: number) {
  return db.query.cruises.findFirst({
    where: eq(cruises.id, id),
    with: {
      amenities: true,
      itinerary: true,
    },
  });
}

export async function createBooking(data: NewBooking) {
  return db.insert(bookings).values(data).returning();
}
```

## 7. Authentication & Authorization

### Authentication Flow
The application uses Passport.js with local strategy for authentication:

```typescript
// Authentication middleware
passport.use(new LocalStrategy(
  async (email, password, done) => {
    try {
      const user = await getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));
```

### Session Management
Sessions are managed using Express Session with PostgreSQL store:

```typescript
app.use(session({
  store: new PgStore({
    conString: process.env.DATABASE_URL,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));
```

## 8. Payment Integration

### Stripe Integration
The application integrates with Stripe for secure payment processing:

```typescript
// Payment processing endpoint
app.post('/api/payments/process', async (req, res) => {
  const { bookingId, paymentMethodId } = req.body;
  
  try {
    const booking = await getBookingById(bookingId);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.totalPrice * 100, // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
    });
    
    await updateBookingStatus(bookingId, 'paid');
    res.json({ success: true, paymentIntent });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## 9. Email Service

### Email Templates
The application uses Nodemailer for sending transactional emails:

```typescript
// Email service implementation
export async function sendBookingConfirmation(booking: Booking) {
  const template = await compileEmailTemplate('booking-confirmation', {
    booking,
    user: booking.user,
    cruise: booking.cruise,
  });
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: booking.user.email,
    subject: 'Booking Confirmation',
    html: template,
  });
}
```

## 10. UI/UX Components

### Component Library
The application uses a custom component library built on Radix UI and Tailwind:

```typescript
// Example component implementation
export function Button({ 
  variant = 'primary',
  size = 'medium',
  children,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors',
        {
          'bg-primary text-white hover:bg-primary-dark': variant === 'primary',
          'bg-secondary text-primary hover:bg-secondary-dark': variant === 'secondary',
        },
        {
          'px-4 py-2 text-sm': size === 'small',
          'px-6 py-3 text-base': size === 'medium',
          'px-8 py-4 text-lg': size === 'large',
        }
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Form Components
Custom form components with validation:

```typescript
// Example form component
export function BookingForm({ cruiseId }: BookingFormProps) {
  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      passengerCount: 1,
      specialRequests: '',
    },
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="passengerCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Passengers</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Additional form fields */}
      </form>
    </Form>
  );
}
```

## 11. API Design

### RESTful Endpoints
The API follows REST principles with consistent error handling:

```typescript
// Example API route implementation
router.get('/api/cruises', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'startDate' } = req.query;
    const offset = (page - 1) * limit;
    
    const cruises = await db.query.cruises.findMany({
      limit,
      offset,
      orderBy: sort,
      with: {
        amenities: true,
      },
    });
    
    const total = await db.query.cruises.count();
    
    res.json({
      data: cruises,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cruises' });
  }
});
```

## 12. Performance Considerations

### Frontend Optimization
- Code splitting with dynamic imports
- Image optimization
- Caching strategies
- Lazy loading of components
- Memoization of expensive computations

### Backend Optimization
- Database query optimization
- Connection pooling
- Response caching
- Rate limiting
- Compression middleware

## 13. Security Measures

### Security Implementation
The application implements various security measures:

```typescript
// Security middleware setup
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
}));
```

### Data Validation
All input data is validated using Zod schemas:

```typescript
const bookingSchema = z.object({
  cruiseId: z.number(),
  passengerCount: z.number().min(1).max(10),
  specialRequests: z.string().optional(),
  paymentMethodId: z.string(),
});
```

## 14. Deployment Architecture

### Production Setup
The application is configured for production deployment:

```typescript
// Production server configuration
if (process.env.NODE_ENV === 'production') {
  app.use(compression());
  app.use(express.static('dist/client'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
  });
}
```

## 15. Development Workflow

### Build Process
The application uses Vite for frontend and ESBuild for backend:

```json
{
  "scripts": {
    "dev": "tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

This technical design document provides a comprehensive overview of the Cruise Voyager II application architecture, implementation details, and best practices. The document serves as a reference for developers working on the project and provides insights into the technical decisions and patterns used throughout the application.

The application is built with modern web technologies and follows industry best practices for security, performance, and user experience. The modular architecture allows for easy maintenance and scalability, while the comprehensive testing strategy ensures reliability and stability.
