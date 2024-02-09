import { FastifyInstance } from 'fastify';
import { voting } from '../../utils';
import z from 'zod';

export const pollResults = async (app: FastifyInstance) => {
  app.get('/polls/:id/results', { websocket: true }, (conn, req) => {
    const pollResultsParams = z.object({
      id: z.string().uuid(),
    });
    const { id: pollId } = pollResultsParams.parse(req.params);

    voting.subscribe(pollId, (message) => {
      conn.socket.send(JSON.stringify(message));
    });
  });
};
