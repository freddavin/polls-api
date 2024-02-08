import { FastifyInstance } from 'fastify';
import z from 'zod';
import { prisma } from '../../libs/prisma';
import { redis } from '../../libs/redis';

export const normalizeResults = (results: string[]) => {
  return results.reduce((finalObj, field, index) => {
    if (index % 2 === 0) {
      Object.assign(finalObj, { [field]: Number(results[index + 1]) });
    }
    return finalObj;
  }, {} as Record<string, number>);
};

export const getPoll = async (app: FastifyInstance) => {
  app.get('/polls/:id', async (req, res) => {
    const getPollParams = z.object({
      id: z.string().uuid(),
    });

    const { id } = getPollParams.parse(req.params);

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: { options: { select: { id: true, title: true } } },
    });

    if (!poll) {
      return res.status(400).send({ message: 'Poll not found.' });
    }

    const results = await redis.zrange(poll.id, 0, -1, 'WITHSCORES');

    const votes = normalizeResults(results);

    return res.status(200).send({
      ...poll,
      options: poll.options.map((opt) => {
        return { ...opt, votes: votes[opt.id] };
      }),
    });
  });
};
