import { FastifyInstance } from 'fastify';
import z from 'zod';
import { prisma } from '../../libs/prisma';

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
      return res.status(404).send({ message: 'Poll not found.' });
    }

    return res.status(200).send(poll);
  });
};
