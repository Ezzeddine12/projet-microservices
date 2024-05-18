const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
//const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const voiture = require('./models/voitureModel');
const { Kafka } = require('kafkajs');

const voitureProtoPath = 'voiture.proto';
const voitureProtoDefinition = protoLoader.loadSync(voitureProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
});

const producer = kafka.producer();
const voitureProto = grpc.loadPackageDefinition(voitureProtoDefinition).voiture;

const url = 'mongodb://localhost:27017/voituresDB';
//const dbName = 'voituresDB';

mongoose.connect(url)
    .then(() => {
        console.log('connected to database!');
    }).catch((err) => {
        console.log(err);
    })

const voitureService = {
    getvoiture: async (call, callback) => {
        await producer.connect();
        try {
            const voitureId = call.request.voiture_id;
            // console.log(call.request);
            const voiture = await voiture.findOne({ _id: voitureId }).exec();
            //console.log(voitureId);
            await producer.send({
                topic: 'voitures-topic',
                messages: [{ value: 'Searched for TV show id : '+voitureId.toString() }],
            });
            if (!voiture) {
                
                callback({ code: grpc.status.NOT_FOUND, message: 'voiture not found' });
                return;
            }
            callback(null, { voiture });
        } catch (error) {
            //await producer.connect();
            await producer.send({
                topic: 'voitures-topic',
                messages: [{ value: `Error occurred while fetching voiture: ${error}` }],
            });
            callback({ code: grpc.status.INTERNAL, message: 'Error occurred while fetching voiture' });
        }
    },
    searchvoitures: async(call, callback) => {
        try{
        const voitures = await voiture.find({}).exec();
        await producer.connect();
        await producer.send({
            topic: 'voitures-topic',
            messages: [{ value: 'Searched for voitures' }],
        });

        callback(null, { voitures });
        }catch(error){
            await producer.connect();
            await producer.send({
                topic: 'voitures-topic',
                messages: [{ value: `Error occurred while fetching voitures: ${error}` }],
            });

            callback({ code: grpc.status.INTERNAL, message: 'Error occurred while fetching voitures' });
        }

       /* voiture.find({})
            .exec()
            .then(voitures => {
                callback(null, { voitures });
            })
            .catch(error => {
                callback({ code: grpc.status.INTERNAL, message: 'Error occurred while fetching voitures' });
            });*/
    },
    addvoiture: async (call, callback) => {
        /* const { title, description } = call.request;
         const newvoiture = new voiture({ title, description });
         newvoiture.save()
             .then(savedvoiture => {
                 callback(null, { voiture: savedvoiture });
             })
             .catch(error => {
                 callback({ code: grpc.status.INTERNAL, message: 'Error occurred while adding voiture' });
             });*/
        const { title, description } = call.request;
        console.log(call.request);
        const newvoiture = new voiture({ title, description });

        try {
            await producer.connect();

            await producer.send({
                topic: 'voitures-topic',
                messages: [{ value: JSON.stringify(newvoiture) }],
            });

            await producer.disconnect();

            const savedvoiture = await newvoiture.save();

            callback(null, { voiture: savedvoiture });
        } catch (error) {
            callback({ code: grpc.status.INTERNAL, message: 'Error occurred while adding tv show' });
        }
    }


};

const server = new grpc.Server();
server.addService(voitureProto.voitureService.service, voitureService);
const port = 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
    (err, port) => {
        if (err) {
            console.error('Failed to bind server:', err);
            return;
        }
        console.log(`Server is running on port ${port}`);
        server.start();
    });
console.log(`voiture microservice is running on port ${port}`);