import z from 'zod';
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { prisma } from '../../libs/prisma';

export const voteOnPoll = async (app: FastifyInstance) => {
  app.post('/polls/:id/votes', async (req, res) => {
    const votesOnPollBody = z.object({
      chosenOptionId: z.string().uuid(),
    });

    const votesOnPollParams = z.object({
      id: z.string().uuid(),
    });

    const { chosenOptionId } = votesOnPollBody.parse(req.body);
    const { id: pollId } = votesOnPollParams.parse(req.params);

    let { sessionId } = req.cookies;

    if (sessionId) {
      const previousVote = await prisma.vote.findUnique({
        where: { sessionId_pollId: { sessionId, pollId } },
      });

      if (previousVote && previousVote.pollOptionId !== chosenOptionId) {
        await prisma.vote.delete({ where: { id: previousVote.id } });
      } else if (previousVote) {
        return res.status(400).send({
          message: 'You have already voted for this option in this poll',
        });
      }
    }

    if (!sessionId) {
      sessionId = randomUUID();

      res.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
        signed: true,
      });
    }

    await prisma.vote.create({
      data: { sessionId, pollOptionId: chosenOptionId, pollId },
    });

    return res.status(201).send({ sessionId });
  });
};
