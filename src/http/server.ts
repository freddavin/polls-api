import { PrismaClient } from "@prisma/client";
import fastify from "fastify";
import { z } from "zod";

const app = fastify();
const port = 3000;

const prisma = new PrismaClient();

app.post("/polls", async (req, res) => {
  const createPollBody = z.object({
    title: z.string(),
  });
  const { title } = createPollBody.parse(req.body);

  const poll = await prisma.poll.create({ data: { title } });

  return res.status(201).send({ pollId: poll.id });
});

app.listen({ port }).then(() => {
  console.log(`Listening on port ${port}`);
});
