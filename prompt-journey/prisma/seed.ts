import "dotenv/config";
import { db } from "../src/lib/db";
import * as bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting seed...");

  // Create test users
  const password = await bcrypt.hash("password123", 10);
  
  const users = await Promise.all([
    db.user.upsert({
      where: { email: "alex@example.com" },
      update: {},
      create: {
        email: "alex@example.com",
        name: "Alex Chen",
        password,
        bio: "Full-stack developer & AI enthusiast",
      },
    }),
    db.user.upsert({
      where: { email: "sarah@example.com" },
      update: {},
      create: {
        email: "sarah@example.com",
        name: "Sarah Miller",
        password,
        bio: "Product manager turned prompt engineer",
      },
    }),
    db.user.upsert({
      where: { email: "james@example.com" },
      update: {},
      create: {
        email: "james@example.com",
        name: "James Wright",
        password,
        bio: "Designer exploring AI creativity",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create journeys
  const journeys = await Promise.all([
    db.journey.create({
      data: {
        title: "Building a Full SaaS App with Claude in 4 Hours",
        description: "My journey of using AI prompts to build a complete subscription-based SaaS application, from database design to deployment.",
        content: JSON.stringify([
          {
            id: "1",
            title: "Planning the Architecture",
            prompt: "I want to build a SaaS application for managing subscriptions. Help me plan the architecture...",
            result: "Based on your requirements, I recommend Next.js 14 with App Router, Prisma with PostgreSQL...",
            notes: "Claude gave me a comprehensive plan. I tweaked the folder structure slightly."
          },
          {
            id: "2",
            title: "Database Schema Design",
            prompt: "Help me create the Prisma schema for users with roles, subscriptions linked to Stripe...",
            result: "Here's the complete Prisma schema with User, Subscription, and UsageRecord models...",
            notes: "Added a few more fields for audit logging."
          }
        ]),
        tags: "coding,saas,claude,nextjs",
        voteCount: 342,
        viewCount: 1250,
        published: true,
        authorId: users[0].id,
      },
    }),
    db.journey.create({
      data: {
        title: "From Idea to MVP: AI-Powered Content Calendar",
        description: "How I used a series of prompts to design, develop, and launch a content calendar tool.",
        content: JSON.stringify([
          {
            id: "1",
            title: "Defining Requirements",
            prompt: "I need to build a content calendar for social media managers...",
            result: "Great idea! Here's how we can structure the features...",
            notes: "The AI helped me think through edge cases I hadn't considered."
          }
        ]),
        tags: "productivity,chatgpt,no-code,business",
        voteCount: 289,
        viewCount: 980,
        published: true,
        authorId: users[1].id,
      },
    }),
    db.journey.create({
      data: {
        title: "Creating a Brand Identity System with Midjourney + GPT",
        description: "A complete walkthrough of creating a cohesive brand identity including logo concepts.",
        content: JSON.stringify([
          {
            id: "1",
            title: "Brand Discovery",
            prompt: "I'm creating a brand for a sustainable fashion startup...",
            result: "Let's start with your brand values and target audience...",
            notes: "GPT helped me articulate the brand story beautifully."
          }
        ]),
        tags: "design,branding,midjourney,creative",
        voteCount: 256,
        viewCount: 890,
        published: true,
        authorId: users[2].id,
      },
    }),
  ]);

  console.log(`✅ Created ${journeys.length} journeys`);

  // Create one-shots
  const oneShots = await Promise.all([
    db.oneShot.create({
      data: {
        title: "Code Review Assistant",
        prompt: `Review this code for potential issues, security vulnerabilities, and improvements. Focus on:
1. Performance optimizations
2. Security concerns
3. Code readability
4. Best practices

[Paste your code here]

Provide specific suggestions with code examples.`,
        result: "Provides detailed code analysis with specific improvement suggestions.",
        category: "Coding",
        copyCount: 2341,
        authorId: users[0].id,
      },
    }),
    db.oneShot.create({
      data: {
        title: "Blog Post Generator",
        prompt: `Write a comprehensive blog post about [TOPIC] that:
- Hooks the reader in the first paragraph
- Uses subheadings for easy scanning
- Includes practical examples
- Has a clear call-to-action
- Is SEO-optimized for the keyword: [KEYWORD]`,
        result: "Generates a well-structured, engaging blog post ready for publishing.",
        category: "Writing",
        copyCount: 1876,
        authorId: users[1].id,
      },
    }),
    db.oneShot.create({
      data: {
        title: "UI Color Palette Generator",
        prompt: `Create a modern UI color palette for a [TYPE] application with:
- Primary color based on: [BASE COLOR or MOOD]
- Secondary and accent colors
- Semantic colors (success, warning, error, info)
- Dark mode variants
- CSS custom properties format`,
        category: "Design",
        copyCount: 1543,
        authorId: users[2].id,
      },
    }),
  ]);

  console.log(`✅ Created ${oneShots.length} one-shots`);

  // Create some comments
  await db.comment.create({
    data: {
      content: "This is incredibly helpful! How long did the Stripe integration take you?",
      authorId: users[1].id,
      journeyId: journeys[0].id,
    },
  });

  await db.comment.create({
    data: {
      content: "Great journey! The database schema is clean. Have you considered adding soft deletes?",
      authorId: users[2].id,
      journeyId: journeys[0].id,
    },
  });

  console.log(`✅ Created comments`);

  // Create daily awards
  const today = new Date().toISOString().split("T")[0];
  await Promise.all([
    db.award.upsert({
      where: { type_period_rank: { type: "daily", period: today, rank: 1 } },
      update: { journeyId: journeys[0].id },
      create: { type: "daily", period: today, rank: 1, journeyId: journeys[0].id },
    }),
    db.award.upsert({
      where: { type_period_rank: { type: "daily", period: today, rank: 2 } },
      update: { journeyId: journeys[1].id },
      create: { type: "daily", period: today, rank: 2, journeyId: journeys[1].id },
    }),
    db.award.upsert({
      where: { type_period_rank: { type: "daily", period: today, rank: 3 } },
      update: { journeyId: journeys[2].id },
      create: { type: "daily", period: today, rank: 3, journeyId: journeys[2].id },
    }),
  ]);

  console.log(`✅ Created awards`);

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
