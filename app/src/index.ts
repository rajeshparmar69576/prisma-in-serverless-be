// /**
//  * Welcome to Cloudflare Workers! This is your first worker.
//  *
//  * - Run `npm run dev` in your terminal to start a development server
//  * - Open a browser tab at http://localhost:8787/ to see your worker in action
//  * - Run `npm run deploy` to publish your worker
//  *
//  * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
//  * `Env` object can be regenerated with `npm run cf-typegen`.
//  *
//  * Learn more at https://developers.cloudflare.com/workers/
//  */

// export default {
// 	async fetch(request, env, ctx): Promise<Response> {
// 		return new Response('Hello World!');
// 	},
// } satisfies ExportedHandler<Env>;




import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

// Define environment interface for Cloudflare Worker
export interface Env {
  DATABASE_URL: string;
}

// Cloudflare Worker handler
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Initialize Prisma client with Accelerate
    const prisma = new PrismaClient({
      datasourceUrl: env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Log the request into the database
    const response = await prisma.log.create({
      data: {
        level: 'Info',
        message: `${request.method} ${request.url}`,
        meta: {
          headers: JSON.stringify(Object.fromEntries(request.headers)),
        },
      },
    });
    console.log(JSON.stringify(response))

    // Fetch the last 20 log entries from the database
    const logs = await prisma.log.findMany({
      take: 20,
      orderBy: {
        id: 'desc',
      },
    });

    // Return the logs as a JSON response
    return new Response(JSON.stringify(logs, null, 2), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
} satisfies ExportedHandler<Env>;
