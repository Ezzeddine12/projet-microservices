// camionMicroservice.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
// Charger le fichier camion.proto
const camionProtoPath = 'camion.proto';
const mongoose = require('mongoose');
const camions = require('./models/camionsModel');
const { Kafka } = require('kafkajs');

const camionProtoDefinition = protoLoader.loadSync(camionProtoPath, {
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

const camionProto = grpc.loadPackageDefinition(camionProtoDefinition).camion;
const url = 'mongodb://localhost:27017/camions';
//const dbName = 'voituresDB';

mongoose.connect(url)
    .then(() => {
        console.log('connected to database!');
    }).catch((err) => {
        console.log(err);
    })

/*const tv_shows = [
    {
        id: '1',
        title: 'Exemple de série TV 1',
        description: 'Ceci est le premier exemple de série TV.',
    },
    {
        id: '2',
        title: 'Exemple de série TV 2',
        description: 'Ceci est le deuxième exemple de série TV.',
    },
];*/

const camionService = {
    getcamion: async (call, callback) => {
        try {
            const camionId = call.request.tv_show_id;
            //console.log(call.request);
            const camion = await camions.findOne({ _id: camionId }).exec();
            await producer.connect();
            await producer.send({
                topic: 'tv-shows-topic',
                messages: [{ value: 'Searched for TV show id : '+camionId.toString() }],
            });

            if (!camion) {
                callback({ code: grpc.status.NOT_FOUND, message: 'Tv Show not found' });
                return;
            }
            callback(null, { tv_show: camion });

        } catch (error) {
            await producer.connect();
            await producer.send({
                topic: 'tv-shows-topic',
                messages: [{ value: `Error occurred while fetching tv shows: ${error}` }],
            });
            callback({ code: grpc.status.INTERNAL, message: 'Error occurred while fetching tv show' });
        }

        //const tv_show=getcamionById(camionId);
        //console.log(tv_show);
        // if (!tv_show) {
        // callback({ code: grpc.status.NOT_FOUND, message: 'Tv Show not found' });
        //  return;
        // }
        /*const tv_show = {
            id: call.request.tv_show_id,
            title: 'Exemple de série TV',
            description: 'Ceci est un exemple de série TV.',
        };*/
        //callback(null, { tv_show });
    },
    searchcamions: async (call, callback) => {
        try {
            const camions = await camions.find({}).exec();

            await producer.connect();
            await producer.send({
                topic: 'tv-shows-topic',
                messages: [{ value: 'Searched for TV shows' }],
            });

            callback(null, { tv_shows: camions });
        } catch (error) {
            await producer.connect();
            await producer.send({
                topic: 'tv-shows-topic',
                messages: [{ value: `Error occurred while fetching tv shows: ${error}` }],
            });

            callback({ code: grpc.status.INTERNAL, message: 'Error occurred while fetching tv shows' });
        }
    },
    
    addcamion: async (call, callback) => {
        /*const id=tv_shows.length+1;
        const titre = call.request.title;
        const desc = call.request.description;
        const newcamion ={
            id:id,
            title:titre,
            description:desc
        }
        console.log(newcamion);
        newcamion.id=id;
        tv_shows.push(newcamion);
        callback(null, { tv_show:newcamion});*/
        /*const { title, description } = call.request;
        console.log(call.request);
        const newcamion = new camions({ title, description });
        await newcamion.save()
            .then(savedcamion => {
                producer.connect();
                producer.send({
                    topic: 'tv-shows-topic',
                    messages: [{ value: JSON.stringify(newcamion) }],
                });
                //producer.disconnect();
                callback(null, { tv_show: savedcamion });
            })
            .catch(error => {
                callback({ code: grpc.status.INTERNAL, message: 'Error occurred while adding tv show' });
            });*/
        const { title, description } = call.request;
        console.log(call.request);
        const newcamion = new camions({ title, description });

        try {
            await producer.connect();

            await producer.send({
                topic: 'tv-shows-topic',
                messages: [{ value: JSON.stringify(newcamion) }],
            });

            await producer.disconnect();

            const savedcamion = await newcamion.save();

            callback(null, { tv_show: savedcamion });
        } catch (error) {
            callback({ code: grpc.status.INTERNAL, message: 'Error occurred while adding tv show' });
        }
    }


};

function getcamionById(camionId) {

    return tv_shows.find(tv_show => tv_show.id === camionId);
}

// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(camionProto.camionService.service, camionService);
const port = 50052;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
    (err, port) => {
        if (err) {
            console.error('Échec de la liaison du serveur:', err);
            return;
        }
        console.log(`Le serveur s'exécute sur le port ${port}`);
        server.start();
    });
console.log(`Microservice de séries TV en cours d'exécution sur le port
${port}`);