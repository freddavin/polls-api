import z from 'zod';
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { prisma } from '../../libs/prisma';
import { redis } from '../../libs/redis';
import { voting } from '../../utils';

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

        const votes = await redis.zincrby(
          pollId,
          -1,
          previousVote.pollOptionId
        );

        voting.publish(pollId, {
          pollOptionId: previousVote.pollOptionId,
          votes: Number(votes),
        });
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

    const votes = await redis.zincrby(pollId, 1, chosenOptionId);

    voting.publish(pollId, {
      pollOptionId: chosenOptionId,
      votes: Number(votes),
    });

    return res.status(201).send({ sessionId });
  });
};
