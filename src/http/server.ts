import fastify from 'fastify';
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
import { createPoll, getPoll, voteOnPoll } from './routes';
import { pollResults } from './ws';

const PORT = Number(process.env.PORT) || 3000;
const SECRET = process.env.SECRET_COOKIE;

const app = fastify();

app.register(cookie, {
  secret: SECRET,
  hook: 'onRequest',
});
app.register(websocket);

app.register(createPoll);
app.register(getPoll);
app.register(voteOnPoll);
app.register(pollResults);

app.listen({ port: PORT }).then(() => {
  console.log(`Listening on port ${PORT}`);
});
