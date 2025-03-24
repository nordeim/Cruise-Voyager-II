CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"cruise_id" integer NOT NULL,
	"booking_date" timestamp DEFAULT now() NOT NULL,
	"departure_date" timestamp NOT NULL,
	"return_date" timestamp NOT NULL,
	"number_of_guests" integer NOT NULL,
	"cabin_type" text NOT NULL,
	"total_price" double precision NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_client_secret" text,
	"special_requests" text,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"guest_details" json
);
--> statement-breakpoint
CREATE TABLE "cruises" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"destination" text NOT NULL,
	"image_url" text NOT NULL,
	"cruise_line" text NOT NULL,
	"ship_name" text NOT NULL,
	"departure_port" text NOT NULL,
	"departure_date" timestamp NOT NULL,
	"return_date" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"price_per_person" double precision NOT NULL,
	"sale_price" double precision,
	"is_best_seller" boolean DEFAULT false,
	"is_special_offer" boolean DEFAULT false,
	"amenities" text[],
	"cabin_types" text[]
);
--> statement-breakpoint
CREATE TABLE "email_verification" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"cruise_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "email_verification" ADD CONSTRAINT "email_verification_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;