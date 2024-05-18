const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { Kafka } = require('kafkajs');

// Load proto files for voitures and TV shows
const voitureProtoPath = 'voiture.proto';
const camionProtoPath = 'camion.proto';
const resolvers = require('./resolvers');
const typeDefs = require('./schema');

// Create a new Express application
const app = express();
const voitureProtoDefinition = protoLoader.loadSync(voitureProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const camionProtoDefinition = protoLoader.loadSync(camionProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
app.use(bodyParser.json());
const voitureProto = grpc.loadPackageDefinition(voitureProtoDefinition).voiture;
const camionProto = grpc.loadPackageDefinition(camionProtoDefinition).camion;

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092'] 
});

const consumer = kafka.consumer({ groupId: 'api-gateway-consumer' });

consumer.subscribe({ topic: 'voitures-topic' });
consumer.subscribe({ topic: 'tv-shows-topic' });

(async () => {
    await consumer.connect();
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(`Received message: ${message.value.toString()}, from topic: ${topic}`);
        },
    });
})();

// Create ApolloServer instance with imported schema and resolvers
const server = new ApolloServer({ typeDefs, resolvers });

// Apply ApolloServer middleware to Express application
server.start().then(() => {
    app.use(
        cors(),
        bodyParser.json(),
        expressMiddleware(server),
    );
});

app.get('/voitures', (req, res) => {
    const client = new voitureProto.voitureService('localhost:50051',
        grpc.credentials.createInsecure());
    client.searchvoitures({}, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.voitures);
        }
    });
});

app.get('/voitures/:id', (req, res) => {
    const client = new voitureProto.voitureService('localhost:50051',
        grpc.credentials.createInsecure());
    const id = req.params.id;
    client.getvoiture({ voiture_id: id }, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.voiture);
        }
    });
});

app.post('/voitures/add', (req, res) => {
    const client = new voitureProto.voitureService('localhost:50051',
        grpc.credentials.createInsecure());
    const data = req.body;
    const titre=data.title;
    const desc= data.description
    client.addvoiture({ title: titre,description:desc }, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.voiture);
        }
    });
});

app.get('/camions', (req, res) => {
    const client = new camionProto.camionService('localhost:50052',
        grpc.credentials.createInsecure());
    client.searchcamions({}, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.tv_shows);
        }
    });
});

app.get('/camions/:id', (req, res) => {
    const client = new camionProto.camionService('localhost:50052',
        grpc.credentials.createInsecure());
    const id = req.params.id;
    client.getcamion({ tv_show_id: id }, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.tv_show);
        }
    });
});

app.post('/camions/add', (req, res) => {
    const client = new camionProto.camionService('localhost:50052',
        grpc.credentials.createInsecure());
    const data = req.body;
    const titre=data.title;
    const desc= data.description
    client.addcamion({ title: titre,description:desc }, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.tv_show);
        }
    });
});

// Start Express application
const port = 3000;
app.listen(port, () => {
    console.log(`API Gateway is running on port ${port}`);
});
