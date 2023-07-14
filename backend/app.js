const express = require('express');
// const http = require('http');
const app = express();
// const httpServer = http.createServer(app);
const cors = require('cors');

const { json } = require('body-parser');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
// const { startStandaloneServer } = require('@apollo/server/standalone');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/apollo');
mongoose.connection.on('open', () => {
	console.log(`SERVER: Succesfully connected to MongoDB`);
});

const { typeDefs, resolvers } = require('./schema.js');

const server = new ApolloServer({
	typeDefs,
	resolvers,
	context: ({ req }) => {
		console.log(req.headers);
	},
	// plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

const corsOptions = {
	origin: 'http://localhost:3000',
};

// await server.start();

const main = async () => {
	await server.start();

	app.use('/', cors(corsOptions), json(), expressMiddleware(server));

	// app.get('/', (req, res) => {
	// 	console.log('hi');
	// });
	app.listen({ port: 4000 }, () => {
		console.log(`SERVER: Listening on localhost:4000`);
	});
};

main();
// server.applyMiddleware({ app });

// server.start().then(() => {
// 	app.use('/', cors(corsOptions), bodyParser.json(), expressMiddleware(server));

// 	// app.use('/', cors({ origin: ['http://localhost:3000/'] }), json(), expressMiddleware(server));

// 	httpServer.listen({ port: 4000 }, () => {
// 		console.log(`🚀 Server ready at http://localhost:4000/`);
// 	});
// });
