import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Eye,
  Share2,
  Bookmark,
  Trophy,
  ArrowLeft,
  Copy,
  Check,
  Calendar,
  User,
  Send,
} from "lucide-react";
import Link from "next/link";

// Mock data - will be replaced with real database query
const mockJourney = {
  id: "1",
  title: "Building a Full SaaS App with Claude in 4 Hours",
  description:
    "My journey of using AI prompts to build a complete subscription-based SaaS application, from database design to deployment. Includes all prompts and iterations I used along the way.",
  tags: ["coding", "saas", "claude", "nextjs", "stripe"],
  voteCount: 342,
  viewCount: 1250,
  createdAt: new Date(Date.now() - 3600000 * 24),
  author: {
    name: "Alex Chen",
    image: "",
    bio: "Full-stack developer & AI enthusiast",
  },
  award: { type: "daily" as const, rank: 1 },
  steps: [
    {
      id: "1",
      title: "Planning the Architecture",
      prompt: `I want to build a SaaS application for managing subscriptions. Help me plan the architecture. I need:
- User authentication
- Subscription management with Stripe
- Dashboard for users
- Admin panel

What tech stack would you recommend and how should I structure the project?`,
      result: `Based on your requirements, I recommend the following architecture:

**Tech Stack:**
- Next.js 14 with App Router
- Prisma with PostgreSQL
- NextAuth.js for authentication
- Stripe for payments
- Tailwind CSS for styling

**Project Structure:**
\`\`\`
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
├── components/
├── lib/
└── types/
\`\`\``,
      notes:
        "Claude gave me a comprehensive plan. I tweaked the folder structure slightly but kept most recommendations.",
    },
    {
      id: "2",
      title: "Database Schema Design",
      prompt: `Based on the architecture we discussed, help me create the Prisma schema for:
- Users with roles (admin, user)
- Subscriptions linked to Stripe
- Usage tracking
- Audit logs

Include all necessary relations and indexes.`,
      result: `\`\`\`prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  role          Role     @default(USER)
  stripeId      String?  @unique
  subscription  Subscription?
  usageRecords  UsageRecord[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}

model Subscription {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  stripeSubId       String   @unique
  status            String
  plan              String
  currentPeriodEnd  DateTime
}
\`\`\``,
      notes:
        "The schema was almost perfect. Added a few more fields for audit logging that weren't in the initial response.",
    },
    {
      id: "3",
      title: "Stripe Integration",
      prompt: `Now let's implement Stripe integration. I need:
1. Webhook handler for subscription events
2. Checkout session creation
3. Customer portal access

Show me the complete implementation with error handling.`,
      result: `Here's the complete Stripe integration...

**Webhook Handler (api/webhooks/stripe/route.ts):**
\`\`\`typescript
export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get("stripe-signature")!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response("Webhook Error", { status: 400 });
  }
  
  // Handle events...
}
\`\`\``,
      notes:
        "This was one of the trickier parts. Had to iterate twice to get the webhook signature verification right.",
    },
  ],
  comments: [
    {
      id: "1",
      content:
        "This is incredibly helpful! I've been wanting to build something similar. How long did the Stripe integration take you?",
      author: { name: "Sarah M.", image: "" },
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      id: "2",
      content:
        "Great journey! The database schema is clean. Have you considered adding soft deletes for compliance?",
      author: { name: "James W.", image: "" },
      createdAt: new Date(Date.now() - 3600000 * 5),
    },
  ],
};

export default function JourneyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link href="/journeys" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-100 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Journeys
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          {/* Vote Column */}
          <div className="flex flex-col items-center gap-1 pt-2">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10">
              <ArrowUp className="h-6 w-6" />
            </Button>
            <span className="text-xl font-bold text-violet-400">
              {mockJourney.voteCount}
            </span>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
              <ArrowDown className="h-6 w-6" />
            </Button>
          </div>

          {/* Title & Meta */}
          <div className="flex-1">
            {mockJourney.award && (
              <Badge variant="gold" className="mb-2">
                <Trophy className="h-3 w-3 mr-1" />
                Daily Best #{mockJourney.award.rank}
              </Badge>
            )}
            <h1 className="text-3xl font-bold text-zinc-100 mb-3">
              {mockJourney.title}
            </h1>
            <p className="text-zinc-400 mb-4">{mockJourney.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {mockJourney.tags.map((tag) => (
                <Link key={tag} href={`/tag/${tag}`}>
                  <Badge variant="secondary" className="hover:bg-zinc-700">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Author & Stats */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={mockJourney.author.image} />
              <AvatarFallback>{mockJourney.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <Link href={`/user/${mockJourney.author.name}`} className="font-medium text-zinc-100 hover:text-violet-300">
                {mockJourney.author.name}
              </Link>
              <p className="text-sm text-zinc-500">{mockJourney.author.bio}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-zinc-500">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <span>{mockJourney.viewCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span>{mockJourney.comments.length}</span>
            </div>
            <Button variant="ghost" size="icon">
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Journey Steps */}
      <div className="space-y-6 mb-12">
        <h2 className="text-xl font-semibold text-zinc-100">Journey Steps</h2>
        {mockJourney.steps.map((step, index) => (
          <Card key={step.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {index + 1}
                </span>
                <CardTitle>{step.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-violet-400">Prompt</span>
                  <Button variant="ghost" size="sm" className="h-7">
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm text-zinc-300 whitespace-pre-wrap overflow-x-auto">
                  {step.prompt}
                </pre>
              </div>

              {/* Result */}
              <div>
                <span className="text-sm font-medium text-emerald-400 mb-2 block">Result</span>
                <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm text-zinc-300 prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap">{step.result}</pre>
                </div>
              </div>

              {/* Notes */}
              {step.notes && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-sm font-medium text-amber-400 mb-1 block">💡 Notes</span>
                  <p className="text-sm text-zinc-300">{step.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comments Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({mockJourney.comments.length})
        </h2>

        {/* Comment Form */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Avatar>
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Share your thoughts or ask a question..."
                  rows={3}
                />
                <div className="flex justify-end mt-3">
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments List */}
        <div className="space-y-4">
          {mockJourney.comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={comment.author.image} />
                    <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-zinc-100">
                        {comment.author.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-zinc-300">{comment.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <Button variant="ghost" size="sm" className="h-7 text-zinc-500">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        12
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-zinc-500">
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
