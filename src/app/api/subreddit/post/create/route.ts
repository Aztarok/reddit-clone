import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PostValidator } from "@/lib/validators/post";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { subredditId, title, content } = PostValidator.parse(body);

        const session = await getAuthSession();

        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const subscriptionExists = await db.subscription.findFirst({
            where: {
                subredditId,
                userId: session.user.id
            }
        });

        if (!subscriptionExists) {
            return new Response("Join this community to post.", {
                status: 400
            });
        }

        await db.post.create({
            data: {
                title,
                content,
                authorId: session.user.id,
                subredditId
            }
        });

        return new Response("OK");
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response("Invalid request data passed", { status: 422 });
        }

        return new Response("Could not post, please try again later", {
            status: 500
        });
    }
}
