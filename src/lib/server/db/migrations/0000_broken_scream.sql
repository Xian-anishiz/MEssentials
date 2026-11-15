CREATE TYPE "public"."volunteer_role" AS ENUM('store_manager', 'kailangan_manager', 'megaral_manager', 'medays_manager', 'registration_manager');--> statement-breakpoint
CREATE TABLE "auth_throttle" (
	"key" text,
	"failures" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_until" timestamp with time zone,
	CONSTRAINT "auth_throttle_pkey" PRIMARY KEY("key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id_hash" text,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_pkey" PRIMARY KEY("id_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid DEFAULT gen_random_uuid(),
	"email" text NOT NULL,
	"username" text,
	"password_hash" text,
	"google_sub" text NOT NULL,
	"first_name" text,
	"middle_initial" text,
	"last_name" text,
	"student_number" text,
	"phone_number" text,
	"college" text,
	"degree_program" text,
	"avatar_key" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_enrolled" boolean DEFAULT true NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_pkey" PRIMARY KEY("id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub"),
	CONSTRAINT "users_student_number_unique" UNIQUE("student_number")
);
--> statement-breakpoint
CREATE TABLE "volunteer_roles" (
	"user_id" uuid NOT NULL,
	"role" "volunteer_role" NOT NULL,
	"granted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "volunteer_roles_pkey" PRIMARY KEY("user_id","role")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_roles" ADD CONSTRAINT "volunteer_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_roles" ADD CONSTRAINT "volunteer_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_throttle_locked_until_idx" ON "auth_throttle" USING btree ("locked_until");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_student_number_idx" ON "users" USING btree ("student_number");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "volunteer_roles_role_idx" ON "volunteer_roles" USING btree ("role");